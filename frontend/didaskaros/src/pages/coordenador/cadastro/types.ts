export interface FormData {
  nomeCompleto: string;
  cpf: string;
  dataNascimento: string;
  telefone: string;
  emailInstitucional: string;
  emailPessoal: string;
  senha: string;
  confirmarSenha: string;
  tipoInstituicao: string;
  unidade: string;
  municipio: string;
  curso: string;
  turnosResponsavel: string[];
  registroFuncional: string;
  categoriaFuncional: string;
  dataInicio: string;
  nivelAcesso: string;
  observacoes: string;
  foto: string;
}

export interface FieldError {
  [key: string]: string;
}
