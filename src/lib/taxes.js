// ICMS incide sobre mercadorias físicas com alíquota interna do estado de
// destino (identificado pelo CEP); ISS incide sobre bens digitais (e-books).
// Alíquotas modais internas por UF (valores de referência para a simulação).
export const ICMS_RATES = {
  AC: 0.19,
  AL: 0.2,
  AP: 0.18,
  AM: 0.2,
  BA: 0.205,
  CE: 0.2,
  DF: 0.2,
  ES: 0.17,
  GO: 0.19,
  MA: 0.23,
  MT: 0.17,
  MS: 0.17,
  MG: 0.18,
  PA: 0.19,
  PB: 0.2,
  PR: 0.195,
  PE: 0.205,
  PI: 0.225,
  RJ: 0.22,
  RN: 0.2,
  RS: 0.17,
  RO: 0.195,
  RR: 0.2,
  SC: 0.17,
  SP: 0.18,
  SE: 0.2,
  TO: 0.2,
}

export const ISS_RATE = 0.05

/**
 * Calcula os impostos de uma lista de itens do carrinho.
 * Kits são tratados como mercadoria física (contêm ao menos um livro impresso).
 * O ICMS depende da UF de destino; sem UF (CEP ainda não informado), retorna
 * icms = null para a interface sinalizar que falta o CEP.
 */
export function calculateTaxes(items, uf) {
  let icmsBase = 0
  let issBase = 0

  for (const item of items) {
    const subtotal = item.price * item.quantity
    if (item.type === 'ebook') {
      issBase += subtotal
    } else {
      icmsBase += subtotal
    }
  }

  const icmsRate = uf ? (ICMS_RATES[uf] ?? null) : null
  const icms = icmsBase === 0 ? 0 : icmsRate !== null ? icmsBase * icmsRate : null
  const iss = issBase * ISS_RATE

  return {
    icms,
    iss,
    icmsRate,
    uf: uf ?? null,
    total: icms === null ? null : icms + iss,
  }
}

export function cartHasPhysical(items) {
  return items.some((i) => i.type !== 'ebook')
}

export function cartHasEbook(items) {
  return items.some((i) => i.type === 'ebook' || i.type === 'kit')
}
