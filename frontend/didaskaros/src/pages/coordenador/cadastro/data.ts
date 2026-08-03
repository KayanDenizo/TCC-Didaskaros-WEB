import type { FormData } from "./types";

export const TIPOS_INST = ["ETEC", "FATEC"];
export const TURNOS = ["Manhã", "Tarde", "Noite", "Integral"];
export const CATEGORIAS = [
  "Coordenador Pedagógico",
  "Coordenador de Curso",
  "Diretor de Serviços",
  "Assistente de Coordenação",
];
export const NIVEIS_ACESSO = [
  { value: "COORDENADOR", label: "Coordenador — acesso padrão" },
  { value: "ADMIN", label: "Administrador — acesso total" },
];
export const CURSOS_ETEC = [
  "Desenvolvimento de Sistemas", "Informática para Internet", "Informática",
  "Administração", "Contabilidade", "Logística", "Recursos Humanos",
  "Enfermagem", "Nutrição e Dietética", "Eletrotécnica", "Mecânica",
  "Edificações", "Design de Interiores", "Marketing", "Serviços Jurídicos", "Outro",
];
export const CURSOS_FATEC = [
  "Análise e Desenvolvimento de Sistemas", "Banco de Dados",
  "Gestão da Tecnologia da Informação", "Ciência de Dados",
  "Inteligência Artificial e Cognitiva", "Gestão Empresarial",
  "Logística", "Marketing Digital", "Mecatrônica Industrial",
  "Engenharia de Produção", "Outro",
];

export const INITIAL: FormData = {
  nomeCompleto: "", cpf: "", dataNascimento: "", telefone: "",
  emailInstitucional: "", emailPessoal: "", senha: "", confirmarSenha: "",
  tipoInstituicao: "", unidade: "", municipio: "", curso: "",
  turnosResponsavel: [],
  registroFuncional: "", categoriaFuncional: "", dataInicio: "",
  nivelAcesso: "COORDENADOR", observacoes: "", foto: "",
};
