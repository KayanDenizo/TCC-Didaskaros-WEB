import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";
import { env } from "../env.js";
import { REGRAS_CPS, hhmm, intervaloAula, type Aula, type DadosGeracao, type Violacao } from "./tipos.js";
import { validarGrade } from "./validador.js";

const MAX_TENTATIVAS = 3;

const RespostaSchema = z.object({
  aulas: z.array(z.object({
    turmaId: z.number().int(),
    disciplinaId: z.number().int(),
    professorId: z.number().int(),
    salaId: z.number().int(),
    dia: z.number().int(),
    ordem: z.number().int(),
  })),
  observacoes: z.string(),
});

const SYSTEM = `Você monta grades horárias semanais para unidades do Centro Paula Souza (ETECs e FATECs).

Você recebe, em JSON, todas as turmas de um turno com a carga horária de cada disciplina, os professores e as salas.
A semana tem 5 dias (dia 0 = segunda … 4 = sexta) e cada dia tem "aulasPorDia" aulas (ordem 0 = primeira aula);
"horarios" traz o início e o fim real de cada aula do turno.
Cada professor traz: disciplinas habilitadas, pontuação CPS, tipo de contrato, horários indisponíveis, horários
preferidos e a evitar, "ocupacoes" (períodos em que ele já trabalha em outro turno desta unidade ou em outra
unidade, com início e fim) e "aulasEmOutrosTurnos".

Restrições duras — a grade só é aceita se TODAS forem respeitadas (um validador automático confere):
1. Cada turma tem no máximo uma aula por horário.
2. Cada professor está em no máximo uma turma por horário.
3. Cada sala recebe no máximo uma turma por horário.
4. Cada disciplina de cada turma recebe exatamente o número de aulas semanais da carga horária.
5. O professor precisa ser habilitado para a disciplina; se a carga já indica um professorId, use esse professor
   (a atribuição de aulas do CPS já foi feita e não pode ser mudada).
6. Uma disciplina de uma turma é dada sempre pelo mesmo professor na semana inteira.
7. Nunca aloque um professor num horário em que ele está indisponível.
8. Disciplina com exigeLaboratorio = true só em sala do tipo LABORATORIO.
9. A sala precisa ter capacidade para a quantidade de alunos da turma.
Regras de jornada do CPS (somando as aulas desta grade com as "ocupacoes" do professor; cada aula conta 60 min):
10. A aula não pode coincidir com nenhuma ocupação do professor.
11. Interjornada: entre o fim do último trabalho de um dia e o início do primeiro do dia seguinte, no mínimo
    ${REGRAS_CPS.interjornadaMin / 60} horas.
12. No máximo ${REGRAS_CPS.jornadaDiariaMaxMin / 60} horas de trabalho por dia.
13. Se o dia passar de ${REGRAS_CPS.jornadaSemRefeicaoMin / 60} horas, precisa haver uma pausa de pelo menos
    ${REGRAS_CPS.refeicaoMin} minutos entre dois períodos de trabalho (refeição).
14. No máximo ${REGRAS_CPS.aulasSemanaisMax} aulas na semana, somando "aulasEmOutrosTurnos".

Quando a carga não tem professorId, siga a ordem de classificação do CPS (Deliberação CEETEPS 23/2015):
professor com contrato INDETERMINADO antes de DETERMINADO e, dentro de cada grupo, maior pontuação CPS primeiro —
desde que isso não quebre nenhuma restrição dura.

Restrições moles — depois das duras, atenda o melhor possível, nesta ordem:
- preferências da coordenação;
- horários "preferidos" e "evitar" de cada professor (os de maior pontuação CPS têm prioridade quando houver disputa);
- evitar janelas (horários vagos entre duas aulas no mesmo dia) para professores e turmas;
- não concentrar todas as aulas de uma disciplina no mesmo dia.

Devolva a grade completa do turno (todas as turmas) em "aulas", uma entrada por aula, usando os ids recebidos.
Em "observacoes", explique em até 5 frases curtas, em português, as principais decisões e qualquer preferência que
não pôde ser atendida.`;

export interface ResultadoGeracao {
  aulas: Aula[];
  observacoes: string;
  violacoes: Violacao[];
  tentativas: number;
  modelo: string;
}

export class GeracaoError extends Error {}

/** traduz os erros da api pra uma msg q o coordenador entenda */
function traduzirErroApi(err: unknown) {
  if (err instanceof Anthropic.AuthenticationError) return new GeracaoError("Chave da API de IA inválida (ANTHROPIC_API_KEY no backend/.env).");
  if (err instanceof Anthropic.RateLimitError) return new GeracaoError("Limite de uso da Didáskaros IA atingido. Tente em alguns minutos.");
  if (err instanceof Anthropic.APIConnectionError) return new GeracaoError("Sem conexão com o serviço da Didáskaros IA.");
  if (err instanceof Anthropic.APIError) return new GeracaoError(`O serviço da Didáskaros IA retornou erro ${err.status}: ${err.message}`);
  return err;
}

