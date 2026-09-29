import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";
import { env } from "../env.js";
import { type Aula, type DadosGeracao, type Violacao } from "./tipos.js";
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

Você recebe, em JSON, todas as turmas de um turno com a carga horária de cada disciplina, os professores
(disciplinas habilitadas, pontuação CPS e horários em que estão indisponíveis) e as salas.
A semana tem 5 dias (dia 0 = segunda … 4 = sexta) e cada dia tem "aulasPorDia" aulas (ordem 0 = primeira aula).

Restrições duras — a grade só é aceita se TODAS forem respeitadas (um validador automático confere):
1. Cada turma tem no máximo uma aula por horário.
2. Cada professor está em no máximo uma turma por horário.
3. Cada sala recebe no máximo uma turma por horário.
4. Cada disciplina de cada turma recebe exatamente o número de aulas semanais da carga horária.
5. O professor precisa ser habilitado para a disciplina; se a carga já indica um professorId, use esse professor.
6. Uma disciplina de uma turma é dada sempre pelo mesmo professor na semana inteira.
7. Nunca aloque um professor num horário em que ele está indisponível.
8. Disciplina com exigeLaboratorio = true só em sala do tipo LABORATORIO.
9. A sala precisa ter capacidade para a quantidade de alunos da turma.

Quando mais de um professor estiver habilitado, prefira o de maior pontuação CPS, mas distribua a carga para não
sobrecarregar ninguém. Depois das restrições duras, atenda o melhor possível às preferências da coordenação.

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

function montarEntrada(dados: DadosGeracao) {
  return JSON.stringify({
    turno: dados.turno,
    aulasPorDia: dados.aulasPorDia,
    turmas: dados.turmas,
    disciplinas: dados.disciplinas,
    professores: dados.professores,
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

/**
 * Gera a grade com a Claude e confere com o validador independente.
 * Se houver violações, devolve os erros para o modelo corrigir (até MAX_TENTATIVAS).
 * Retorna a melhor grade encontrada — com as violações que sobraram, se houver.
 */
export async function gerarComClaude(
  dados: DadosGeracao,
  onProgresso: (etapa: string, tentativa: number) => void,
): Promise<ResultadoGeracao> {
  const client = new Anthropic();
  const messages: Anthropic.Beta.BetaMessageParam[] = [
    { role: "user", content: `Monte a grade deste turno:\n\n${montarEntrada(dados)}` },
  ];
  let melhor: ResultadoGeracao | null = null;

  for (let tentativa = 1; tentativa <= MAX_TENTATIVAS; tentativa++) {
    onProgresso(tentativa === 1 ? "Claude está montando a grade" : "Claude está corrigindo os conflitos apontados", tentativa);

    let resposta: Anthropic.Beta.BetaMessage;
    try {
      // Streaming evita timeout HTTP em respostas longas; finalMessage() junta tudo no fim.
      resposta = await client.beta.messages
        .stream({
          model: env.claudeModel,
          max_tokens: 64000,
          system: SYSTEM,
          messages,
          output_config: { effort: env.claudeEffort, format: zodOutputFormat(RespostaSchema) },
          // Se o modelo recusar por falso positivo de segurança, a API refaz com o modelo reserva.
          betas: ["server-side-fallback-2026-07-01"],
          fallbacks: "default",
        })
        .finalMessage();
    } catch (err) {
      if (err instanceof Anthropic.AuthenticationError) throw new GeracaoError("Chave da API da Claude inválida (ANTHROPIC_API_KEY).");
      if (err instanceof Anthropic.RateLimitError) throw new GeracaoError("Limite de uso da API da Claude atingido. Tente em alguns minutos.");
      if (err instanceof Anthropic.APIConnectionError) throw new GeracaoError("Sem conexão com a API da Claude.");
      if (err instanceof Anthropic.APIError) throw new GeracaoError(`A API da Claude retornou erro ${err.status}: ${err.message}`);
      throw err;
    }

    if (resposta.stop_reason === "refusal") throw new GeracaoError("A Claude recusou a solicitação.");
    if (resposta.stop_reason === "max_tokens") throw new GeracaoError("A resposta da Claude foi cortada por tamanho. Reduza o número de turmas do turno.");

    const texto = resposta.content.flatMap((b) => (b.type === "text" ? [b.text] : [])).join("");
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

  if (!melhor) throw new GeracaoError("A Claude não devolveu uma grade válida após várias tentativas.");
  return melhor;
}
