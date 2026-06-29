import { apiGetJson, apiPostJson } from './api'

export type ConviteCriadoResponse = {
  id?: number
  email?: string
  perfilId?: number
  perfilNome?: string
  dataExpiracao?: string
  status?: string
}

export type ConviteValidado = {
  id?: number
  email?: string
  perfilId?: number
  perfilNome?: string
  dataExpiracao?: string
  status?: string
  exigeSenhaProvisoria?: boolean
}

export type CompletarConvitePayload = {
  email: string
  senhaProvisoria?: string
  cpf: string
  nome: string
  senha: string
  telefone: string
  dataNascimento: string
  cep: string
  logradouro: string
  numero: string
  complemento: string
  bairro: string
  cidade: string
  uf: string
}

export type CriarConvitePayload = {
  email: string
  perfilId: number
}

export async function criarConvite(
  payload: CriarConvitePayload,
): Promise<ConviteCriadoResponse> {
  return apiPostJson<ConviteCriadoResponse>('/convites', payload)
}

export async function getConvitePorToken(token: string): Promise<ConviteValidado> {
  const enc = encodeURIComponent(token)
  return apiGetJson<ConviteValidado>(`/convites/token/${enc}`)
}

export async function completarCadastroConvite(
  token: string,
  payload: CompletarConvitePayload,
): Promise<unknown> {
  const enc = encodeURIComponent(token)
  return apiPostJson<unknown>(`/convites/token/${enc}/completar-cadastro`, payload)
}
