// Gera capas SVG tipográficas para o catálogo e um QR code fake para o mock do PIX.
// Uso: node scripts/generate-covers.mjs
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const COVERS = join(ROOT, 'public', 'covers')
mkdirSync(COVERS, { recursive: true })

const books = [
  { file: 'fundamentos-ia', title: ['Fundamentos de', 'Inteligência', 'Artificial'], author: 'H. M. Vasconcelos', bg: '#722f37', fg: '#f5efe6', variant: 0 },
  { file: 'ml-na-pratica', title: ['Aprendizado de', 'Máquina', 'na Prática'], author: 'P. R. Albuquerque', bg: '#1e3a34', fg: '#efe9dc', variant: 1 },
  { file: 'redes-neurais', title: ['Redes Neurais', 'Profundas'], author: 'C. Dantas · L. Farias', bg: '#2b2b2b', fg: '#e8e2d4', variant: 2 },
  { file: 'blockchain-consenso', title: ['Blockchain', 'Estruturas e', 'Consenso'], author: 'M. T. Sales', bg: '#31424e', fg: '#ece6da', variant: 0 },
  { file: 'contratos-solidity', title: ['Contratos', 'Inteligentes', 'com Solidity'], author: 'A. C. Beltrão', bg: '#5c4a2e', fg: '#f2ecdf', variant: 1 },
  { file: 'seguranca-ofensiva', title: ['Segurança', 'Ofensiva', 'Pentest'], author: 'R. F. Wanderley', bg: '#212832', fg: '#e6e0d2', variant: 2 },
  { file: 'criptografia-aplicada', title: ['Criptografia', 'Aplicada'], author: 'J. B. Montenegro', bg: '#4a2e35', fg: '#efe9dc', variant: 0 },
  { file: 'eng-reversa-malware', title: ['Engenharia', 'Reversa de', 'Malware'], author: 'T. S. Lucena', bg: '#37322a', fg: '#ece5d5', variant: 1 },
  { file: 'kit-seguranca', title: ['Kit', 'Segurança', 'Completa'], author: 'Coletânea COMPIA', bg: '#722f37', fg: '#f5efe6', variant: 3 },
  { file: 'kit-ia-do-zero', title: ['Kit', 'IA do Zero'], author: 'Coletânea COMPIA', bg: '#1e3a34', fg: '#f0eadd', variant: 3 },
  { file: 'pln', title: ['Processamento', 'de Linguagem', 'Natural'], author: 'D. A. Cavalcanti', bg: '#3c3550', fg: '#ece6da', variant: 2 },
  { file: 'criptomoedas', title: ['Criptomoedas', 'e o Sistema', 'Financeiro'], author: 'V. M. Sampaio', bg: '#2f3d33', fg: '#ece6da', variant: 0 },
]

function cover({ title, author, bg, fg, variant }) {
  const W = 400
  const H = 600
  const titleLines = title
    .map((line, i) => `<text x="48" y="${210 + i * 46}" font-size="36">${line}</text>`)
    .join('\n    ')

  const decorations = [
    // moldura dupla fina
    `<rect x="20" y="20" width="${W - 40}" height="${H - 40}" fill="none" stroke="${fg}" stroke-width="1.5" opacity="0.85"/>
     <rect x="28" y="28" width="${W - 56}" height="${H - 56}" fill="none" stroke="${fg}" stroke-width="0.5" opacity="0.5"/>`,
    // faixa horizontal
    `<rect x="0" y="120" width="${W}" height="4" fill="${fg}" opacity="0.85"/>
     <rect x="0" y="${H - 110}" width="${W}" height="2" fill="${fg}" opacity="0.5"/>`,
    // canto geométrico
    `<line x1="48" y1="130" x2="${W - 48}" y2="130" stroke="${fg}" stroke-width="2"/>
     <line x1="48" y1="${H - 120}" x2="${W - 48}" y2="${H - 120}" stroke="${fg}" stroke-width="1" opacity="0.6"/>`,
    // selo de kit
    `<rect x="20" y="20" width="${W - 40}" height="${H - 40}" fill="none" stroke="${fg}" stroke-width="2"/>
     <circle cx="${W - 84}" cy="84" r="36" fill="none" stroke="${fg}" stroke-width="1.5"/>
     <text x="${W - 84}" y="80" font-size="11" text-anchor="middle" fill="${fg}" font-family="Georgia, serif">EDIÇÃO</text>
     <text x="${W - 84}" y="96" font-size="11" text-anchor="middle" fill="${fg}" font-family="Georgia, serif">DUPLA</text>`,
  ][variant]

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect width="${W}" height="${H}" fill="${bg}"/>
  ${decorations}
  <g fill="${fg}" font-family="Georgia, 'Times New Roman', serif">
    ${titleLines}
    <text x="48" y="${H - 140}" font-size="17" font-style="italic">${author}</text>
    <text x="48" y="${H - 56}" font-size="13" letter-spacing="4">EDITORA COMPIA</text>
  </g>
</svg>
`
}

for (const b of books) {
  writeFileSync(join(COVERS, `${b.file}.svg`), cover(b))
  console.log('capas/', b.file + '.svg')
}

// ---- QR code estático (padrão pseudo-aleatório determinístico, apenas visual) ----
function fakeQr() {
  const N = 29
  const cell = 10
  const quiet = 4
  const size = (N + quiet * 2) * cell
  let seed = 42
  const rand = () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff
    return seed / 0x7fffffff
  }
  const inFinder = (r, c) =>
    (r < 8 && c < 8) || (r < 8 && c >= N - 8) || (r >= N - 8 && c < 8)

  let rects = ''
  for (let r = 0; r < N; r++) {
    for (let c = 0; c < N; c++) {
      if (!inFinder(r, c) && rand() < 0.47) {
        rects += `<rect x="${(c + quiet) * cell}" y="${(r + quiet) * cell}" width="${cell}" height="${cell}"/>`
      }
    }
  }
  const finder = (x, y) => `
    <rect x="${(x + quiet) * cell}" y="${(y + quiet) * cell}" width="${cell * 7}" height="${cell * 7}"/>
    <rect x="${(x + 1 + quiet) * cell}" y="${(y + 1 + quiet) * cell}" width="${cell * 5}" height="${cell * 5}" fill="#fff"/>
    <rect x="${(x + 2 + quiet) * cell}" y="${(y + 2 + quiet) * cell}" width="${cell * 3}" height="${cell * 3}" fill="#000"/>`

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" fill="#fff"/>
  <g fill="#000">${rects}${finder(0, 0)}${finder(N - 7, 0)}${finder(0, N - 7)}</g>
</svg>
`
}

writeFileSync(join(ROOT, 'public', 'qrcode.svg'), fakeQr())
console.log('public/qrcode.svg')