/**
 * chamada padrao a Claude: usa stream pq a resposta demora e senao da timeout no http
 * (o finalMessage() junta tudo no final), saida em JSON no formato do schema e,
 * se o modelo recusar por engano (falso positivo de seguranca), a api tenta de novo com o modelo reserva
 */
async function chamarClaude(
  system: string,
  messages: Anthropic.Beta.BetaMessageParam[],
  schema: z.ZodType,
  { effort = env.claudeEffort, msgCortada = "A resposta da Didáskaros IA foi cortada por tamanho." } = {},
) {
  let resposta: Anthropic.Beta.BetaMessage;
  try {
    resposta = await new Anthropic().beta.messages
      .stream({
        model: env.claudeModel,
        max_tokens: 64000,
        system,
        messages,
        output_config: { effort, format: zodOutputFormat(schema) },
        betas: ["server-side-fallback-2026-07-01"],
        fallbacks: "default",
      })
      .finalMessage();
  } catch (err) {
    throw traduzirErroApi(err);
  }
  if (resposta.stop_reason === "refusal") throw new GeracaoError("A Didáskaros IA recusou a solicitação.");
  if (resposta.stop_reason === "max_tokens") throw new GeracaoError(msgCortada);
  const texto = resposta.content.flatMap((b) => (b.type === "text" ? [b.text] : [])).join("");
  return { resposta, texto };
}

function montarEntrada(dados: DadosGeracao) {
  return JSON.stringify({
    turno: dados.turno,
    aulasPorDia: dados.aulasPorDia,
    horarios: Array.from({ length: dados.aulasPorDia }, (_, ordem) => {
      const { inicio, fim } = intervaloAula(dados.turno, ordem);
      return { ordem, inicio: hhmm(inicio), fim: hhmm(fim) };
    }),
    turmas: dados.turmas,
    disciplinas: dados.disciplinas,
    professores: dados.professores.map((p) => ({
      ...p,
      ocupacoes: p.ocupacoes.map((o) => ({ dia: o.dia, inicio: hhmm(o.inicio), fim: hhmm(o.fim), origem: o.origem })),
    })),
    salas: dados.salas,
    preferenciasDaCoordenacao: dados.preferencias,
  });
}

function descreverViolacoes(violacoes: Violacao[]) {
  const lista = violacoes.slice(0, 40).map((v) => `- ${v.mensagem}`).join("\n");
  const resto = violacoes.length > 40 ? `\n… e mais ${violacoes.length - 40}.` : "";
  return `O validador automático encontrou ${violacoes.length} violação(ões) de restrições duras:\n${lista}${resto}\n\n` +
    "Corrija todas e devolva a grade completa novamente (todas as turmas, não só as aulas alteradas).";
}

// gera a grade e passa no validador. se der conflito manda os erros de volta pra IA
// corrigir (ate MAX_TENTATIVAS) e fica com a tentativa q teve menos conflito
export async function gerarComClaude(
  dados: DadosGeracao,
  onProgresso: (etapa: string, tentativa: number) => void,
): Promise<ResultadoGeracao> {
  const messages: Anthropic.Beta.BetaMessageParam[] = [
    { role: "user", content: `Monte a grade deste turno:\n\n${montarEntrada(dados)}` },
  ];
  let melhor: ResultadoGeracao | null = null;

  for (let tentativa = 1; tentativa <= MAX_TENTATIVAS; tentativa++) {
    onProgresso(tentativa === 1 ? "Montando a grade" : "Corrigindo os conflitos apontados", tentativa);

    const { resposta, texto } = await chamarClaude(SYSTEM, messages, RespostaSchema, {
      msgCortada: "A resposta da Didáskaros IA foi cortada por tamanho. Reduza o número de turmas do turno.",
    });
    messages.push({ role: "assistant", content: resposta.content });

    let parsed: z.infer<typeof RespostaSchema>;
    try {
      parsed = RespostaSchema.parse(JSON.parse(texto));
    } catch {
      messages.push({ role: "user", content: "A resposta não era um JSON válido no formato pedido. Devolva a grade completa novamente." });
      continue;
    }

    onProgresso("Validando conflitos", tentativa);
    const violacoes = validarGrade(dados, parsed.aulas);
    const atual = { ...parsed, violacoes, tentativas: tentativa, modelo: resposta.model };
    if (!melhor || violacoes.length < melhor.violacoes.length) melhor = atual;
    if (!violacoes.length) break;

    messages.push({ role: "user", content: descreverViolacoes(violacoes) });
  }

  if (!melhor) throw new GeracaoError("A Didáskaros IA não devolveu uma grade válida após várias tentativas.");
  return melhor;
}

