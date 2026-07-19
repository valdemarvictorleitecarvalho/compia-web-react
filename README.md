# COMPIA — Editora de Computação e IA

Loja virtual de uma editora universitária especializada em **Inteligência
Artificial, Blockchain, Cibersegurança e Criptografia**, com catálogo de livros
físicos, e-books e kits.

Projeto da disciplina **Web 1 (UFCG)**. A aplicação é
**100% frontend** (sem backend): toda a "base de dados" (pedidos, produtos
editados, e-mails, logs) vive na **Context API sincronizada com o
localStorage**. Por isso, para ver uma compra refletida no painel admin, use o
**mesmo navegador** onde a compra foi feita.

## Stack e integrações

- React 19 + Vite (SPA com React Router DOM) · Tailwind CSS v4
- **ViaCEP** — resolução de endereço e UF pelo CEP (com fallback local por faixa de CEP)
- **SuperFrete** — cotação real de PAC/SEDEX (com fallback para tabela local)
- **Mercado Pago** — Checkout Transparente completo: tokenização de cartão,
  criação de pagamento e PIX dinâmico (com fallback simulado)
- **EmailJS** — envio real de e-mails direto do frontend
- Deploy: Vercel (`vercel.json` já configura o rewrite da SPA)

Todas as integrações degradam graciosamente: sem credenciais no `.env` ou com a
API fora do ar, o sistema cai no modo simulado e o fluxo de compra nunca quebra.

## Rodando localmente

```bash
npm install
npm run dev
```

Copie `.env.example` para `.env` e preencha o que quiser ativar de verdade:

| Variável | Ativa |
| --- | --- |
| `VITE_EMAILJS_SERVICE_ID` / `_TEMPLATE_ID` / `_PUBLIC_KEY` | Envio real de e-mails (template com campos `to_email`, `subject`, `message`) |
| `VITE_MP_PUBLIC_KEY` + `VITE_MP_ACCESS_TOKEN` | Cobrança real no Mercado Pago (cartão e PIX com QR dinâmico) |
| `VITE_SUPERFRETE_TOKEN` | Cotação real de frete na SuperFrete |

> **Aviso assumido pelo projeto:** o `ACCESS_TOKEN` do Mercado Pago fica exposto
> no bundle do frontend. Isso é inaceitável em produção — foi uma decisão
> consciente para viabilizar a integração completa sem backend.

## Contas de demonstração (tela de login)

| Perfil | E-mail | Senha |
| --- | --- | --- |
| Cliente | `mariana.duarte@exemplo.com.br` | `cliente123` |
| Editor | `otavio.lins@compia.com.br` | `editor123` |
| Gerente | `regina.bastos@compia.com.br` | `gerente123` |

As credenciais também aparecem na própria página `/login`, com botão "usar".

## Roteiro de demonstração (banca)

1. Entre como **Cliente** em `/login`.
2. Navegue pelo catálogo (filtre por formato/tema) e adicione ao carrinho um
   físico e um e-book, para ver ICMS **e** ISS.
3. No carrinho, digite um CEP real: o ViaCEP identifica cidade/UF, a SuperFrete
   cota PAC/SEDEX (ou a tabela local, sem token) e o **ICMS é calculado com a
   alíquota do estado de destino** (ex.: SP 18%, RJ 22%, PB 20%).
4. No checkout, o endereço vem pré-preenchido pelo CEP — complete o **número**.
   Pague com **cartão** (com credenciais MP de teste, use cartões de teste do
   Mercado Pago; sem credenciais, qualquer número válido no Luhn, ex.:
   `4111 1111 1111 1111`) ou **PIX** (QR gerado ao confirmar; fica "Pendente").
5. Saia e entre como **Gerente**; abra o **Painel**:
   - **Pedidos**: o pedido aparece com endereço completo; mude Pendente → Pago
     (dispara o e-mail de confirmação).
   - **Produtos**: CRUD completo com filtro por tag.
   - **Mensageria**: caixa de saída com todos os e-mails e seu conteúdo.
   - **Logs**: trilha de auditoria.
6. Volte como **Cliente** e abra **Minha conta**: histórico com status e links
   de download dos e-books.

O perfil **Editor** acessa o painel mas enxerga apenas a aba de Produtos.

## Impostos simulados

- **ICMS**: alíquota interna de referência de cada uma das 27 UFs (tabela em
  `src/lib/taxes.js`), aplicada sobre físicos/kits conforme o estado de destino
  identificado pelo CEP.
- **ISS**: 5% sobre e-books (bens digitais).

## Estrutura

```
src/
├── components/        Header, Footer etc.
├── contexts/          AuthContext (login), CartContext, StoreContext (localStorage)
├── data/products.json Seed do catálogo
├── lib/               cep (ViaCEP), taxes (ICMS/UF), shipping (SuperFrete),
│                      payment (Mercado Pago), email (EmailJS), format, storage
└── pages/
    ├── Home.jsx, ProductDetail.jsx, Login.jsx
    ├── Cart.jsx, Checkout.jsx, OrderConfirmed.jsx
    ├── MyAccount.jsx
    └── admin/         Admin.jsx + abas (Produtos, Pedidos, Mensageria, Logs)
```