/**
 * Lista de municípios brasileiros (API pública IBGE).
 * @see https://servicodados.ibge.gov.br/api/docs/localidades
 */

export type MunicipioBrasil = {
  id: number
  nome: string
  uf: string
  /** Ex.: "Campinas - SP" */
  label: string
}

type IbgeMunicipioJson = {
  id: number
  nome: string
  microrregiao?: {
    mesorregiao?: {
      UF?: { sigla?: string }
    }
  }
}

const IBGE_URL =
  'https://servicodados.ibge.gov.br/api/v1/localidades/municipios?orderBy=nome'

let cache: MunicipioBrasil[] | null = null
let loading: Promise<MunicipioBrasil[]> | null = null

function mapRow(m: IbgeMunicipioJson): MunicipioBrasil {
  const uf = m.microrregiao?.mesorregiao?.UF?.sigla ?? ''
  const nome = m.nome ?? ''
  return {
    id: m.id,
    nome,
    uf,
    label: uf ? `${nome} - ${uf}` : nome,
  }
}

/** Remove acentos para busca (Unicode-safe). */
export function normalizeSearch(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
}

export async function fetchMunicipiosBrasil(
  signal?: AbortSignal,
): Promise<MunicipioBrasil[]> {
  if (cache) return cache

  if (!loading) {
    loading = (async () => {
      const res = await fetch(IBGE_URL, {
        signal,
        headers: { Accept: 'application/json' },
      })
      if (!res.ok) throw new Error('Falha ao carregar municípios (IBGE)')
      const data = (await res.json()) as unknown
      const arr = Array.isArray(data)
        ? data
        : data &&
            typeof data === 'object' &&
            'value' in data &&
            Array.isArray((data as { value: unknown }).value)
          ? (data as { value: IbgeMunicipioJson[] }).value
          : []
      cache = arr.map(mapRow).filter((m) => m.nome && m.uf)
      return cache
    })().finally(() => {
      loading = null
    })
  }

  return loading
}

/** Busca por nome da cidade, UF ou "Nome - UF". Limita resultados para performance. */
export function filterMunicipios(
  list: MunicipioBrasil[],
  query: string,
  limit = 80,
): MunicipioBrasil[] {
  const q = normalizeSearch(query)
  /** Sem consulta, não listamos milhares de municípios no dropdown. */
  if (!q.length) return []

  const out: MunicipioBrasil[] = []
  for (const m of list) {
    const nn = normalizeSearch(m.nome)
    const lu = m.uf.toLowerCase()
    const lbl = normalizeSearch(m.label)
    if (
      nn.includes(q) ||
      lu.includes(q) ||
      lbl.includes(q) ||
      normalizeSearch(`${m.nome}${m.uf}`).includes(q.replace(/\s/g, ''))
    ) {
      out.push(m)
      if (out.length >= limit) break
    }
  }
  return out
}

/** Correspondência exata por nome de cidade (sem acento) e UF. */
export function findMunicipioByNomeUf(
  list: MunicipioBrasil[],
  nomeCidade: string,
  uf: string,
): MunicipioBrasil | undefined {
  const nn = normalizeSearch(nomeCidade)
  const u = uf.trim().toUpperCase()
  return list.find(
    (m) =>
      normalizeSearch(m.nome) === nn &&
      m.uf.toUpperCase() === u,
  )
}