// ajuste pelo chat: se o pedido mudar a grade a IA devolve ela inteira,
// passa pelo mesmo validador e vira uma versao nova (rascunho)

const AjusteSchema = z.object({
  resposta: z.string(),
  alterou: z.boolean(),
  aulas: RespostaSchema.shape.aulas,
});

const SYSTEM_AJUSTE = `${SYSTEM}

---

Agora você está em modo de AJUSTE, conversando com o coordenador sobre uma grade que já existe.
Você recebe os dados do turno, a grade atual ("gradeAtual"), a conversa até aqui e o novo pedido.

- Se o pedido muda a grade (trocar aulas de horário, mover uma disciplina, liberar um dia de um professor…),
  faça a MENOR mudança possível, mantenha todo o resto igual, devolva alterou = true e a grade completa em "aulas".
- Se é só uma pergunta ("por que a Física ficou na quinta?", "o que falta cadastrar?"), responda com alterou = false
  e "aulas" vazia.
- Se o pedido quebraria uma restrição dura, não aplique: explique em "resposta" qual regra impede e sugira uma
  alternativa que funcione.
- Se o pedido depende de um cadastro (professor novo, disciplina, sala, indisponibilidade, carga horária), diga
  exatamente o que o coordenador precisa cadastrar ou editar e em qual tela (Professores, Turmas, Disciplinas ou
  Salas). Você não altera cadastros.
- "problemasNosCadastros" lista o que já se sabe que está faltando ou inconsistente: avise o coordenador quando for
  relevante para o pedido.

Em "resposta", escreva em português, direto ao coordenador, em até 6 frases curtas. Diga o que mudou (turma,
disciplina, dia e horário) ou por que não mudou. Use os nomes (não os ids).`;

export interface MensagemAjuste {
  papel: "coordenador" | "ia";
  texto: string;
}

export interface ResultadoAjuste {
  resposta: string;
  alterou: boolean;
  aulas: Aula[];
  violacoes: Violacao[];
  tentativas: number;
  modelo: string;
}

export async function ajustarComClaude(
  dados: DadosGeracao,
  gradeAtual: Aula[],
  historico: MensagemAjuste[],
  pedido: string,
  problemasNosCadastros: string[],
  onProgresso: (etapa: string, tentativa: number) => void,
): Promise<ResultadoAjuste> {
  const conversa = historico.map((m) => `${m.papel === "coordenador" ? "Coordenador" : "IA"}: ${m.texto}`).join("\n");
  const messages: Anthropic.Beta.BetaMessageParam[] = [{
    role: "user",
    content:
      `Dados do turno:\n${montarEntrada(dados)}\n\n` +
      `gradeAtual:\n${JSON.stringify(gradeAtual)}\n\n` +
      `problemasNosCadastros:\n${JSON.stringify(problemasNosCadastros)}\n\n` +
      (conversa ? `Conversa até aqui:\n${conversa}\n\n` : "") +
      `Novo pedido do coordenador:\n${pedido}`,
  }];
  let melhor: ResultadoAjuste | null = null;

  for (let tentativa = 1; tentativa <= MAX_TENTATIVAS; tentativa++) {
    onProgresso(tentativa === 1 ? "Analisando o pedido" : "Corrigindo os conflitos apontados", tentativa);

    const { resposta, texto } = await chamarClaude(SYSTEM_AJUSTE, messages, AjusteSchema);
    messages.push({ role: "assistant", content: resposta.content });

    let parsed: z.infer<typeof AjusteSchema>;
    try {
      parsed = AjusteSchema.parse(JSON.parse(texto));
    } catch {
      messages.push({ role: "user", content: "A resposta não era um JSON válido no formato pedido. Responda novamente." });
      continue;
    }

    // so foi uma pergunta, nao tem nada pra validar
    if (!parsed.alterou) return { ...parsed, aulas: [], violacoes: [], tentativas: tentativa, modelo: resposta.model };

    onProgresso("Validando conflitos", tentativa);
    const violacoes = validarGrade(dados, parsed.aulas);
    const atual = { ...parsed, violacoes, tentativas: tentativa, modelo: resposta.model };
    if (!melhor || violacoes.length < melhor.violacoes.length) melhor = atual;
    if (!violacoes.length) break;

    messages.push({ role: "user", content: descreverViolacoes(violacoes) });
  }

  if (!melhor) throw new GeracaoError("A Didáskaros IA não conseguiu responder. Tente reformular o pedido.");
  return melhor;
}

// analise da edicao manual: o coordenador arrastou aulas na tela e a IA diz se ficou ruim.
// quem diz se tem conflito eh o validador; a IA explica, sugere como resolver e olha a qualidade

