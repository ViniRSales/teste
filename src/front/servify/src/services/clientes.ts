import { apiDelete, apiGetJson } from './api'

export type ClienteApi = Record<string, unknown>

export type Cliente = {
  id: string
  nome: string
  email: string
  telefone: string
  cpf: string
  cidade: string
  ativo: boolean
  cep: string
  logradouro: string
  numero: string
  complemento: string
  bairro: string
  uf: string
  /** ISO `YYYY-MM-DD` quando disponível na API */
  dataNascimento: string
}

function asString(v: unknown): string {
  return typeof v === 'string' ? v : v == null ? '' : String(v)
}

function pickFirstString(obj: ClienteApi, keys: string[]): string {
  for (const k of keys) {
    const v = obj[k]
    if (typeof v === 'string' && v.trim()) return v
    if (typeof v === 'number' && Number.isFinite(v)) return String(v)
  }
  return ''
}

function pickFirstBoolean(obj: ClienteApi, keys: string[], fallback = true): boolean {
  for (const k of keys) {
    const v = obj[k]
    if (typeof v === 'boolean') return v
    if (typeof v === 'number') return v !== 0
    if (typeof v === 'string') {
      const t = v.trim().toLowerCase()
      if (t === 'true' || t === '1' || t === 'sim' || t === 's') return true
      if (t === 'false' || t === '0' || t === 'nao' || t === 'não' || t === 'n')
        return false
    }
  }
  return fallback
}

function parseDataNascimentoApi(obj: ClienteApi): string {
  const v = obj.dataNascimento
  if (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}/.test(v)) {
    return v.slice(0, 10)
  }
  if (Array.isArray(v) && v.length >= 3) {
    const y = Number(v[0])
    const m = Number(v[1])
    const d = Number(v[2])
    if (Number.isFinite(y) && Number.isFinite(m) && Number.isFinite(d)) {
      return `${String(y).padStart(4, '0')}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    }
  }
  return ''
}

export function clienteFromApi(raw: unknown): Cliente | null {
  if (!raw || typeof raw !== 'object') return null
  const obj = raw as ClienteApi

  const id = pickFirstString(obj, ['id', 'uuid', 'codigo', 'cod', 'userId'])
  const nome = pickFirstString(obj, ['nome', 'name', 'razaoSocial'])
  const email = pickFirstString(obj, ['email', 'mail'])
  const telefone = pickFirstString(obj, ['telefone', 'phone', 'celular', 'whatsapp'])
  const cpf = pickFirstString(obj, ['cpf', 'documento', 'documentoCpf'])

  const cidadeRaw =
    pickFirstString(obj, ['cidade', 'city']) ||
    pickFirstString(obj, ['municipio', 'localidade'])
  const uf = pickFirstString(obj, ['uf', 'estado', 'state']).toUpperCase()
  const cidade = cidadeRaw && uf ? `${cidadeRaw} - ${uf}` : cidadeRaw || (uf ? uf : '')

  // Endereço pode vir “achatado” ou dentro de um objeto (ex.: endereco)
  const endereco =
    typeof obj.endereco === 'object' && obj.endereco
      ? (obj.endereco as ClienteApi)
      : null

  const cep = pickFirstString(obj, ['cep']) || (endereco ? pickFirstString(endereco, ['cep']) : '')
  const logradouro =
    pickFirstString(obj, ['logradouro', 'rua']) ||
    (endereco ? pickFirstString(endereco, ['logradouro', 'rua']) : '')
  const numero =
    pickFirstString(obj, ['numero', 'num']) || (endereco ? pickFirstString(endereco, ['numero', 'num']) : '')
  const complemento =
    pickFirstString(obj, ['complemento']) ||
    (endereco ? pickFirstString(endereco, ['complemento']) : '')
  const bairro =
    pickFirstString(obj, ['bairro']) || (endereco ? pickFirstString(endereco, ['bairro']) : '')

  const ativo = pickFirstBoolean(obj, ['ativo', 'isActive', 'status'], true)

  if (!id && !nome && !email) return null

  return {
    id: id || email || nome || crypto.randomUUID(),
    nome: nome || '(Sem nome)',
    email,
    telefone,
    cpf,
    cidade,
    ativo,
    cep,
    logradouro,
    numero: asString(numero),
    complemento,
    bairro,
    uf,
    dataNascimento: parseDataNascimentoApi(obj),
  }
}

export async function getClientes(): Promise<Cliente[]> {
  const data = await apiGetJson<unknown>('/usuarios/clientes')

  const arr = Array.isArray(data)
    ? data
    : data && typeof data === 'object' && Array.isArray((data as { data?: unknown }).data)
      ? (data as { data: unknown[] }).data
      : []

  return arr.map(clienteFromApi).filter((x): x is Cliente => Boolean(x))
}

/** Remove o usuário cliente no backend (`DELETE /usuarios/{id}`). */
export async function deleteClientePorId(usuarioId: string): Promise<void> {
  const id = usuarioId.trim()
  if (!/^\d+$/.test(id)) {
    throw new Error('Identificador inválido para exclusão.')
  }
  await apiDelete(`/usuarios/${id}`)
}

