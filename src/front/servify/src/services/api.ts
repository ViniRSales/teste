export type ApiError = Error & { status?: number }

/**
 * URL base da API.
 * - Produção: use `VITE_API_BASE_URL` (ex.: mesma origem ou CDN da API).
 * - Desenvolvimento: se não houver env, usa `http://localhost:8080` para o
 *   navegador chamar a API diretamente (aparece como :8080 no DevTools).
 *   O backend precisa liberar CORS para `http://localhost:5173` (ou a porta do Vite).
 * - Para forçar proxy do Vite (URL relativa, aparece :5173 no DevTools), crie
 *   `.env.development` com `VITE_API_BASE_URL=` (vazio).
 */
function resolveApiBaseUrl(): string {
  const raw = import.meta.env.VITE_API_BASE_URL
  if (raw !== undefined) {
    return String(raw).trim().replace(/\/+$/, '')
  }
  if (import.meta.env.DEV) {
    return 'http://localhost:8080'
  }
  return ''
}

const API_BASE_URL = resolveApiBaseUrl()

function joinUrl(base: string, path: string): string {
  if (!base) return path.startsWith('/') ? path : `/${path}`
  if (!path) return base
  return `${base.replace(/\/+$/, '')}/${path.replace(/^\/+/, '')}`
}

function pickNonEmptyString(v: unknown): string | undefined {
  if (typeof v === 'string' && v.trim()) return v.trim()
  return undefined
}

/**
 * Extrai mensagem legível do corpo de erro da API (Spring, ProblemDetail, Bean Validation).
 * Usado por `parseErrorMessage` e por telas que fazem `fetch` manual.
 */
export function formatApiErrorMessage(status: number, rawBody: string): string {
  const trimmed = rawBody.trim()
  if (!trimmed) {
    return `Falha na requisição (HTTP ${status}).`
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(trimmed)
  } catch {
    return trimmed.length > 400 ? `${trimmed.slice(0, 400)}…` : trimmed
  }

  if (!parsed || typeof parsed !== 'object') {
    return `Falha na requisição (HTTP ${status}).`
  }

  const o = parsed as Record<string, unknown>
  const direct =
    pickNonEmptyString(o.message) ??
    pickNonEmptyString(o.error) ??
    pickNonEmptyString(o.detail) ??
    pickNonEmptyString(o.title)
  if (direct) return direct

  const errs = o.errors
  if (Array.isArray(errs)) {
    const parts: string[] = []
    for (const item of errs) {
      if (typeof item === 'string' && item.trim()) {
        parts.push(item.trim())
        continue
      }
      if (item && typeof item === 'object') {
        const fe = item as Record<string, unknown>
        const dm =
          pickNonEmptyString(fe.defaultMessage) ?? pickNonEmptyString(fe.message)
        const field =
          pickNonEmptyString(fe.field) ?? pickNonEmptyString(fe.property)
        if (dm) parts.push(field ? `${field}: ${dm}` : dm)
      }
    }
    if (parts.length) return parts.join('; ')
  }

  if (errs && typeof errs === 'object' && !Array.isArray(errs)) {
    const parts: string[] = []
    for (const v of Object.values(errs as Record<string, unknown>)) {
      if (typeof v === 'string' && v.trim()) {
        parts.push(v.trim())
      } else if (Array.isArray(v)) {
        const first = v.find((x) => typeof x === 'string' && String(x).trim())
        if (typeof first === 'string') parts.push(first.trim())
      }
    }
    if (parts.length) return parts.join('; ')
  }

  return `Falha na requisição (HTTP ${status}).`
}

/** Mensagem para exibir em toast/alert a partir de um `catch` (ex.: após `apiPostJson`). */
export function mensagemDeErroCapturado(
  err: unknown,
  fallback: string,
): string {
  if (err instanceof Error && err.message.trim()) return err.message.trim()
  return fallback
}

async function parseErrorMessage(res: Response): Promise<string> {
  const raw = await res.text()
  return formatApiErrorMessage(res.status, raw)
}

export async function apiGetJson<T>(
  path: string,
  init?: Omit<RequestInit, 'method'>,
): Promise<T> {
  const url = joinUrl(API_BASE_URL, path)
  const res = await fetch(url, {
    ...init,
    method: 'GET',
    headers: {
      Accept: 'application/json',
      ...(init?.headers ?? {}),
    },
  })

  if (!res.ok) {
    const err = new Error(await parseErrorMessage(res)) as ApiError
    err.status = res.status
    throw err
  }

  return (await res.json()) as T
}

export async function apiPostJson<T>(
  path: string,
  body: unknown,
  init?: Omit<RequestInit, 'method' | 'body'>,
): Promise<T> {
  const url = joinUrl(API_BASE_URL, path)
  const res = await fetch(url, {
    ...init,
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const err = new Error(await parseErrorMessage(res)) as ApiError
    err.status = res.status
    throw err
  }

  return (await res.json()) as T
}

export async function apiPutJson<T>(
  path: string,
  body: unknown,
  init?: Omit<RequestInit, 'method' | 'body'>,
): Promise<T> {
  const url = joinUrl(API_BASE_URL, path)
  const res = await fetch(url, {
    ...init,
    method: 'PUT',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const err = new Error(await parseErrorMessage(res)) as ApiError
    err.status = res.status
    throw err
  }

  return (await res.json()) as T
}

export async function apiDelete(
  path: string,
  init?: Omit<RequestInit, 'method'>,
): Promise<void> {
  const url = joinUrl(API_BASE_URL, path)
  const res = await fetch(url, {
    ...init,
    method: 'DELETE',
    headers: {
      Accept: 'application/json',
      ...(init?.headers ?? {}),
    },
  })

  if (!res.ok) {
    const err = new Error(await parseErrorMessage(res)) as ApiError
    err.status = res.status
    throw err
  }
}

