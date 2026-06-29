import { type ApiError, apiGetJson, apiPostJson } from './api'

export type GmailOAuthStatus = {
  connected: boolean
  browserFlowConfigured: boolean
}

function isNotFound(e: unknown): boolean {
  return Boolean(e && typeof e === 'object' && 'status' in e && (e as ApiError).status === 404)
}

export async function fetchGmailOAuthStatus(): Promise<GmailOAuthStatus | null> {
  try {
    return await apiGetJson<GmailOAuthStatus>('/mail/gmail/oauth/status')
  } catch (e: unknown) {
    if (isNotFound(e)) return null
    throw e
  }
}

export async function getGmailAuthorizeUrl(): Promise<string> {
  const r = await apiGetJson<{ url: string }>('/mail/gmail/oauth/authorize-url')
  if (!r.url?.trim()) {
    throw new Error('URL de autorização vazia.')
  }
  return r.url
}

export async function exchangeGmailOAuthCode(code: string): Promise<void> {
  await apiPostJson<unknown>('/mail/gmail/oauth/exchange', { code })
}
