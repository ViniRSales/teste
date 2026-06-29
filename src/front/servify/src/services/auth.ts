import { apiPostJson } from './api'

export type LoginResponse = {
  id: number
  perfilId: number
  perfilNome: string
  cargo?: string
  nome: string
  email: string
  /** Fluxo convite: deve concluir cadastro em `/convite/{conviteToken}`. */
  cadastroPendente?: boolean
  conviteToken?: string | null
}

export async function loginApi(login: string, senha: string): Promise<LoginResponse> {
  return apiPostJson<LoginResponse>('/auth/login', { login, senha })
}

