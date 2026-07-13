// Resolução de CEP: consulta a API pública ViaCEP e, se ela estiver fora do
// ar, cai para a tabela de faixas de CEP por UF (suficiente para o imposto).

// Faixas oficiais dos Correios (prefixo de 5 dígitos)
const UF_RANGES = [
  ['SP', 1000, 19999],
  ['RJ', 20000, 28999],
  ['ES', 29000, 29999],
  ['MG', 30000, 39999],
  ['BA', 40000, 48999],
  ['SE', 49000, 49999],
  ['PE', 50000, 56999],
  ['AL', 57000, 57999],
  ['PB', 58000, 58999],
  ['RN', 59000, 59999],
  ['CE', 60000, 63999],
  ['PI', 64000, 64999],
  ['MA', 65000, 65999],
  ['PA', 66000, 68899],
  ['AP', 68900, 68999],
  ['AM', 69000, 69299],
  ['RR', 69300, 69399],
  ['AM', 69400, 69899],
  ['AC', 69900, 69999],
  ['DF', 70000, 72799],
  ['GO', 72800, 72999],
  ['DF', 73000, 73699],
  ['GO', 73700, 76799],
  ['RO', 76800, 76999],
  ['TO', 77000, 77999],
  ['MT', 78000, 78899],
  ['MS', 79000, 79999],
  ['PR', 80000, 87999],
  ['SC', 88000, 89999],
  ['RS', 90000, 99999],
]

export function ufFromCEP(cep) {
  const prefix = parseInt(cep.replace(/\D/g, '').slice(0, 5), 10)
  const match = UF_RANGES.find(([, min, max]) => prefix >= min && prefix <= max)
  return match ? match[0] : null
}

/**
 * Busca o endereço de um CEP no ViaCEP.
 * Retorna { cep, uf, city, street, neighborhood, source } — com source
 * 'viacep' (dados completos) ou 'faixa' (apenas a UF, via tabela local).
 */
export async function lookupCEP(cep) {
  const digits = cep.replace(/\D/g, '')
  if (digits.length !== 8) {
    throw new Error('CEP inválido. Informe 8 dígitos.')
  }

  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 5000)
    const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`, {
      signal: controller.signal,
    })
    clearTimeout(timer)
    if (!res.ok) throw new Error('ViaCEP indisponível')
    const data = await res.json()
    if (data.erro) throw new Error('CEP não encontrado na base dos Correios.')
    return {
      cep: digits,
      uf: data.uf,
      city: data.localidade,
      street: data.logradouro || '',
      neighborhood: data.bairro || '',
      source: 'viacep',
    }
  } catch (err) {
    // CEP inexistente é erro de verdade; indisponibilidade cai no fallback
    if (err.message.includes('não encontrado')) throw err
    const uf = ufFromCEP(digits)
    if (!uf) throw new Error('CEP inválido.')
    return { cep: digits, uf, city: '', street: '', neighborhood: '', source: 'faixa' }
  }
}
