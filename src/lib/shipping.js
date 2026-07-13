// Cotação de frete via SuperFrete (https://superfrete.com), com fallback para
// uma cotação simulada caso a API esteja indisponível, sem token ou bloqueada
// por CORS — a demonstração nunca fica sem frete.

const SUPERFRETE_TOKEN = import.meta.env.VITE_SUPERFRETE_TOKEN || ''
const SUPERFRETE_URL = 'https://api.superfrete.com/api/v0/calculator'

// CEP de origem: sede da editora (Campina Grande – PB)
export const ORIGIN_CEP = '58429900'

const PICKUP_OPTION = {
  id: 'retirada',
  label: 'Retirada na editora (Campina Grande – PB)',
  price: 0,
  days: 0,
  source: 'local',
}

// Dimensões estimadas do pacote conforme a quantidade de volumes físicos
function packageFor(physicalCount) {
  return {
    height: Math.min(4 * physicalCount, 30),
    width: 16,
    length: 23,
    weight: Math.min(0.65 * physicalCount, 30),
  }
}

async function quoteSuperFrete(cep, physicalCount) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 8000)

  const res = await fetch(SUPERFRETE_URL, {
    method: 'POST',
    signal: controller.signal,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: `Bearer ${SUPERFRETE_TOKEN}`,
    },
    body: JSON.stringify({
      from: { postal_code: ORIGIN_CEP },
      to: { postal_code: cep },
      services: '1,2', // 1 = PAC, 2 = SEDEX
      options: {
        own_hand: false,
        receipt: false,
        insurance_value: 0,
        use_insurance_value: false,
      },
      package: packageFor(physicalCount),
    }),
  })
  clearTimeout(timer)

  if (!res.ok) throw new Error(`SuperFrete HTTP ${res.status}`)
  const data = await res.json()
  if (!Array.isArray(data)) throw new Error('Resposta inesperada da SuperFrete')

  const options = data
    .filter((s) => !s.error && s.price)
    .map((s) => ({
      id: String(s.id),
      label: `${s.name} (${s.company?.name ?? 'Correios'})`,
      price: parseFloat(s.price),
      days: s.delivery_time ?? s.delivery_range?.max ?? 0,
      source: 'superfrete',
    }))

  if (options.length === 0) throw new Error('SuperFrete não retornou serviços')
  return options
}

// Fallback: tarifas simuladas variando deterministicamente pelo CEP
function quoteFallback(cep) {
  const seed = parseInt(cep.slice(0, 5), 10) % 7
  const base = 14.9 + seed * 1.35
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([
        {
          id: 'pac',
          label: 'PAC (Correios)',
          price: Math.round(base * 100) / 100,
          days: 6 + (seed % 3),
          source: 'tabela',
        },
        {
          id: 'sedex',
          label: 'SEDEX (Correios)',
          price: Math.round(base * 1.8 * 100) / 100,
          days: 2 + (seed % 2),
          source: 'tabela',
        },
      ])
    }, 1000)
  })
}

/**
 * Cota o frete para um CEP. Tenta a SuperFrete quando há token configurado;
 * em qualquer falha usa a tabela local. Sempre inclui a retirada gratuita.
 */
export async function quoteShipping(cep, physicalCount = 1) {
  const digits = cep.replace(/\D/g, '')
  if (digits.length !== 8) {
    throw new Error('CEP inválido. Informe 8 dígitos.')
  }

  let options
  if (SUPERFRETE_TOKEN) {
    try {
      options = await quoteSuperFrete(digits, physicalCount)
    } catch (err) {
      console.warn('SuperFrete indisponível, usando tabela local:', err.message)
      options = await quoteFallback(digits)
    }
  } else {
    options = await quoteFallback(digits)
  }

  return [...options, PICKUP_OPTION]
}
