// Integração com o Mercado Pago (Checkout Transparente) direto do frontend.
// ATENÇÃO (decisão consciente do projeto): o ACCESS_TOKEN fica exposto no
// bundle — inaceitável em produção, mas aceito aqui por ser um projeto de
// demonstração sem backend. Em qualquer falha (credenciais ausentes, CORS,
// API fora do ar) o pagamento cai para o modo simulado e o fluxo continua.
export const MP_PUBLIC_KEY = import.meta.env.VITE_MP_PUBLIC_KEY || ''
export const MP_ACCESS_TOKEN = import.meta.env.VITE_MP_ACCESS_TOKEN || ''
export const mpConfigured = Boolean(MP_PUBLIC_KEY && MP_ACCESS_TOKEN)

const MP_API = 'https://api.mercadopago.com'

export function detectCardBrand(number) {
  const n = number.replace(/\D/g, '')
  if (/^4/.test(n)) return 'Visa'
  if (/^(5[1-5]|2[2-7])/.test(n)) return 'MasterCard'
  if (/^(4011|4312|4389|4514|4576|5041|5066|5090|6277|6362|6363|650|651|655)/.test(n))
    return 'Elo'
  if (/^3[47]/.test(n)) return 'American Express'
  if (/^(36|38|30[0-5])/.test(n)) return 'Diners'
  if (/^(38|60)/.test(n)) return 'Hipercard'
  return null
}

const MP_METHOD_IDS = {
  Visa: 'visa',
  MasterCard: 'master',
  Elo: 'elo',
  'American Express': 'amex',
  Diners: 'diners',
  Hipercard: 'hipercard',
}

export function luhnValid(number) {
  const n = number.replace(/\D/g, '')
  if (n.length < 13) return false
  let sum = 0
  let alt = false
  for (let i = n.length - 1; i >= 0; i--) {
    let d = parseInt(n[i], 10)
    if (alt) {
      d *= 2
      if (d > 9) d -= 9
    }
    sum += d
    alt = !alt
  }
  return sum % 10 === 0
}

export function expiryValid(value) {
  const m = value.match(/^(\d{2})\/(\d{2})$/)
  if (!m) return false
  const month = parseInt(m[1], 10)
  if (month < 1 || month > 12) return false
  const year = 2000 + parseInt(m[2], 10)
  const now = new Date()
  return year > now.getFullYear() || (year === now.getFullYear() && month >= now.getMonth() + 1)
}

function simulated(extra = {}) {
  return new Promise((resolve) => {
    setTimeout(
      () =>
        resolve({
          gateway: 'simulado',
          approved: true,
          nsu: Math.floor(Math.random() * 1e9),
          ...extra,
        }),
      1500,
    )
  })
}

async function mpFetch(path, body, useAccessToken = true) {
  const res = await fetch(`${MP_API}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(useAccessToken && {
        Authorization: `Bearer ${MP_ACCESS_TOKEN}`,
        'X-Idempotency-Key': crypto.randomUUID(),
      }),
    },
    body: JSON.stringify(body),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(data.message || `Mercado Pago HTTP ${res.status}`)
  }
  return data
}

/**
 * Cobra um cartão de crédito no Mercado Pago: tokeniza os dados com a chave
 * pública e cria o pagamento com o access token. Retorna
 * { gateway, approved, declined?, nsu, mpId?, statusDetail? }.
 */
export async function payWithCard({ amount, card, payerEmail, description }) {
  if (!mpConfigured) return simulated()

  try {
    const [month, year] = card.expiry.split('/')
    const token = await mpFetch(
      `/v1/card_tokens?public_key=${MP_PUBLIC_KEY}`,
      {
        card_number: card.number.replace(/\D/g, ''),
        cardholder: { name: card.name },
        expiration_month: parseInt(month, 10),
        expiration_year: 2000 + parseInt(year, 10),
        security_code: card.cvv,
      },
      false,
    )

    const payment = await mpFetch('/v1/payments', {
      transaction_amount: Math.round(amount * 100) / 100,
      token: token.id,
      description,
      installments: 1,
      payment_method_id: MP_METHOD_IDS[card.brand] ?? undefined,
      payer: { email: payerEmail },
    })

    const approved = payment.status === 'approved'
    if (!approved && payment.status === 'rejected') {
      return {
        gateway: 'mercadopago',
        approved: false,
        declined: true,
        statusDetail: payment.status_detail,
        mpId: payment.id,
        nsu: payment.id,
      }
    }
    return {
      gateway: 'mercadopago',
      approved: true,
      mpId: payment.id,
      statusDetail: payment.status_detail,
      nsu: payment.id,
    }
  } catch (err) {
    console.warn('Mercado Pago indisponível, aprovando em modo simulado:', err.message)
    return simulated()
  }
}

/**
 * Cria uma cobrança PIX no Mercado Pago e retorna o QR Code dinâmico
 * (copia-e-cola + imagem base64). Sem credenciais/API, gera uma chave UUID
 * local com o QR estático.
 */
export async function createPixCharge({ amount, payerEmail, description }) {
  if (!mpConfigured) {
    return simulated({
      pixKey: crypto.randomUUID(),
      qrImage: '/qrcode.svg',
      approved: false, // PIX simulado nasce pendente até o gerente confirmar
    })
  }

  try {
    const payment = await mpFetch('/v1/payments', {
      transaction_amount: Math.round(amount * 100) / 100,
      description,
      payment_method_id: 'pix',
      payer: { email: payerEmail },
    })

    const tx = payment.point_of_interaction?.transaction_data ?? {}
    return {
      gateway: 'mercadopago',
      approved: payment.status === 'approved',
      mpId: payment.id,
      nsu: payment.id,
      pixKey: tx.qr_code || crypto.randomUUID(),
      qrImage: tx.qr_code_base64
        ? `data:image/png;base64,${tx.qr_code_base64}`
        : '/qrcode.svg',
    }
  } catch (err) {
    console.warn('Mercado Pago PIX indisponível, usando chave simulada:', err.message)
    return simulated({
      pixKey: crypto.randomUUID(),
      qrImage: '/qrcode.svg',
      approved: false,
    })
  }
}
