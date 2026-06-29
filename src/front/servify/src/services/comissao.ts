import { apiGetJson, apiPostJson, apiPutJson } from './api'

export type ComissaoApi = Record<string, unknown>

export type ColaboradorComissao = {
    usuarioId: number
    usuarioNome: string
    comissaoId: number | null
    valor: number
}

export type ComissaoPayload = {
    usuarioId: number
    valor: number
}

function pickNumber(obj: ComissaoApi, keys: string[]): number {
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

function pickString(obj: ComissaoApi, keys: string[]): string {
    for (const k of keys) {
        const v = obj[k]
        if (typeof v === 'string' && v.trim()) return v.trim()
        if (typeof v === 'number' && Number.isFinite(v)) return String(v)
    }
    return ''
}

export function colaboradorComissaoFromApi(raw: unknown): ColaboradorComissao | null {
    if (!raw || typeof raw !== 'object') return null
    const obj = raw as ComissaoApi

    const usuarioId = pickNumber(obj, ['usuarioId'])
    const usuarioNome = pickString(obj, ['usuarioNome'])
    const comissaoIdRaw = obj['comissaoId']
    const comissaoId = typeof comissaoIdRaw === 'number' ? comissaoIdRaw : null
    const valor = pickNumber(obj, ['valor'])

    if (!usuarioId || !usuarioNome) return null

    return {
        usuarioId,
        usuarioNome,
        comissaoId,
        valor
    }
}

export async function getColaboradoresComissao(): Promise<ColaboradorComissao[]> {
    const path = '/comissoes/colaboradores'
    const data = await apiGetJson<unknown>(path)

    const arr = Array.isArray(data)
        ? data
        : data && typeof data == 'object' && Array.isArray((data as { data?: unknown }).data)
            ? (data as { data: unknown[] }).data
            : []
    return arr.map(colaboradorComissaoFromApi).filter((x): x is ColaboradorComissao => Boolean(x))
}

export async function criarComissao(payload: ComissaoPayload): Promise<ColaboradorComissao> {
    const raw = await apiPostJson<unknown>('/comissoes',
        { usuarioId: payload.usuarioId, valor: payload.valor })
    const comissao = colaboradorComissaoFromApi(raw)
    if (!comissao) throw new Error('Resposta inválida ao cadastrar comissão.')
    return comissao
}

export async function atualizarComissao(id: number, payload: ComissaoPayload): Promise<ColaboradorComissao> {
    const raw = await apiPutJson<unknown>(`/comissoes/${id}`,
        { usuarioId: payload.usuarioId, valor: payload.valor })
    const comissao = colaboradorComissaoFromApi(raw)
    if (!comissao) throw new Error('Resposta inválida ao atualizar comissão.')
    return comissao
}