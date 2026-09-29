import { useState, type FormEvent, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { api, mensagemErro } from "../api/client";
import type { Usuario } from "../api/types";
import { useAuth } from "../auth/AuthContext";
import { Chips, Field, Input, PasswordInput, SectionTitle, Select, inputClass } from "../components/form";
import { Alert, Button, Card, LinkButton } from "../components/ui";
import { calcStrength, maskCPF, maskPhone, maskRF, validarCPF } from "../lib/masks";
import { CATEGORIAS, CURSOS, INITIAL, NIVEIS_ACESSO, TIPOS_INST, TURNOS, type FormCadastro } from "./cadastro-data";

type Erros = Partial<Record<keyof FormCadastro, string>>;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function idade(dataIso: string) {
  const nasc = new Date(dataIso);
  const hoje = new Date();
  const fezAniversario = hoje.getMonth() > nasc.getMonth() || (hoje.getMonth() === nasc.getMonth() && hoje.getDate() >= nasc.getDate());
  return hoje.getFullYear() - nasc.getFullYear() - (fezAniversario ? 0 : 1);
}

function validar(f: FormCadastro): Erros {
  const e: Erros = {};
  if (f.nomeCompleto.trim().split(/\s+/).length < 2) e.nomeCompleto = "Informe o nome completo (nome e sobrenome).";
  if (!validarCPF(f.cpf)) e.cpf = "CPF inválido — verifique os dígitos.";
  if (!f.dataNascimento) e.dataNascimento = "Data de nascimento é obrigatória.";
  else if (idade(f.dataNascimento) < 18) e.dataNascimento = "O coordenador deve ter pelo menos 18 anos.";
  else if (idade(f.dataNascimento) > 80) e.dataNascimento = "Verifique a data de nascimento informada.";
  if (f.telefone.replace(/\D/g, "").length < 10) e.telefone = "Telefone inválido — informe DDD + número.";
  if (!EMAIL.test(f.emailInstitucional)) e.emailInstitucional = "Informe um e-mail válido.";
  if (f.emailPessoal && !EMAIL.test(f.emailPessoal)) e.emailPessoal = "Formato de e-mail inválido.";
  if (f.senha.length < 8) e.senha = "A senha deve ter no mínimo 8 caracteres.";
  if (f.senha !== f.confirmarSenha) e.confirmarSenha = "As senhas não coincidem.";
  if (!f.tipoInstituicao) e.tipoInstituicao = "Selecione o tipo de instituição.";
  if (!f.unidade.trim()) e.unidade = "Nome da unidade é obrigatório.";
  if (!f.municipio.trim()) e.municipio = "Município é obrigatório.";
  if (!f.curso) e.curso = "Selecione o curso.";
  if (!f.turnosResponsavel.length) e.turnosResponsavel = "Selecione ao menos um turno.";
  if (f.registroFuncional.length < 6) e.registroFuncional = "Registro funcional deve ter no mínimo 6 dígitos.";
  if (!f.categoriaFuncional) e.categoriaFuncional = "Selecione a categoria funcional.";
  if (!f.dataInicio) e.dataInicio = "Data de início é obrigatória.";
  else if (new Date(f.dataInicio) > new Date()) e.dataInicio = "A data de início não pode ser no futuro.";
  return e;
}

const FORCA = [
  { label: "", cor: "" },
  { label: "Muito curta", cor: "bg-red-400" },
  { label: "Fraca — adicione maiúsculas e números", cor: "bg-amber-400" },
  { label: "Boa", cor: "bg-blue-500" },
  { label: "Forte", cor: "bg-emerald-500" },
];

function Secao({ step, title, desc, children }: { step: number; title: string; desc: string; children: ReactNode }) {
  return (
    <Card className="p-7 mb-5">
      <SectionTitle step={step} title={title} desc={desc} />
      <div className="grid grid-cols-2 gap-4">{children}</div>
    </Card>
  );
}

export default function CadastroCoordenador() {
  const { entrar } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState(INITIAL);
  const [erros, setErros] = useState<Erros>({});
  const [erroApi, setErroApi] = useState("");
  const [enviando, setEnviando] = useState(false);

  function set<K extends keyof FormCadastro>(campo: K, valor: FormCadastro[K]) {
    setForm((f) => ({ ...f, [campo]: valor }));
    setErros((e) => ({ ...e, [campo]: undefined }));
  }

  async function handleSubmit(ev: FormEvent) {
    ev.preventDefault();
    const e = validar(form);
    setErros(e);
    if (Object.keys(e).length) {
      setTimeout(() => document.querySelector("[data-error='true']")?.scrollIntoView({ behavior: "smooth", block: "center" }), 50);
      return;
    }
    setEnviando(true);
    setErroApi("");
    try {
      const { confirmarSenha: _, ...dados } = form;
      const { data } = await api.post<{ token: string; usuario: Usuario }>("/auth/cadastro", dados);
      entrar(data.token, data.usuario, false);
      navigate("/painel", { replace: true });
    } catch (err) {
      setErroApi(mensagemErro(err));
    } finally {
      setEnviando(false);
    }
  }

  const forca = form.senha ? calcStrength(form.senha) : 0;
  const qtdErros = Object.values(erros).filter(Boolean).length;
  const campo = (k: keyof FormCadastro) => ({ error: erros[k] });

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="h-[60px] bg-white border-b border-gray-200 flex items-center px-8 shadow-sm sticky top-0 z-40">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center text-white font-black text-xs">D</div>
          <span className="font-extrabold text-[13px] text-gray-900 tracking-tight">DIDASKAROS</span>
        </div>
        <span className="ml-8 text-[12px] text-gray-400">Coordenadores › <span className="text-gray-700 font-semibold">Novo Cadastro</span></span>
        <LinkButton to="/login" className="ml-auto">Cancelar</LinkButton>
      </header>

      <div className="max-w-3xl mx-auto px-6 py-10">
        <div className="mb-8">
          <span className="inline-block bg-blue-50 text-blue-700 text-[11px] font-bold px-3 py-1.5 rounded-full mb-3 uppercase tracking-wide">👤 Novo coordenador</span>
          <h1 className="text-[26px] font-extrabold text-gray-900 tracking-tight">Cadastrar Coordenador</h1>
          <p className="text-[13px] text-gray-500 mt-1.5">
            Preencha os dados de quem terá acesso à plataforma. Campos com <span className="text-blue-500 font-bold">*</span> são obrigatórios.
          </p>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <Secao step={1} title="Dados Pessoais" desc="Informações de identificação do coordenador">
            <Field label="Nome completo" required className="col-span-2" {...campo("nomeCompleto")}>
              <Input value={form.nomeCompleto} onChange={(v) => set("nomeCompleto", v)} placeholder="Ex: Maria Aparecida Costa" error={erros.nomeCompleto} />
            </Field>
            <Field label="CPF" required {...campo("cpf")}>
              <Input value={form.cpf} onChange={(v) => set("cpf", maskCPF(v))} placeholder="000.000.000-00" error={erros.cpf} />
            </Field>
            <Field label="Data de nascimento" required {...campo("dataNascimento")}>
              <Input type="date" value={form.dataNascimento} onChange={(v) => set("dataNascimento", v)} error={erros.dataNascimento} />
            </Field>
            <Field label="Telefone / WhatsApp" required {...campo("telefone")}>
              <Input value={form.telefone} onChange={(v) => set("telefone", maskPhone(v))} placeholder="(11) 99999-0000" error={erros.telefone} />
            </Field>
            <Field label="E-mail institucional" required hint="Será usado para login na plataforma" {...campo("emailInstitucional")}>
              <Input type="email" value={form.emailInstitucional} onChange={(v) => set("emailInstitucional", v)} placeholder="coordenador@cps.sp.gov.br" error={erros.emailInstitucional} />
            </Field>
            <Field label="E-mail pessoal (opcional)" className="col-span-2" hint="Para recuperação de conta" {...campo("emailPessoal")}>
              <Input type="email" value={form.emailPessoal} onChange={(v) => set("emailPessoal", v)} placeholder="email@exemplo.com" error={erros.emailPessoal} />
            </Field>
          </Secao>

          <Secao step={2} title="Dados Institucionais" desc="Unidade Centro Paula Souza onde o coordenador atua">
            <Field label="Tipo de instituição" required {...campo("tipoInstituicao")}>
              <Select value={form.tipoInstituicao} options={TIPOS_INST} placeholder="Selecione o tipo" error={erros.tipoInstituicao}
                onChange={(v) => { set("tipoInstituicao", v as FormCadastro["tipoInstituicao"]); set("curso", ""); }} />
            </Field>
            <Field label="Município" required {...campo("municipio")}>
              <Input value={form.municipio} onChange={(v) => set("municipio", v)} placeholder="Ex: São Paulo" error={erros.municipio} />
            </Field>
            <Field label="Nome da unidade" required className="col-span-2" hint="Sem o tipo — ex.: Uirapuru" {...campo("unidade")}>
              <Input value={form.unidade} onChange={(v) => set("unidade", v)} disabled={!form.tipoInstituicao}
                placeholder={form.tipoInstituicao ? "Ex: Uirapuru" : "Selecione o tipo de instituição primeiro"} error={erros.unidade} />
            </Field>
            <Field label="Curso sob coordenação" required className="col-span-2" {...campo("curso")}>
              <Select value={form.curso} onChange={(v) => set("curso", v)} options={form.tipoInstituicao ? CURSOS[form.tipoInstituicao] : []}
                disabled={!form.tipoInstituicao} placeholder={form.tipoInstituicao ? "Selecione o curso" : "Selecione o tipo de instituição primeiro"} error={erros.curso} />
            </Field>
            <Field label="Turnos sob responsabilidade" required className="col-span-2" {...campo("turnosResponsavel")}>
              <Chips options={TURNOS} selected={form.turnosResponsavel} onChange={(v) => set("turnosResponsavel", v)} />
            </Field>
          </Secao>

          <Secao step={3} title="Dados Funcionais" desc="Registro funcional e categoria dentro do CPS">
            <Field label="Registro funcional (RF)" required hint="Somente números" {...campo("registroFuncional")}>
              <Input value={form.registroFuncional} onChange={(v) => set("registroFuncional", maskRF(v))} placeholder="Ex: 12345678" error={erros.registroFuncional} />
            </Field>
            <Field label="Início na função" required {...campo("dataInicio")}>
              <Input type="date" value={form.dataInicio} onChange={(v) => set("dataInicio", v)} error={erros.dataInicio} />
            </Field>
            <Field label="Categoria funcional" required className="col-span-2" {...campo("categoriaFuncional")}>
              <Select value={form.categoriaFuncional} onChange={(v) => set("categoriaFuncional", v)} options={CATEGORIAS} placeholder="Selecione a categoria" error={erros.categoriaFuncional} />
            </Field>
            <Field label="Observações (opcional)" className="col-span-2" hint={`${form.observacoes.length}/500`}>
              <textarea value={form.observacoes} onChange={(e) => set("observacoes", e.target.value)} rows={3} maxLength={500}
                placeholder="Ex: Coordenador substituto durante licença." className={`${inputClass()} resize-none`} />
            </Field>
          </Secao>

          <Secao step={4} title="Acesso ao Sistema" desc="Credenciais e nível de permissão">
            <Field label="Senha de acesso" required {...campo("senha")}>
              <PasswordInput value={form.senha} onChange={(v) => set("senha", v)} placeholder="Mínimo 8 caracteres" error={erros.senha} />
            </Field>
            <Field label="Confirmar senha" required {...campo("confirmarSenha")}>
              <PasswordInput value={form.confirmarSenha} onChange={(v) => set("confirmarSenha", v)} placeholder="Repita a senha" error={erros.confirmarSenha} />
            </Field>
            {form.senha && (
              <div className="col-span-2">
                <div className="flex gap-1.5 mb-1.5">
                  {[1, 2, 3, 4].map((n) => <div key={n} className={`h-1.5 flex-1 rounded-full ${n <= forca ? FORCA[forca].cor : "bg-gray-100"}`} />)}
                </div>
                <p className="text-[11px] text-gray-400">{FORCA[forca].label}</p>
              </div>
            )}
            <Field label="Nível de acesso" required className="col-span-2">
              <div className="grid grid-cols-2 gap-3">
                {NIVEIS_ACESSO.map((n) => (
                  <button key={n.value} type="button" onClick={() => set("nivelAcesso", n.value)}
                    className={`text-left px-4 py-3.5 rounded-xl border transition-all ${form.nivelAcesso === n.value ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-blue-300"}`}>
                    <p className={`text-[13px] font-bold ${form.nivelAcesso === n.value ? "text-blue-700" : "text-gray-700"}`}>{n.label}</p>
                    <p className="text-[11px] text-gray-400 mt-0.5 leading-snug">{n.desc}</p>
                  </button>
                ))}
              </div>
            </Field>
          </Secao>

          <div className="space-y-3 mb-5">
            {qtdErros > 0 && <Alert title="Corrija os erros antes de salvar">{qtdErros} campo(s) com problema, destacados em vermelho.</Alert>}
            {erroApi && <Alert>{erroApi}</Alert>}
          </div>

          <div className="flex justify-end gap-3">
            <Button onClick={() => { setForm(INITIAL); setErros({}); }}>Limpar formulário</Button>
            <Button type="submit" variant="primary" loading={enviando} className="px-8">Cadastrar e entrar</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
