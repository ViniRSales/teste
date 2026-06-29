import { apiDelete, apiGetJson, apiPostJson, apiPutJson } from './api'
import { ICONE_PADRAO_SERVICO, type ServicoIconeKey } from '../utils/servicoIcones'

export type ServicoApi = Record<string, unknown>

export type Servico = {
  id: string
  nome: string
  valor: number
  duracaoMinutos: number
  icone: ServicoIconeKey
  ativo: boolean
}

export type ServicoFormPayload = {
  nome: string
  valor: number
  duracaoMinutos: number
  icone: ServicoIconeKey
  ativo: boolean
}

function pickNumber(obj: ServicoApi, keys: string[]): number {
  for (const k of keys) {
    const v = obj[k]
    if (typeof v === 'number' && Number.isFinite(v)) return v
    if (typeof v === 'string' && v.trim() !== '') {
      const n = Number(v.replace(',', '.'))
      if (Number.isFinite(n)) return n
    }
  }
  return 0
}

function pickString(obj: ServicoApi, keys: string[]): string {
  for (const k of keys) {
    const v = obj[k]
    if (typeof v === 'string' && v.trim()) return v.trim()
    if (typeof v === 'number' && Number.isFinite(v)) return String(v)
  }
  return ''
}

function pickBoolean(obj: ServicoApi, keys: string[], fallback = true): boolean {
  for (const k of keys) {
    const v = obj[k]
    if (typeof v === 'boolean') return v
    if (typeof v === 'string') {
      const t = v.trim().toLowerCase()
      if (t === 'true' || t === 'ativo') return true
      if (t === 'false' || t === 'inativo') return false
    }
  }
  return fallback
}

export function servicoFromApi(raw: unknown): Servico | null {
  if (!raw || typeof raw !== 'object') return null
  const obj = raw as ServicoApi

  const id = pickString(obj, ['id'])
  const nome = pickString(obj, ['nome', 'name'])
  const valor = pickNumber(obj, ['valor', 'value', 'preco'])
  const duracaoMinutos = pickNumber(obj, [
    'duracaoMinutos',
    'duracao_minutos',
    'duracao',
  ])
  const iconeRaw = pickString(obj, ['icone', 'icon']) || ICONE_PADRAO_SERVICO
  const icone = (
    [
      'scissors',
      'sparkles',
      'palette',
      'razor',
      'brush',
      'water_drop',
      'star',
      'heart',
      'flower',
      'bolt',
      'crown',
      'waves',
      'smiley',
      'sun',
      'diamond',
    ] as const
  ).includes(iconeRaw as ServicoIconeKey)
    ? (iconeRaw as ServicoIconeKey)
    : ICONE_PADRAO_SERVICO
  const ativo = pickBoolean(obj, ['ativo', 'active', 'status'], true)

  if (!id && !nome) return null

  return {
    id: id || nome,
    nome: nome || '(Sem nome)',
    valor,
    duracaoMinutos: duracaoMinutos || 0,
    icone,
    ativo,
  }
}

function toApiPayload(payload: ServicoFormPayload) {
  return {
    nome: payload.nome.trim(),
    valor: payload.valor,
    duracaoMinutos: payload.duracaoMinutos,
    icone: payload.icone,
    ativo: payload.ativo,
  }
}

export async function getServicos(busca?: string): Promise<Servico[]> {
  const q = busca?.trim()
  const path = q ? `/servicos?nome=${encodeURIComponent(q)}` : '/servicos'
  const data = await apiGetJson<unknown>(path)

  const arr = Array.isArray(data)
    ? data
    : data && typeof data === 'object' && Array.isArray((data as { data?: unknown }).data)
      ? (data as { data: unknown[] }).data
      : []

  return arr.map(servicoFromApi).filter((x): x is Servico => Boolean(x))
}

export async function criarServico(payload: ServicoFormPayload): Promise<Servico> {
  const raw = await apiPostJson<unknown>('/servicos', toApiPayload(payload))
  const servico = servicoFromApi(raw)
  if (!servico) throw new Error('Resposta inválida ao cadastrar serviço.')
  return servico
}

export async function atualizarServico(
  id: string,
  payload: ServicoFormPayload,
): Promise<Servico> {
  const servicoId = id.trim()
  if (!/^\d+$/.test(servicoId)) {
    throw new Error('Identificador inválido para atualização.')
  }
  const raw = await apiPutJson<unknown>(`/servicos/${servicoId}`, toApiPayload(payload))
  const servico = servicoFromApi(raw)
  if (!servico) throw new Error('Resposta inválida ao atualizar serviço.')
  return servico
}

export async function deleteServicoPorId(id: string): Promise<void> {
  const servicoId = id.trim()
  if (!/^\d+$/.test(servicoId)) {
    throw new Error('Identificador inválido para exclusão.')
  }
  await apiDelete(`/servicos/${servicoId}`)
}

export function formatarValorBrl(valor: number): string {
  return valor.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  })
}
