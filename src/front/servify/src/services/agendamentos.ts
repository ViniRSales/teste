import { apiDelete, apiGetJson, apiPostJson, apiPutJson } from './api'
import { cargoFromUser, getSession } from '../auth/session'

export type AgendamentoApi = Record<string, unknown>

export type Agendamento = {
  id: string
  servicoId: string
  servicoNome: string
  clienteId: string
  clienteNome: string
  colaboradorId: string
  colaboradorNome: string
  dataHora: string
  data: string
  horarioInicio: string
  duracaoMinutos: number
  valor: number
  desconto: number
  valorFinal: number
  comissao: number
  status: string
}

export type AgendamentoFormPayload = {
  servicoId: string
  clienteId: string
  colaboradorId: string
  dataHora: string
  desconto: number
}

export type GetAgendamentosParams = {
  inicio?: string
  fim?: string
  clienteId?: string
  colaboradorId?: string
  servicoId?: string
  status?: string
}

function pickString(obj: AgendamentoApi, keys: string[]): string {
  for (const key of keys) {
    const value = obj[key]
    if (typeof value === 'string' && value.trim()) return value.trim()
    if (typeof value === 'number' && Number.isFinite(value)) return String(value)
  }
  return ''
}

function pickNumber(obj: AgendamentoApi, keys: string[]): number {
  for (const key of keys) {
    const value = obj[key]
    if (typeof value === 'number' && Number.isFinite(value)) return value
    if (typeof value === 'string' && value.trim()) {
      const parsed = Number(value.replace(',', '.'))
      if (Number.isFinite(parsed)) return parsed
    }
  }
  return 0
}

function normalizeDate(value: string): string {
  return /^\d{4}-\d{2}-\d{2}/.test(value) ? value.slice(0, 10) : value
}

function normalizeTime(value: string): string {
  return /^\d{2}:\d{2}/.test(value) ? value.slice(0, 5) : value
}

function normalizeDateTime(value: string): string {
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(value)) return value
  return value
}

export function agendamentoFromApi(raw: unknown): Agendamento | null {
  if (!raw || typeof raw !== 'object') return null
  const obj = raw as AgendamentoApi

  const id = pickString(obj, ['id'])
  const servicoId = pickString(obj, ['servicoId', 'servico_id'])
  const clienteId = pickString(obj, ['clienteId', 'cliente_id'])
  const colaboradorId = pickString(obj, [
    'colaboradorId',
    'prestadorId',
    'colaborador_id',
    'prestador_id',
  ])
  const servicoNome = pickString(obj, ['servicoNome', 'servico', 'nomeServico'])
  const clienteNome = pickString(obj, ['clienteNome', 'cliente', 'nomeCliente'])
  const colaboradorNome = pickString(obj, [
    'colaboradorNome',
    'prestadorNome',
    'colaborador',
    'prestador',
    'nomeColaborador',
    'nomePrestador',
  ])
  const dataHora = normalizeDateTime(pickString(obj, ['dataHora', 'dateTime']))
  const data =
    normalizeDate(pickString(obj, ['data', 'date'])) || normalizeDate(dataHora)
  const horarioInicio =
    normalizeTime(pickString(obj, ['horarioInicio', 'horario_inicio', 'inicio'])) ||
    normalizeTime(dataHora.slice(11))
  const duracaoMinutos = pickNumber(obj, [
    'duracaoMinutos',
    'duracao_minutos',
    'duracao',
  ])
  const valor = pickNumber(obj, ['valor', 'value', 'preco'])
  const desconto = pickNumber(obj, ['desconto'])
  const valorFinal = pickNumber(obj, ['valorFinal', 'valor_final']) || valor - desconto
  const comissao = pickNumber(obj, ['comissao'])
  const status = pickString(obj, ['status']) || 'AGENDADO'

  if (!id && !servicoNome && !dataHora && !data) return null

  return {
    id: id || `${dataHora || `${data}T${horarioInicio}`}-${servicoNome}`,
    servicoId,
    servicoNome: servicoNome || '(Sem serviço)',
    clienteId,
    clienteNome: clienteNome || '(Sem cliente)',
    colaboradorId,
    colaboradorNome: colaboradorNome || '(Sem prestador)',
    dataHora,
    data,
    horarioInicio,
    duracaoMinutos,
    valor,
    desconto,
    valorFinal,
    comissao,
    status,
  }
}

function toApiPayload(payload: AgendamentoFormPayload) {
  return {
    clienteId: Number(payload.clienteId),
    colaboradorId: Number(payload.colaboradorId),
    servicoId: Number(payload.servicoId),
    dataHora: payload.dataHora,
    desconto: payload.desconto,
  }
}

export async function getAgendamentos(
  params: GetAgendamentosParams = {},
): Promise<Agendamento[]> {
  const qs = new URLSearchParams()
  const sessionUser = getSession()?.user
  if (params.inicio) qs.set('inicio', params.inicio)
  if (params.fim) qs.set('fim', params.fim)
  if (params.clienteId) qs.set('clienteId', params.clienteId)
  if (params.colaboradorId) qs.set('colaboradorId', params.colaboradorId)
  if (params.servicoId) qs.set('servicoId', params.servicoId)
  if (params.status) qs.set('status', params.status)
  if (sessionUser) {
    qs.set('usuarioLogadoId', String(sessionUser.id))
    qs.set('usuarioLogadoPerfilId', String(sessionUser.perfilId))
    qs.set('usuarioLogadoCargo', cargoFromUser(sessionUser))
  }

  const path = qs.size ? `/agendamentos?${qs.toString()}` : '/agendamentos'
  const data = await apiGetJson<unknown>(path)
  const arr = Array.isArray(data)
    ? data
    : data && typeof data === 'object' && Array.isArray((data as { data?: unknown }).data)
      ? (data as { data: unknown[] }).data
      : []

  return arr.map(agendamentoFromApi).filter((x): x is Agendamento => Boolean(x))
}

export async function criarAgendamento(
  payload: AgendamentoFormPayload,
): Promise<Agendamento> {
  const raw = await apiPostJson<unknown>('/agendamentos', toApiPayload(payload))
  const agendamento = agendamentoFromApi(raw)
  if (!agendamento) throw new Error('Resposta inválida ao cadastrar agendamento.')
  return agendamento
}

export async function atualizarAgendamento(
  id: string,
  payload: AgendamentoFormPayload,
): Promise<Agendamento> {
  const agendamentoId = id.trim()
  if (!/^\d+$/.test(agendamentoId)) {
    throw new Error('Identificador inválido para atualização.')
  }
  const raw = await apiPutJson<unknown>(
    `/agendamentos/${agendamentoId}`,
    toApiPayload(payload),
  )
  const agendamento = agendamentoFromApi(raw)
  if (!agendamento) throw new Error('Resposta inválida ao atualizar agendamento.')
  return agendamento
}

export async function deleteAgendamentoPorId(id: string): Promise<void> {
  const agendamentoId = id.trim()
  if (!/^\d+$/.test(agendamentoId)) {
    throw new Error('Identificador inválido para exclusão.')
  }
  await apiDelete(`/agendamentos/${agendamentoId}`)
}
