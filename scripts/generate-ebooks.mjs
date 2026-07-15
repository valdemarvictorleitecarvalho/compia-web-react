// Gera PDFs mínimos válidos (1 página) para simular os e-books entregues.
// Uso: node scripts/generate-ebooks.mjs
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'downloads')
mkdirSync(DIR, { recursive: true })

const titles = {
  'aprendizado-de-maquina-na-pratica.pdf': 'Aprendizado de Maquina na Pratica',
  'contratos-inteligentes-com-solidity.pdf': 'Contratos Inteligentes com Solidity',
  'engenharia-reversa-de-malware.pdf': 'Engenharia Reversa de Malware',
  'processamento-de-linguagem-natural.pdf': 'Processamento de Linguagem Natural',
}

function minimalPdf(title) {
  const text = String.raw`BT /F1 18 Tf 72 720 Td (${title}) Tj 0 -28 Td /F1 11 Tf (Editora COMPIA - amostra do e-book \(demonstracao\)) Tj ET`
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>',
    `<< /Length ${text.length} >>\nstream\n${text}\nendstream`,
    '<< /Type /Font /Subtype /Type1 /BaseFont /Times-Roman >>',
  ]
  let pdf = '%PDF-1.4\n'
  const offsets = []
  objects.forEach((obj, i) => {
    offsets.push(pdf.length)
    pdf += `${i + 1} 0 obj\n${obj}\nendobj\n`
  })
  const xref = pdf.length
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`
  for (const off of offsets) pdf += `${String(off).padStart(10, '0')} 00000 n \n`
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`
  return pdf
}

for (const [file, title] of Object.entries(titles)) {
  writeFileSync(join(DIR, file), minimalPdf(title), 'latin1')
  console.log('downloads/', file)
}
