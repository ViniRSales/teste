import { apiGetJson, apiPutJson } from './api'
import { getSession } from '../auth/session'

export type DiaSemana =
  | 'MONDAY'
  | 'TUESDAY'
  | 'WEDNESDAY'
  | 'THURSDAY'
  | 'FRIDAY'
  | 'SATURDAY'
  | 'SUNDAY'

export type AgendaDisponibilidade = {
  id: number
  colaboradorId: number
  colaboradorNome: string
  diaSemana: DiaSemana
  disponivel: boolean
  horaInicio: string
  horaFim: string
}

export type AgendaDisponibilidadePayload = {
  disponivel: boolean
  horaInicio: string
  horaFim: string
}

export const DIAS_SEMANA_LABEL: Record<DiaSemana, string> = {
  MONDAY: 'Segunda-feira',
  TUESDAY: 'Terça-feira',
  WEDNESDAY: 'Quarta-feira',
  THURSDAY: 'Quinta-feira',
  FRIDAY: 'Sexta-feira',
  SATURDAY: 'Sábado',
  SUNDAY: 'Domingo',
}

/** Ordem de exibição: segunda a domingo */
export const DIAS_SEMANA_ORDEM: DiaSemana[] = [
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
  'SUNDAY',
]

/** Normaliza "HH:mm:ss" ou "HH:mm" para "HH:mm" */
function normalizarHora(hora: string): string {
  if (!hora) return ''
  return hora.slice(0, 5)
}

function normalizeItem(raw: unknown): AgendaDisponibilidade | null {
  if (!raw || typeof raw !== 'object') return null
  const obj = raw as Record<string, unknown>

  const id = Number(obj.id)
  const colaboradorId = Number(obj.colaboradorId)
  const colaboradorNome =
    typeof obj.colaboradorNome === 'string' ? obj.colaboradorNome : ''
  const diaSemana = obj.diaSemana as DiaSemana
  const disponivel = Boolean(obj.disponivel)
  const horaInicio = normalizarHora(String(obj.horaInicio ?? ''))
  const horaFim = normalizarHora(String(obj.horaFim ?? ''))

  if (!id || !diaSemana) return null

  return { id, colaboradorId, colaboradorNome, diaSemana, disponivel, horaInicio, horaFim }
}

export async function getDisponibilidadePorColaborador(
  colaboradorId: number,
): Promise<AgendaDisponibilidade[]> {
  const data = await apiGetJson<unknown>(
    `/agenda-disponibilidade/colaborador/${colaboradorId}`,
  )
  const arr = Array.isArray(data) ? data : []
  return arr.map(normalizeItem).filter((x): x is AgendaDisponibilidade => Boolean(x))
}

export async function atualizarDisponibilidade(
  id: number,
  payload: AgendaDisponibilidadePayload,
): Promise<AgendaDisponibilidade> {
  const session = getSession()
  const user = session?.user
  const qs = new URLSearchParams()
  if (user?.id) qs.set('usuarioLogadoId', String(user.id))
  if (user?.perfilId) qs.set('usuarioLogadoPerfilId', String(user.perfilId))

  const raw = await apiPutJson<unknown>(
    `/agenda-disponibilidade/${id}?${qs.toString()}`,
    {
      disponivel: payload.disponivel,
      horaInicio: `${payload.horaInicio}:00`,
      horaFim: `${payload.horaFim}:00`,
    },
  )

  const item = normalizeItem(raw)
  if (!item) throw new Error('Resposta inválida ao atualizar disponibilidade.')
  return item
}