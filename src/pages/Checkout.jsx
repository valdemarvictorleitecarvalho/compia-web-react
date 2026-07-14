import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useCart } from '../contexts/CartContext'
import { useAuth } from '../contexts/AuthContext'
import { useStore } from '../contexts/StoreContext'
import { calculateTaxes } from '../lib/taxes'
import { formatBRL, maskCardNumber, maskExpiry } from '../lib/format'
import {
  detectCardBrand,
  luhnValid,
  expiryValid,
  payWithCard,
  createPixCharge,
  mpConfigured,
} from '../lib/payment'
import {
  buildReceiptEmail,
  buildConfirmationEmail,
  buildEbookEmail,
  emailJsConfigured,
} from '../lib/email'

const CARD_BRANDS = ['Visa', 'MasterCard', 'Elo', 'American Express', 'Hipercard']
const UFS = 'AC AL AP AM BA CE DF ES GO MA MT MS MG PA PB PR PE PI RJ RN RS RO RR SC SP SE TO'.split(' ')

function newOrderId() {
  const d = new Date()
  const ymd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase()
  return `PED-${ymd}-${rand}`
}

export default function Checkout() {
  const navigate = useNavigate()
  const { state } = useLocation()
  const { items, subtotal, clearCart } = useCart()
  const { user } = useAuth()
  const { createOrder, dispatchEmail } = useStore()

  const shipping = state?.shipping
  const destination = state?.destination ?? null
  const isPickup = shipping?.id === 'retirada'
  const needsAddress = Boolean(destination) && !isPickup

  const taxes = calculateTaxes(items, destination?.uf)
  const total = subtotal + (taxes.total ?? 0) + (shipping?.price ?? 0)

  const isCliente = user?.role === 'cliente'
  const [name, setName] = useState(isCliente ? user.name : '')
  const [email, setEmail] = useState(isCliente ? user.email : '')

  // Endereço de entrega (pré-preenchido pelo ViaCEP quando disponível)
  const [address, setAddress] = useState({
    street: destination?.street ?? '',
    number: '',
    complement: '',
    neighborhood: destination?.neighborhood ?? '',
    city: destination?.city ?? '',
    uf: destination?.uf ?? '',
  })

  const [method, setMethod] = useState('cartao')

  // Cartão
  const [cardNumber, setCardNumber] = useState('')
  const [cardName, setCardName] = useState('')
  const [expiry, setExpiry] = useState('')
  const [cvv, setCvv] = useState('')
  const brand = detectCardBrand(cardNumber)

  const [errors, setErrors] = useState([])
  const [processing, setProcessing] = useState(false)

  if (!shipping || items.length === 0) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-16 text-center">
        <h1 className="font-serif text-2xl font-bold">Nada para pagar por aqui.</h1>
        <p className="mt-2 text-ink/60">Monte o carrinho e selecione o frete primeiro.</p>
        <Link to="/carrinho" className="mt-4 inline-block text-wine underline">
          Voltar ao carrinho
        </Link>
      </main>
    )
  }

  function setAddr(field, value) {
    setAddress((a) => ({ ...a, [field]: value }))
  }

  function validate() {
    const errs = []
    if (name.trim().length < 3) errs.push('Informe o nome completo.')
    if (!/^\S+@\S+\.\S+$/.test(email)) errs.push('Informe um e-mail válido.')
    if (needsAddress) {
      if (!address.street.trim()) errs.push('Informe a rua/logradouro da entrega.')
      if (!address.number.trim()) errs.push('Informe o número do endereço.')
      if (!address.neighborhood.trim()) errs.push('Informe o bairro.')
      if (!address.city.trim()) errs.push('Informe a cidade.')
      if (!address.uf) errs.push('Selecione o estado (UF).')
    }
    if (method === 'cartao') {
      if (!luhnValid(cardNumber)) errs.push('Número de cartão inválido.')
      if (!brand) errs.push('Bandeira não reconhecida.')
      if (cardName.trim().length < 3) errs.push('Informe o nome impresso no cartão.')
      if (!expiryValid(expiry)) errs.push('Validade inválida (use MM/AA).')
      if (!/^\d{3,4}$/.test(cvv)) errs.push('CVV inválido.')
    }
    return errs
  }

  async function handleConfirm(e) {
    e.preventDefault()
    const errs = validate()
    setErrors(errs)
    if (errs.length > 0) return

    setProcessing(true)
    const description = `Pedido COMPIA — ${items.map((i) => i.title).join(', ')}`

    let result
    if (method === 'cartao') {
      result = await payWithCard({
        amount: total,
        payerEmail: email.trim(),
        description,
        card: { number: cardNumber, name: cardName, expiry, cvv, brand },
      })
      if (result.declined) {
        setErrors([
          `Pagamento recusado pelo Mercado Pago (${result.statusDetail}). Revise os dados ou tente outro cartão.`,
        ])
        setProcessing(false)
        return
      }
    } else {
      result = await createPixCharge({
        amount: total,
        payerEmail: email.trim(),
        description,
      })
    }

    const order = {
      id: newOrderId(),
      createdAt: new Date().toISOString(),
      customer: { name: name.trim(), email: email.trim() },
      items,
      subtotal,
      taxes,
      shipping,
      address: needsAddress
        ? { ...address, cep: shipping.cep }
        : isPickup
          ? { pickup: true }
          : null,
      total,
      payment:
        method === 'cartao'
          ? {
              method: 'cartao',
              brand,
              last4: cardNumber.replace(/\D/g, '').slice(-4),
              gateway: result.gateway,
              mpId: result.mpId ?? null,
              nsu: result.nsu,
            }
          : {
              method: 'pix',
              gateway: result.gateway,
              mpId: result.mpId ?? null,
              nsu: result.nsu,
              pixKey: result.pixKey,
              qrImage: result.qrImage,
            },
      // Cartão aprovado paga na hora; PIX nasce pendente até a compensação
      status: method === 'cartao' && result.approved ? 'Pago' : 'Pendente',
    }

    createOrder(order)

    await dispatchEmail('Comprovante de compra', buildReceiptEmail(order))
    if (order.status === 'Pago') {
      await dispatchEmail('Confirmação do pedido', buildConfirmationEmail(order))
    }
    const ebookItems = items.filter((i) => i.type === 'ebook' || i.downloadFile)
    if (ebookItems.length > 0) {
      await dispatchEmail('Link de download (e-book)', buildEbookEmail(order, ebookItems))
    }

    clearCart()
    navigate(`/pedido-confirmado/${order.id}`, { state: { order } })
  }

  const inputClass =
    'w-full border border-slate-300 bg-white px-3 py-2 text-sm focus:border-wine focus:outline-none'

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="font-serif text-3xl font-bold">Pagamento</h1>
      <p className="mt-1 text-xs text-ink/50">
        Processado via Mercado Pago{' '}
        {mpConfigured ? '(integração ativa)' : '(ambiente de simulação)'}
      </p>

      <form onSubmit={handleConfirm} className="mt-8 grid gap-10 lg:grid-cols-[1fr_360px]">
        <div className="space-y-8">
          {/* Dados do comprador */}
          <section className="border border-slate-300 p-5">
            <h2 className="font-serif text-lg font-semibold">Dados do comprador</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className="block text-sm">
                <span className="text-ink/70">Nome completo</span>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={`mt-1 ${inputClass}`}
                />
              </label>
              <label className="block text-sm">
                <span className="text-ink/70">E-mail (receberá o comprovante)</span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`mt-1 ${inputClass}`}
                />
              </label>
            </div>
          </section>

          {/* Endereço de entrega */}
          {needsAddress && (
            <section className="border border-slate-300 p-5">
              <h2 className="font-serif text-lg font-semibold">Endereço de entrega</h2>
              <p className="mt-1 text-xs text-ink/50">
                CEP <span className="font-mono">{shipping.cep}</span>
                {destination?.source === 'viacep' &&
                  ' — endereço localizado na base dos Correios, confira e complete o número.'}
              </p>
              <div className="mt-4 grid gap-4 sm:grid-cols-[1fr_120px]">
                <label className="block text-sm">
                  <span className="text-ink/70">Rua / logradouro</span>
                  <input
                    value={address.street}
                    onChange={(e) => setAddr('street', e.target.value)}
                    className={`mt-1 ${inputClass}`}
                  />
                </label>
                <label className="block text-sm">
                  <span className="text-ink/70">Número</span>
                  <input
                    value={address.number}
                    onChange={(e) => setAddr('number', e.target.value)}
                    className={`mt-1 font-mono ${inputClass}`}
                  />
                </label>
              </div>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <label className="block text-sm">
                  <span className="text-ink/70">Complemento (opcional)</span>
                  <input
                    value={address.complement}
                    onChange={(e) => setAddr('complement', e.target.value)}
                    placeholder="Apto, bloco, referência…"
                    className={`mt-1 ${inputClass}`}
                  />
                </label>
                <label className="block text-sm">
                  <span className="text-ink/70">Bairro</span>
                  <input
                    value={address.neighborhood}
                    onChange={(e) => setAddr('neighborhood', e.target.value)}
                    className={`mt-1 ${inputClass}`}
                  />
                </label>
              </div>
              <div className="mt-4 grid gap-4 sm:grid-cols-[1fr_100px]">
                <label className="block text-sm">
                  <span className="text-ink/70">Cidade</span>
                  <input
                    value={address.city}
                    onChange={(e) => setAddr('city', e.target.value)}
                    className={`mt-1 ${inputClass}`}
                  />
                </label>
                <label className="block text-sm">
                  <span className="text-ink/70">UF</span>
                  <select
                    value={address.uf}
                    onChange={(e) => setAddr('uf', e.target.value)}
                    className={`mt-1 font-mono ${inputClass}`}
                  >
                    <option value="">—</option>
                    {UFS.map((uf) => (
                      <option key={uf} value={uf}>
                        {uf}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </section>
          )}

          {isPickup && (
            <section className="border border-slate-300 bg-slate-50 p-5 text-sm">
              <h2 className="font-serif text-lg font-semibold">Retirada na editora</h2>
              <p className="mt-2 text-ink/70">
                Rua Aprígio Veloso, 882 — Bairro Universitário, Campina Grande – PB.
                Seg. a sex., 8h às 17h. Apresente o protocolo do pedido.
              </p>
            </section>
          )}

          {/* Forma de pagamento */}
          <section className="border border-slate-300">
            <div className="flex border-b border-slate-300">
              {[
                ['cartao', 'Cartão de crédito'],
                ['pix', 'PIX'],
              ].map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setMethod(key)}
                  className={`px-6 py-3 text-sm font-semibold ${
                    method === key
                      ? 'border-b-2 border-wine bg-white text-wine'
                      : 'text-ink/60 hover:text-ink'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="p-5">
              {method === 'cartao' ? (
                <div className="max-w-md space-y-4">
                  <div className="flex flex-wrap gap-2 text-[11px] uppercase tracking-wider text-ink/50">
                    {CARD_BRANDS.map((b) => (
                      <span
                        key={b}
                        className={`border px-1.5 py-0.5 ${
                          brand === b
                            ? 'border-wine font-semibold text-wine'
                            : 'border-slate-300'
                        }`}
                      >
                        {b}
                      </span>
                    ))}
                  </div>
                  <label className="block text-sm">
                    <span className="text-ink/70">Número do cartão</span>
                    <input
                      value={cardNumber}
                      onChange={(e) => setCardNumber(maskCardNumber(e.target.value))}
                      placeholder="0000 0000 0000 0000"
                      inputMode="numeric"
                      className={`mt-1 font-mono ${inputClass}`}
                    />
                  </label>
                  <label className="block text-sm">
                    <span className="text-ink/70">Nome impresso no cartão</span>
                    <input
                      value={cardName}
                      onChange={(e) => setCardName(e.target.value.toUpperCase())}
                      className={`mt-1 font-mono ${inputClass}`}
                    />
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <label className="block text-sm">
                      <span className="text-ink/70">Validade</span>
                      <input
                        value={expiry}
                        onChange={(e) => setExpiry(maskExpiry(e.target.value))}
                        placeholder="MM/AA"
                        inputMode="numeric"
                        className={`mt-1 font-mono ${inputClass}`}
                      />
                    </label>
                    <label className="block text-sm">
                      <span className="text-ink/70">CVV</span>
                      <input
                        value={cvv}
                        onChange={(e) => setCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                        placeholder="123"
                        inputMode="numeric"
                        className={`mt-1 font-mono ${inputClass}`}
                      />
                    </label>
                  </div>
                </div>
              ) : (
                <div className="max-w-md text-sm text-ink/80">
                  <p>
                    Ao confirmar o pedido, geramos a cobrança PIX
                    {mpConfigured ? ' no Mercado Pago' : ''} e exibimos o QR Code
                    com a chave copia-e-cola na tela de confirmação.
                  </p>
                  <p className="mt-2 text-xs text-ink/50">
                    O pedido ficará <strong>pendente</strong> até a compensação do
                    pagamento, que pode ser confirmada pela gerência no painel.
                  </p>
                </div>
              )}
            </div>
          </section>

          {errors.length > 0 && (
            <ul className="border border-wine bg-wine/5 p-4 text-sm text-wine">
              {errors.map((err) => (
                <li key={err}>• {err}</li>
              ))}
            </ul>
          )}
        </div>

        {/* Resumo */}
        <aside className="h-fit border border-slate-300 p-5">
          <h2 className="font-serif text-lg font-semibold">Resumo</h2>
          <ul className="mt-4 space-y-2 border-b border-slate-200 pb-4 text-sm">
            {items.map((i) => (
              <li key={i.id} className="flex justify-between gap-2">
                <span className="text-ink/80">
                  {i.quantity}x {i.title}
                </span>
                <span className="shrink-0 font-mono">{formatBRL(i.price * i.quantity)}</span>
              </li>
            ))}
          </ul>
          <dl className="mt-4 space-y-2 text-sm">
            {taxes.icms !== null && taxes.icms > 0 && (
              <div className="flex justify-between">
                <dt className="text-ink/70">
                  ICMS ({taxes.uf} · {(taxes.icmsRate * 100).toLocaleString('pt-BR')}%)
                </dt>
                <dd className="font-mono">{formatBRL(taxes.icms)}</dd>
              </div>
            )}
            {taxes.iss > 0 && (
              <div className="flex justify-between">
                <dt className="text-ink/70">ISS (e-books)</dt>
                <dd className="font-mono">{formatBRL(taxes.iss)}</dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt className="text-ink/70">Frete — {shipping.label}</dt>
              <dd className="font-mono">
                {shipping.price === 0 ? 'Grátis' : formatBRL(shipping.price)}
              </dd>
            </div>
            <div className="flex justify-between border-t border-slate-300 pt-3 text-base font-semibold">
              <dt>Total</dt>
              <dd className="font-mono">{formatBRL(total)}</dd>
            </div>
          </dl>
          <button
            type="submit"
            disabled={processing}
            className="mt-5 w-full border border-wine bg-wine py-2.5 text-sm font-semibold text-white hover:bg-wine-dark disabled:opacity-60"
          >
            {processing
              ? 'Processando…'
              : method === 'pix'
                ? 'Gerar cobrança PIX'
                : 'Confirmar pagamento'}
          </button>
          {!emailJsConfigured && (
            <p className="mt-3 text-xs text-ink/40">
              EmailJS não configurado no .env — os e-mails serão apenas
              registrados na Caixa de Saída do admin.
            </p>
          )}
        </aside>
      </form>
    </main>
  )
}
