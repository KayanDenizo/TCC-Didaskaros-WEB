export const TIPOS_INST = ["ETEC", "FATEC"] as const;
export const TURNOS = ["Manhã", "Tarde", "Noite", "Integral"] as const;
export const CATEGORIAS = [
  "Coordenador Pedagógico",
  "Coordenador de Curso",
  "Diretor de Serviços",
  "Assistente de Coordenação",
];
export const NIVEIS_ACESSO = [
  { value: "COORDENADOR", label: "Coordenador", desc: "Gerencia grades, professores e turmas da sua unidade." },
  { value: "ADMIN", label: "Administrador", desc: "Acesso total — gerencia usuários, todas as unidades e dados do sistema." },
] as const;
export const CURSOS = {
  ETEC: [
    "Desenvolvimento de Sistemas", "Informática para Internet", "Informática",
    "Administração", "Contabilidade", "Logística", "Recursos Humanos",
    "Enfermagem", "Nutrição e Dietética", "Eletrotécnica", "Mecânica",
    "Edificações", "Design de Interiores", "Marketing", "Serviços Jurídicos", "Outro",
  ],
  FATEC: [
    "Análise e Desenvolvimento de Sistemas", "Banco de Dados",
    "Gestão da Tecnologia da Informação", "Ciência de Dados",
    "Inteligência Artificial e Cognitiva", "Gestão Empresarial",
    "Logística", "Marketing Digital", "Mecatrônica Industrial",
    "Engenharia de Produção", "Outro",
  ],
};

export const INITIAL = {
  nomeCompleto: "", cpf: "", dataNascimento: "", telefone: "",
  emailInstitucional: "", emailPessoal: "", senha: "", confirmarSenha: "",
  tipoInstituicao: "" as "" | "ETEC" | "FATEC", unidade: "", municipio: "", curso: "",
  turnosResponsavel: [] as string[],
  registroFuncional: "", categoriaFuncional: "", dataInicio: "",
  nivelAcesso: "COORDENADOR" as "COORDENADOR" | "ADMIN", observacoes: "",
};

export type FormCadastro = typeof INITIAL;
