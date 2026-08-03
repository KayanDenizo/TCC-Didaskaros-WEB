import { useState } from "react";
import type { FormData, FieldError } from "./cadastro/types";
import { TIPOS_INST, TURNOS, CATEGORIAS, NIVEIS_ACESSO, CURSOS_ETEC, CURSOS_FATEC, INITIAL } from "./cadastro/data";
import { maskCPF, maskPhone, maskRF, validarCPF, calcStrength } from "./cadastro/helpers";
import { Label, Input, PasswordInput, Select, CheckboxGroup, SectionTitle } from "./cadastro/fields";

export default function CadastroCoordenador() {
  const [form, setForm] = useState<FormData>(INITIAL);
  const [errors, setErrors] = useState<FieldError>({});
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  function set(field: keyof FormData, value: string | string[]) {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
  }

  function limpar() {
    setForm(INITIAL);
    setErrors({});
  }

  const cursos = form.tipoInstituicao === "ETEC" ? CURSOS_ETEC
    : form.tipoInstituicao === "FATEC" ? CURSOS_FATEC : [];

  function validate(): boolean {
    const e: FieldError = {};

    if (!form.nomeCompleto.trim()) e.nomeCompleto = "Nome completo é obrigatório.";
    else if (form.nomeCompleto.trim().split(" ").length < 2) e.nomeCompleto = "Informe o nome completo (nome e sobrenome).";

    if (!validarCPF(form.cpf)) e.cpf = "CPF inválido — verifique os dígitos.";

    if (!form.dataNascimento) e.dataNascimento = "Data de nascimento é obrigatória.";
    else {
      const nascimento = new Date(form.dataNascimento);
      const hoje = new Date();
      const idade = hoje.getFullYear() - nascimento.getFullYear();
      if (idade < 18) e.dataNascimento = "O coordenador deve ter pelo menos 18 anos.";
      if (idade > 80) e.dataNascimento = "Verifique a data de nascimento informada.";
    }

    if (form.telefone.replace(/\D/g, "").length < 10)
      e.telefone = "Telefone inválido — informe DDD + número.";

    if (!form.emailInstitucional.trim()) e.emailInstitucional = "E-mail institucional é obrigatório.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.emailInstitucional))
      e.emailInstitucional = "Formato de e-mail inválido.";

    if (form.emailPessoal && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.emailPessoal))
      e.emailPessoal = "Formato de e-mail inválido.";

    if (!form.senha) e.senha = "Senha é obrigatória.";
    else if (form.senha.length < 8) e.senha = "Senha deve ter no mínimo 8 caracteres.";

    if (!form.confirmarSenha) e.confirmarSenha = "Confirme a senha.";
    else if (form.senha !== form.confirmarSenha) e.confirmarSenha = "As senhas não coincidem.";

    if (!form.tipoInstituicao) e.tipoInstituicao = "Selecione o tipo de instituição.";
    if (!form.unidade.trim()) e.unidade = "Nome da unidade é obrigatório.";
    if (!form.municipio.trim()) e.municipio = "Município é obrigatório.";
    if (!form.curso) e.curso = "Selecione o curso.";
    if (form.turnosResponsavel.length === 0)
      e.turnosResponsavel = "Selecione ao menos um turno.";

    if (form.registroFuncional.length < 6)
      e.registroFuncional = "Registro funcional deve ter no mínimo 6 dígitos.";

    if (!form.categoriaFuncional) e.categoriaFuncional = "Selecione a categoria funcional.";

    if (!form.dataInicio) e.dataInicio = "Data de início é obrigatória.";
    else if (new Date(form.dataInicio) > new Date())
      e.dataInicio = "A data de início não pode ser no futuro.";

    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) {
      // scroll até o primeiro erro
      setTimeout(() => {
        const firstError = document.querySelector("[data-error='true']");
        firstError?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 50);
      return;
    }
    setLoading(true);
    // Simulação de chamada à API
    // Na integração real: await api.post("/usuarios/coordenadores", { ...form, senha: hash(form.senha) })
    setTimeout(() => { setLoading(false); setSubmitted(true); }, 1400);
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-10 max-w-md w-full text-center">
          <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-5 text-3xl">✅</div>
          <h2 className="text-[20px] font-extrabold text-gray-900 mb-2">Coordenador cadastrado!</h2>
          <p className="text-[13px] text-gray-500 mb-1">
            <strong className="text-gray-800">{form.nomeCompleto}</strong> foi registrado com sucesso.
          </p>
          <p className="text-[12px] text-gray-400 mb-6">
            Um e-mail foi enviado para <strong>{form.emailInstitucional}</strong> com as instruções de acesso.
          </p>
          <div className="bg-gray-50 rounded-xl p-4 text-left mb-6 border border-gray-100">
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-2">Resumo</p>
            {[
              ["Unidade", `${form.tipoInstituicao} ${form.unidade} — ${form.municipio}`],
              ["Curso", form.curso],
              ["Categoria", form.categoriaFuncional],
              ["RF", form.registroFuncional],
              ["Turnos", form.turnosResponsavel.join(", ")],
              ["Nível de acesso", form.nivelAcesso],
            ].map(([label, val]) => (
              <div key={label} className="flex justify-between py-1 border-b border-gray-100 last:border-0">
                <span className="text-[12px] text-gray-400">{label}</span>
                <span className="text-[12px] font-semibold text-gray-700">{val}</span>
              </div>
            ))}
          </div>
          <div className="flex gap-3">
            <button onClick={limpar}
              className="flex-1 py-2.5 rounded-xl border border-gray-200 text-[13px] font-semibold text-gray-600 hover:border-blue-400 hover:text-blue-600 transition-all">
              Novo cadastro
            </button>
            <button className="flex-1 py-2.5 rounded-xl text-[13px] font-semibold text-white transition-all hover:opacity-90"
              style={{ background: "linear-gradient(135deg,#1E4DA1,#2563EB)" }}>
              Ver coordenadores
            </button>
          </div>
        </div>
      </div>
    );
  }

  const strength = form.senha ? calcStrength(form.senha) : 0;
  const strengthLabel = ["", "🔴 Muito curta", "🟡 Fraca — adicione maiúsculas e números", "🔵 Boa", "🟢 Forte"];
  const strengthColor = ["", "bg-red-400", "bg-amber-400", "bg-blue-500", "bg-emerald-500"];

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Topbar */}
      <header className="h-[60px] bg-white border-b border-gray-200 flex items-center px-8 shadow-sm sticky top-0 z-40">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center text-white font-black text-xs">D</div>
          <span className="font-extrabold text-[13px] text-gray-900 tracking-tight">DIDÁSKAROS</span>
        </div>
        <div className="flex items-center gap-1.5 ml-8 text-[12px] text-gray-400">
          <span className="hover:text-blue-600 cursor-pointer">Usuários</span>
          <span>›</span>
          <span className="hover:text-blue-600 cursor-pointer">Coordenadores</span>
          <span>›</span>
          <span className="text-gray-700 font-semibold">Novo Cadastro</span>
        </div>
        <button className="ml-auto px-4 py-2 rounded-xl border border-gray-200 text-[13px] font-semibold text-gray-600 hover:border-blue-400 hover:text-blue-600 transition-all">
          Cancelar
        </button>
      </header>

      <div className="max-w-3xl mx-auto px-6 py-10">

        {/* Page header */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 text-[11px] font-bold px-3 py-1.5 rounded-full mb-3 uppercase tracking-wide">
            👤 Novo coordenador
          </div>
          <h1 className="text-[26px] font-extrabold text-gray-900 tracking-tight">Cadastrar Coordenador</h1>
          <p className="text-[13px] text-gray-500 mt-1.5">
            Preencha os dados do coordenador que terá acesso à plataforma Didáskaros.
            Campos com <span className="text-blue-500 font-bold">*</span> são obrigatórios.
          </p>
        </div>

        <form onSubmit={handleSubmit} noValidate>

          {/* -- SEÇÃO 1: DADOS PESSOAIS --------------------------- */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-7 mb-5">
            <SectionTitle step={1} title="Dados Pessoais" desc="Informações de identificação do coordenador" />

            {/* Foto de perfil */}
            <div className="flex items-center gap-5 mb-6 p-4 bg-gray-50 rounded-xl border border-gray-100">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-600 to-blue-400 flex items-center justify-center text-white text-xl font-black shrink-0">
                {form.nomeCompleto ? form.nomeCompleto.trim()[0].toUpperCase() : "?"}
              </div>
              <div>
                <p className="text-[13px] font-semibold text-gray-700 mb-0.5">Foto de perfil</p>
                <p className="text-[11px] text-gray-400 mb-2">PNG ou JPG, máx. 2MB. Opcional — se não enviar, usaremos a inicial do nome.</p>
                <label className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg border border-gray-200 bg-white text-[12px] font-semibold text-gray-600 cursor-pointer hover:border-blue-400 hover:text-blue-600 transition-all">
                  📎 Escolher arquivo
                  <input type="file" accept="image/png,image/jpeg" className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) set("foto", URL.createObjectURL(file));
                    }}
                  />
                </label>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2" data-error={!!errors.nomeCompleto}>
                <Label required>Nome completo</Label>
                <Input value={form.nomeCompleto} onChange={(v) => set("nomeCompleto", v)}
                  placeholder="Ex: Maria Aparecida Costa" error={errors.nomeCompleto} />
              </div>

              <div data-error={!!errors.cpf}>
                <Label required>CPF</Label>
                <Input value={form.cpf} onChange={(v) => set("cpf", maskCPF(v))}
                  placeholder="000.000.000-00" error={errors.cpf} />
              </div>

              <div data-error={!!errors.dataNascimento}>
                <Label required>Data de nascimento</Label>
                <Input type="date" value={form.dataNascimento}
                  onChange={(v) => set("dataNascimento", v)} error={errors.dataNascimento} />
              </div>

              <div data-error={!!errors.telefone}>
                <Label required>Telefone / WhatsApp</Label>
                <Input value={form.telefone} onChange={(v) => set("telefone", maskPhone(v))}
                  placeholder="(11) 99999-0000" error={errors.telefone} />
              </div>

              <div data-error={!!errors.emailInstitucional}>
                <Label required>E-mail institucional</Label>
                <Input type="email" value={form.emailInstitucional}
                  onChange={(v) => set("emailInstitucional", v)}
                  placeholder="coordenador@cps.sp.gov.br"
                  hint="Será usado para login na plataforma"
                  error={errors.emailInstitucional} />
              </div>

              <div data-error={!!errors.emailPessoal} className="col-span-2">
                <Label>E-mail pessoal (opcional)</Label>
                <Input type="email" value={form.emailPessoal}
                  onChange={(v) => set("emailPessoal", v)}
                  placeholder="email@exemplo.com"
                  hint="Para recuperação de conta em caso de perda do e-mail institucional"
                  error={errors.emailPessoal} />
              </div>
            </div>
          </div>

          {/* -- SEÇÃO 2: DADOS INSTITUCIONAIS --------------------- */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-7 mb-5">
            <SectionTitle step={2} title="Dados Institucionais" desc="Unidade Centro Paula Souza onde o coordenador atua" />

            <div className="grid grid-cols-2 gap-4">
              <div data-error={!!errors.tipoInstituicao}>
                <Label required>Tipo de instituição</Label>
                <Select value={form.tipoInstituicao}
                  onChange={(v) => { set("tipoInstituicao", v); set("curso", ""); }}
                  options={TIPOS_INST} placeholder="Selecione o tipo"
                  error={errors.tipoInstituicao} />
              </div>

              <div data-error={!!errors.municipio}>
                <Label required>Município</Label>
                <Input value={form.municipio} onChange={(v) => set("municipio", v)}
                  placeholder="Ex: São Paulo" error={errors.municipio} />
              </div>

              <div className="col-span-2" data-error={!!errors.unidade}>
                <Label required>Nome da unidade</Label>
                <Input value={form.unidade} onChange={(v) => set("unidade", v)}
                  placeholder={
                    !form.tipoInstituicao ? "Selecione o tipo de instituição primeiro"
                      : form.tipoInstituicao === "ETEC" ? "Ex: ETEC Uirapuru"
                        : "Ex: FATEC São Paulo"
                  }
                  disabled={!form.tipoInstituicao}
                  error={errors.unidade} />
              </div>

              <div className="col-span-2" data-error={!!errors.curso}>
                <Label required>Curso sob coordenação</Label>
                <Select value={form.curso} onChange={(v) => set("curso", v)}
                  options={cursos}
                  placeholder={!form.tipoInstituicao ? "Selecione o tipo de instituição primeiro" : "Selecione o curso"}
                  error={errors.curso} />
              </div>

              <div className="col-span-2" data-error={!!errors.turnosResponsavel}>
                <Label required>Turnos sob responsabilidade</Label>
                <CheckboxGroup options={TURNOS} selected={form.turnosResponsavel}
                  onChange={(v) => set("turnosResponsavel", v)}
                  error={errors.turnosResponsavel} />
                <p className="text-[11px] text-gray-400 mt-1.5">Selecione todos os turnos que este coordenador irá gerir.</p>
              </div>
            </div>
          </div>

          {/* -- SEÇÃO 3: DADOS FUNCIONAIS ------------------------- */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-7 mb-5">
            <SectionTitle step={3} title="Dados Funcionais" desc="Registro funcional e categoria dentro do CPS" />

            <div className="grid grid-cols-2 gap-4">
              <div data-error={!!errors.registroFuncional}>
                <Label required>Registro funcional (RF)</Label>
                <Input value={form.registroFuncional}
                  onChange={(v) => set("registroFuncional", maskRF(v))}
                  placeholder="Ex: 12345678" maxLength={8}
                  hint="Número do RF fornecido pelo CPS — somente números"
                  error={errors.registroFuncional} />
              </div>

              <div data-error={!!errors.dataInicio}>
                <Label required>Data de início na função</Label>
                <Input type="date" value={form.dataInicio}
                  onChange={(v) => set("dataInicio", v)}
                  hint="Data em que assumiu a coordenação"
                  error={errors.dataInicio} />
              </div>

              <div className="col-span-2" data-error={!!errors.categoriaFuncional}>
                <Label required>Categoria funcional</Label>
                <Select value={form.categoriaFuncional}
                  onChange={(v) => set("categoriaFuncional", v)}
                  options={CATEGORIAS} placeholder="Selecione a categoria"
                  error={errors.categoriaFuncional} />
              </div>

              <div className="col-span-2">
                <Label>Observações institucionais (opcional)</Label>
                <textarea
                  value={form.observacoes}
                  onChange={(e) => set("observacoes", e.target.value)}
                  placeholder="Ex: Coordenador substituto durante licença. Restrição de horário noturno às sextas-feiras."
                  rows={3}
                  maxLength={500}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-[13px] text-gray-800 placeholder-gray-300 outline-none transition-all bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 resize-none"
                />
                <p className="text-[11px] text-gray-400 mt-1 text-right">{form.observacoes.length}/500</p>
              </div>
            </div>
          </div>

          {/* -- SEÇÃO 4: ACESSO AO SISTEMA ------------------------ */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-7 mb-5">
            <SectionTitle step={4} title="Acesso ao Sistema" desc="Credenciais e nível de permissão no Didáskaros" />

            <div className="grid grid-cols-2 gap-4">
              <div data-error={!!errors.senha}>
                <Label required>Senha de acesso</Label>
                <PasswordInput value={form.senha} onChange={(v) => set("senha", v)}
                  placeholder="Mínimo 8 caracteres" error={errors.senha} />
              </div>

              <div data-error={!!errors.confirmarSenha}>
                <Label required>Confirmar senha</Label>
                <PasswordInput value={form.confirmarSenha} onChange={(v) => set("confirmarSenha", v)}
                  placeholder="Repita a senha" error={errors.confirmarSenha} />
              </div>

              {/* Força da senha */}
              {form.senha && (
                <div className="col-span-2">
                  <div className="flex gap-1.5 mb-1.5">
                    {[1, 2, 3, 4].map((lvl) => (
                      <div key={lvl} className={`h-1.5 flex-1 rounded-full transition-all duration-300
                        ${lvl <= strength ? strengthColor[strength] : "bg-gray-100"}`} />
                    ))}
                  </div>
                  <p className="text-[11px] text-gray-400">{strengthLabel[strength]}</p>
                  <p className="text-[10px] text-gray-300 mt-0.5">
                    Dica: use maiúsculas, números e caracteres especiais (!@#$) para senha forte.
                  </p>
                </div>
              )}

              {/* Nível de acesso */}
              <div className="col-span-2">
                <Label required>Nível de acesso</Label>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  {NIVEIS_ACESSO.map((n) => (
                    <button key={n.value} type="button" onClick={() => set("nivelAcesso", n.value)}
                      className={`text-left px-4 py-3.5 rounded-xl border transition-all
                        ${form.nivelAcesso === n.value
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 bg-white hover:border-blue-300"
                        }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center shrink-0
                          ${form.nivelAcesso === n.value ? "border-blue-600 bg-blue-600" : "border-gray-300"}`}>
                          {form.nivelAcesso === n.value && (
                            <span className="w-1.5 h-1.5 rounded-full bg-white block" />
                          )}
                        </span>
                        <span className={`text-[13px] font-bold ${form.nivelAcesso === n.value ? "text-blue-700" : "text-gray-700"}`}>
                          {n.value === "COORDENADOR" ? "Coordenador" : "Administrador"}
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-400 ml-5 leading-snug">
                        {n.value === "COORDENADOR"
                          ? "Gerencia grades, professores e turmas da sua unidade."
                          : "Acesso total — gerencia usuários, todas as unidades e dados do sistema."}
                      </p>
                    </button>
                  ))}
                </div>

                {form.nivelAcesso === "ADMIN" && (
                  <div className="flex items-start gap-2.5 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                    <span className="text-amber-500 mt-0.5 text-[16px] shrink-0">⚠️</span>
                    <p className="text-[12px] text-amber-700 font-medium leading-relaxed">
                      Acesso de Administrador permite gerenciar todos os usuários, instituições e dados do sistema.
                      Conceda apenas a responsáveis expressamente autorizados pelo CPS.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── ERROS GLOBAIS ────────────────────────────────────── */}
          {Object.keys(errors).length > 0 && (
            <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-2xl px-5 py-4 mb-5">
              <span className="text-red-500 text-[18px] mt-0.5 shrink-0">⚠️</span>
              <div>
                <p className="text-[13px] font-bold text-red-700">Corrija os erros antes de salvar</p>
                <p className="text-[12px] text-red-500 mt-0.5">
                  {Object.keys(errors).length} campo{Object.keys(errors).length > 1 ? "s" : ""} com problema.
                  Revise os campos destacados em vermelho acima.
                </p>
              </div>
            </div>
          )}

          {/* ── AÇÕES ────────────────────────────────────────────── */}
          <div className="flex items-center justify-between py-2">
            <p className="text-[12px] text-gray-400">
              Campos com <span className="text-blue-500 font-bold">*</span> são obrigatórios
            </p>
            <div className="flex gap-3">
              <button type="button" onClick={limpar}
                className="px-6 py-2.5 rounded-xl border border-gray-200 text-[13px] font-semibold text-gray-600 bg-white hover:border-red-300 hover:text-red-500 transition-all">
                Limpar formulário
              </button>
              <button type="submit" disabled={loading}
                className="px-8 py-2.5 rounded-xl text-[13px] font-bold text-white transition-all hover:opacity-90 disabled:opacity-60 flex items-center gap-2"
                style={{ background: "linear-gradient(135deg,#1E4DA1,#2563EB)", boxShadow: "0 2px 12px rgba(37,99,235,0.3)" }}
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Cadastrando...
                  </>
                ) : "Cadastrar coordenador"}
              </button>
            </div>
          </div>

        </form>
      </div>
    </div>
  );
}