const AnaliseSchema = z.object({
  avaliacao: z.enum(["boa", "atencao", "ruim"]),
  resumo: z.string(),
  avisos: z.array(z.string()),
  sugestoes: z.array(z.string()),
});

export type AnaliseEdicao = z.infer<typeof AnaliseSchema>;

/** a analise roda a cada pausa na edicao, entao vai com menos esforco pra responder rapido */
const EFFORT_ANALISE = "medium";

const SYSTEM_ANALISE = `Você revisa grades horárias de unidades do Centro Paula Souza (ETECs e FATECs).

O coordenador gerou a grade de um turno e depois mudou aulas de horário à mão, arrastando-as na tela. Sua tarefa é
avisar se essas mudanças criaram conflito ou deixaram a grade pior. Você não altera a grade: só avalia e sugere.

Você recebe em JSON:
- os dados do turno: turmas com a carga horária, disciplinas, professores (disciplinas habilitadas, horários
  indisponíveis, "preferidos", "evitar" e "ocupacoes" em outros turnos ou unidades), salas, os horários do turno e as
  preferências da coordenação. Dia 0 = segunda … 4 = sexta; ordem 0 = primeira aula do turno;
- "gradeEditada": a grade inteira depois das mudanças, uma entrada por aula;
- "mudancas": as aulas que o coordenador mudou de horário;
- "conflitos": as violações de restrições duras que o validador automático encontrou na grade editada;
- "janelas": horários vagos entre aulas no mesmo dia, antes e depois das mudanças, para turmas e professores.

"conflitos" é a fonte da verdade sobre as restrições duras: não conteste e não invente outros conflitos duros.

Como avaliar:
- Se "conflitos" não estiver vazio, a avaliação é "ruim". Explique cada conflito em linguagem simples e sugira um
  movimento concreto que o resolve (qual aula, de qual dia e horário para qual). Antes de sugerir, confira nos dados
  que o novo horário não cria outro conflito: turma, professor e sala livres, professor disponível e sem ocupação.
- Depois, avalie a qualidade do que mudou (restrições moles): janelas novas para turmas ou professores; disciplina
  concentrada demais num dia ou com aulas seguidas demais; aula em horário que o professor quer evitar ou tirada de
  um horário preferido; preferências da coordenação que deixaram de ser atendidas.
- "boa": as mudanças não criaram conflito nem pioraram nada que importe. "atencao": sem conflitos, mas alguma
  restrição mole piorou. "ruim": há conflitos ou a grade ficou claramente pior.
- Fale só do que as mudanças afetaram. Não critique partes da grade que o coordenador não mexeu, a não ser que uma
  mudança tenha piorado essas partes.

Escreva em português, direto ao coordenador, usando nomes (turmas, disciplinas, professores, dias e horários), nunca ids.
- "resumo": uma ou duas frases curtas com o veredito.
- "avisos": até 5 itens, um problema por item. Lista vazia se não houver problema.
- "sugestoes": até 3 movimentos concretos que resolvem os problemas ou melhoram a grade. Lista vazia se não houver.`;

export async function analisarEdicaoComClaude(
  dados: DadosGeracao,
  gradeEditada: Aula[],
  mudancas: string[],
  conflitos: Violacao[],
  janelas: { antes: { janelasTurmas: number; janelasProfessores: number }; depois: { janelasTurmas: number; janelasProfessores: number } },
  onProgresso: (etapa: string, tentativa: number) => void,
): Promise<AnaliseEdicao & { modelo: string }> {
  const messages: Anthropic.Beta.BetaMessageParam[] = [{
    role: "user",
    content:
      `Dados do turno:\n${montarEntrada(dados)}\n\n` +
      `gradeEditada:\n${JSON.stringify(gradeEditada)}\n\n` +
      `mudancas:\n${JSON.stringify(mudancas)}\n\n` +
      `conflitos:\n${JSON.stringify(conflitos.map((c) => c.mensagem))}\n\n` +
      `janelas:\n${JSON.stringify(janelas)}`,
  }];

  for (let tentativa = 1; tentativa <= 2; tentativa++) {
    onProgresso("Analisando as mudanças", tentativa);
    const { resposta, texto } = await chamarClaude(SYSTEM_ANALISE, messages, AnaliseSchema, { effort: EFFORT_ANALISE });
    try {
      const analise = AnaliseSchema.parse(JSON.parse(texto));
      // com conflito do validador a grade nunca eh "boa", mesmo q a IA ache q eh
      if (conflitos.length) analise.avaliacao = "ruim";
      return { ...analise, modelo: resposta.model };
    } catch {
      messages.push(
        { role: "assistant", content: resposta.content },
        { role: "user", content: "A resposta não era um JSON válido no formato pedido. Responda novamente." },
      );
    }
  }
  throw new GeracaoError("A Didáskaros IA não conseguiu analisar as mudanças.");
}
