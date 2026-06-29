/** Valores do formulário de edição (cliente ou colaborador). */
export type EditarPessoaValues = {
  nome: string
  email: string
  telefone: string
  cpf: string
  /** ISO `YYYY-MM-DD` */
  dataNascimento: string
  cidade: string
  /** Cargo do colaborador. Preenchido apenas para colaborador; vazio para cliente. */
  cargo: string
  ativo: boolean
  cep: string
  logradouro: string
  numero: string
  complemento: string
  bairro: string
  uf: string
}
