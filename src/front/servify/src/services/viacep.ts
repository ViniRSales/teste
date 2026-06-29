export type ViaCepAddress = {
  logradouro: string
  bairro: string
  cidade: string
  uf: string
}

export type ViaCepJson = {
  cep?: string
  logradouro?: string
  complemento?: string
  bairro?: string
  localidade?: string
  uf?: string
  erro?: boolean
}

/** Somente dígitos, no máximo 8 (CEP Brasil). */
export function cepDigits(value: string): string {
  return value.replace(/\D/g, '').slice(0, 8)
}

/** Exibição 00000-000 */
export function formatCepDisplay(digits: string): string {
  if (digits.length <= 5) return digits
  return `${digits.slice(0, 5)}-${digits.slice(5)}`
}

/**
 * Consulta CEP na API pública ViaCEP.
 * @see https://viacep.com.br/
 */
export async function fetchAddressByCep(
  digits: string,
  signal?: AbortSignal,
): Promise<ViaCepAddress | null> {
  if (digits.length !== 8) return null

  const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`, {
    signal,
    headers: { Accept: 'application/json' },
  })

  if (!res.ok) return null

  const data = (await res.json()) as ViaCepJson
  if (data.erro) return null

  return {
    logradouro: data.logradouro ?? '',
    bairro: data.bairro ?? '',
    cidade: data.localidade ?? '',
    uf: data.uf ?? '',
  }
}
