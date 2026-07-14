import emailjs from '@emailjs/browser'

// Credenciais do EmailJS lidas do .env (VITE_*). Sem elas, o sistema continua
// funcionando: o e-mail é registrado na Caixa de Saída com status "simulado".
const SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID
const TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID
const PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY

export const emailJsConfigured = Boolean(SERVICE_ID && TEMPLATE_ID && PUBLIC_KEY)

/**
 * Envia um e-mail real via EmailJS quando configurado; caso contrário resolve
 * como envio simulado. Retorna { status: 'enviado' | 'simulado' | 'falhou' }.
 */
export async function sendEmail({ to, subject, body }) {
  if (!emailJsConfigured) {
    return { status: 'simulado' }
  }
  try {
    await emailjs.send(
      SERVICE_ID,
      TEMPLATE_ID,
      { to_email: to, subject, message: body },
      { publicKey: PUBLIC_KEY },
    )
    return { status: 'enviado' }
  } catch (err) {
    console.error('EmailJS:', err)
    return { status: 'falhou' }
  }
}

export function buildReceiptEmail(order) {
  const lines = order.items
    .map((i) => `  ${i.quantity}x ${i.title} — R$ ${(i.price * i.quantity).toFixed(2)}`)
    .join('\n')

  const taxLines = []
  if (order.taxes.icms) {
    taxLines.push(
      `ICMS (${order.taxes.uf}, ${(order.taxes.icmsRate * 100).toLocaleString('pt-BR')}%): R$ ${order.taxes.icms.toFixed(2)}`,
    )
  }
  if (order.taxes.iss) {
    taxLines.push(`ISS (e-books): R$ ${order.taxes.iss.toFixed(2)}`)
  }

  const addressLine =
    order.address && !order.address.pickup
      ? `Entrega em: ${order.address.street}, ${order.address.number}` +
        `${order.address.complement ? ` — ${order.address.complement}` : ''}, ` +
        `${order.address.neighborhood}, ${order.address.city} – ${order.address.uf}, CEP ${order.address.cep}\n`
      : ''

  return {
    to: order.customer.email,
    subject: `[COMPIA] Comprovante de compra — Pedido ${order.id}`,
    body:
      `Olá, ${order.customer.name}.\n\n` +
      `Recebemos o seu pedido ${order.id} em ${new Date(order.createdAt).toLocaleString('pt-BR')}.\n\n` +
      `Itens:\n${lines}\n\n` +
      `Frete: ${order.shipping.label} — R$ ${order.shipping.price.toFixed(2)}\n` +
      addressLine +
      (taxLines.length > 0 ? taxLines.join('\n') + '\n' : '') +
      `Total: R$ ${order.total.toFixed(2)}\n` +
      `Pagamento: ${order.payment.method === 'pix' ? 'PIX' : 'Cartão de crédito'}\n\n` +
      `Editora COMPIA — Computação e Inteligência Artificial`,
  }
}

export function buildConfirmationEmail(order) {
  return {
    to: order.customer.email,
    subject: `[COMPIA] Pedido ${order.id} confirmado`,
    body:
      `Olá, ${order.customer.name}.\n\n` +
      `O pagamento do pedido ${order.id} foi aprovado e ele já está em preparação.\n` +
      `Você pode acompanhar o status na sua conta em nosso site.\n\n` +
      `Editora COMPIA`,
  }
}

export function buildEbookEmail(order, ebookItems) {
  const links = ebookItems
    .map((i) => `  ${i.title}:\n  ${window.location.origin}/downloads/${i.downloadFile || i.id + '.pdf'}`)
    .join('\n\n')
  return {
    to: order.customer.email,
    subject: `[COMPIA] Seus e-books do pedido ${order.id} estão disponíveis`,
    body:
      `Olá, ${order.customer.name}.\n\n` +
      `Os e-books do pedido ${order.id} já podem ser baixados pelos links abaixo ` +
      `ou pela sua área do cliente:\n\n${links}\n\n` +
      `Os links não expiram. Boa leitura!\n\nEditora COMPIA`,
  }
}
