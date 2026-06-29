export type SessionUser = {
  id: number
  perfilId: number
  perfilNome: string
  /** adm | colaborador | cliente (vem do login) */
  cargo?: string
  nome: string
  email: string
  cadastroPendente?: boolean
  conviteToken?: string | null
}

export type Session = {
  user: SessionUser
}

const STORAGE_KEY = 'servify.session'
const DEFAULT_AUTHENTICATED_ROUTE = '/agendamentos'
const ROUTES_BY_CARGO: Record<string, string[] | null> = {
  adm: null,
  colaborador: ['/agendamentos', '/dashboard', '/disponibilidade'],
  cliente: ['/agendamentos'],
}

function normalizeText(value: unknown): string {
  return typeof value === 'string'
    ? value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim()
    : ''
}

function firstFilledString(values: unknown[]): string {
  for (const value of values) {
    const normalized = normalizeText(value)
    if (normalized) return normalized
  }
  return ''
}

function firstValidNumber(values: unknown[]): number {
  for (const value of values) {
    if (value === null || value === undefined || value === '') continue
    const parsed = Number(value)
    if (Number.isFinite(parsed)) return parsed
  }
  return Number.NaN
}

export function getSession(): Session | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as unknown
    if (!parsed || typeof parsed !== 'object') return null
    const obj = parsed as Record<string, unknown>
    const user =
      obj.user ??
      obj.usuario ??
      obj.data ??
      (typeof obj.email === 'string' ? obj : undefined)
    if (!user || typeof user !== 'object') return null
    return { user: user as SessionUser }
  } catch {
    return null
  }
}

export function getCurrentUser(): SessionUser | null {
  return getSession()?.user ?? null
}

export function setSession(session: Session): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(session))
}

export function clearSession(): void {
  localStorage.removeItem(STORAGE_KEY)
}

export function isAuthenticated(): boolean {
  return Boolean(getSession()?.user?.email)
}

export function cargoFromUser(user?: SessionUser | null): string {
  const rawUser = (user ?? {}) as Record<string, unknown>
  const rawPerfil =
    rawUser.perfil && typeof rawUser.perfil === 'object'
      ? (rawUser.perfil as Record<string, unknown>)
      : undefined
  const cargo = firstFilledString([
    user?.cargo,
    rawUser.cargo,
    rawUser.role,
    rawUser.tipo,
  ])
  const perfilNome = firstFilledString([
    user?.perfilNome,
    rawUser.perfilNome,
    rawUser.perfil_nome,
    rawUser.perfil,
    rawPerfil?.nome,
  ])
  const perfilId = firstValidNumber([
    user?.perfilId,
    rawUser.perfilId,
    rawUser.perfil_id,
    rawUser.idPerfil,
    rawUser.perfil,
    rawPerfil?.id,
  ])

  if (
    cargo === 'adm' ||
    cargo === '1' ||
    cargo === 'admin' ||
    cargo === 'administrador' ||
    perfilNome.includes('admin') ||
    perfilNome.includes('administrador') ||
    perfilId === 1
  ) {
    return 'adm'
  }

  if (cargo === 'colaborador' || perfilNome.includes('colaborador') || perfilId === 2) {
    return 'colaborador'
  }

  if (cargo === 'cliente' || perfilNome.includes('cliente') || perfilId === 3) {
    return 'cliente'
  }

  return ''
}

export function isAdminUser(user: SessionUser | null | undefined): boolean {
  return cargoFromUser(user) === 'adm'
}

export function getDefaultAuthenticatedRoute(): string {
  return DEFAULT_AUTHENTICATED_ROUTE
}

export function canAccessPrivateRoute(
  user: SessionUser | null | undefined,
  pathname: string,
): boolean {
  if (isAdminUser(user)) return true

  const cargo = cargoFromUser(user)
  const allowedRoutes = ROUTES_BY_CARGO[cargo] ?? ROUTES_BY_CARGO.cliente
  if (allowedRoutes === null) return true

  const normalizedPath = pathname.replace(/\/+$/, '') || '/'
  return allowedRoutes.some(
    (route) => normalizedPath === route || normalizedPath.startsWith(`${route}/`),
  )
}

/** Texto curto para exibir o perfil de acesso na UI */
export function formatPerfilAcesso(user: SessionUser): string {
  const c = cargoFromUser(user)
  if (c === 'adm') return 'Administrador'
  if (c === 'colaborador') return 'Colaborador'
  if (c === 'cliente') return 'Cliente'
  const nome = user.perfilNome?.trim()
  if (nome) return nome
  return 'Usuário'
}

export function initialsFromNome(nome: string): string {
  const t = nome.trim()
  if (!t) return '?'
  const parts = t.split(/\s+/).filter(Boolean)
  if (parts.length >= 2) {
    const a = parts[0][0]
    const b = parts[parts.length - 1][0]
    if (a && b) return (a + b).toUpperCase()
  }
  return t.slice(0, 2).toUpperCase()
}

