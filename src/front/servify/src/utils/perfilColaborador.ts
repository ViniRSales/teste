export const PERFIS_COLABORADOR = [
  { value: 'adm', label: 'Administrador' },
  { value: 'colaborador', label: 'Colaborador' },
] as const

export function labelPerfilColaborador(value: string): string {
  const p = PERFIS_COLABORADOR.find((x) => x.value === value)
  return p?.label ?? value
}

export function perfilColaboradorFromInitial(cargo: string): string {
  return cargo === 'adm' || cargo === 'colaborador' ? cargo : ''
}

/** IDs alinhados ao seed do backend: 1 Administrador, 2 Colaborador, 3 Cliente */
export function perfilIdParaConvite(cargo: string): number | null {
  if (cargo === 'adm') return 1
  if (cargo === 'colaborador') return 2
  return null
}

export function cargoColaboradorFromPerfilId(perfilId: number): string {
  if (perfilId === 1) return 'adm'
  if (perfilId === 2) return 'colaborador'
  return ''
}
