/**
 * Regras de validação dos formulários. Cada função devolve a mensagem de erro
 * (em linguagem simples, dizendo como corrigir) ou '' quando está tudo certo.
 * O back-end Java deve repetir as mesmas regras com Bean Validation (@NotBlank, @Email, @Size, @FutureOrPresent).
 */

export type Erros = Record<string, string>

export const soDigitos = (s: string) => s.replace(/\D/g, '')

/** Formata enquanto a pessoa digita: (11) 98888-1234 ou (11) 3333-4444 */
export function mascaraTelefone(valor: string) {
  const d = soDigitos(valor).slice(0, 11)
  if (d.length === 0) return ''
  if (d.length <= 2) return `(${d}`
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
}

export function erroObrigatorio(valor: string | undefined, rotulo: string) {
  return valor && valor.trim() ? '' : `Preencha ${rotulo}.`
}

export function erroNome(nome: string) {
  const n = nome.trim()
  if (!n) return 'Preencha seu nome completo.'
  if (n.split(/\s+/).length < 2) return 'Escreva nome e sobrenome.'
  if (/\d/.test(n)) return 'O nome não pode ter números.'
  return ''
}

export function erroEmail(email: string) {
  const e = email.trim()
  if (!e) return 'Preencha seu e-mail.'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e)) return 'E-mail inválido. Exemplo: maria@email.com'
  return ''
}

export function erroSenha(senha: string) {
  if (!senha) return 'Crie uma senha.'
  if (senha.length < 8) return 'A senha precisa ter pelo menos 8 caracteres.'
  if (!/[A-Za-zÀ-ÿ]/.test(senha) || !/\d/.test(senha)) return 'Use letras e números na senha.'
  return ''
}

export function forcaSenha(senha: string): { nivel: 0 | 1 | 2 | 3; rotulo: string } {
  if (!senha) return { nivel: 0, rotulo: '' }
  let p = 0
  if (senha.length >= 8) p++
  if (/[A-Za-z]/.test(senha) && /\d/.test(senha)) p++
  if (senha.length >= 12 || /[^A-Za-z0-9]/.test(senha)) p++
  return [
    { nivel: 1, rotulo: 'Fraca' },
    { nivel: 1, rotulo: 'Fraca' },
    { nivel: 2, rotulo: 'Boa' },
    { nivel: 3, rotulo: 'Forte' },
  ][p] as { nivel: 1 | 2 | 3; rotulo: string }
}

export function erroTelefone(valor: string | undefined, obrigatorio: boolean, rotulo = 'o telefone') {
  const d = soDigitos(valor || '')
  if (!d) return obrigatorio ? `Preencha ${rotulo}.` : ''
  if (d.length < 10) return 'Telefone incompleto. Use DDD + número, ex.: (11) 98888-1234.'
  if (Number(d.slice(0, 2)) < 11) return 'DDD inválido.'
  if (d.length === 11 && d[2] !== '9') return 'Celular com 11 dígitos começa com 9 depois do DDD.'
  return ''
}

const hoje = () => {
  const d = new Date()
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10)
}

export function erroNascimento(data?: string) {
  if (!data) return ''
  if (data > hoje()) return 'A data de nascimento não pode estar no futuro.'
  if (Number(data.slice(0, 4)) < new Date().getFullYear() - 120) return 'Confira o ano de nascimento.'
  return ''
}

/** Consulta agendada não pode ficar no passado. Consultas já realizadas/canceladas podem. */
export function erroDataConsulta(data: string, horario: string, status: string) {
  if (!data) return 'Escolha a data.'
  if (status !== 'AGENDADA') return ''
  const h = hoje()
  if (data < h) return 'Consulta agendada não pode ter data no passado. Se ela já aconteceu, mude a situação para "Realizada".'
  if (data === h && horario && horario < new Date().toTimeString().slice(0, 5))
    return 'Esse horário de hoje já passou. Confira a hora ou mude a situação para "Realizada".'
  if (Number(data.slice(0, 4)) > new Date().getFullYear() + 2) return 'Confira o ano: a data está muito distante.'
  return ''
}

export const temErros = (e: Erros) => Object.values(e).some(Boolean)

/** Leva o foco ao primeiro campo com erro (ordem do formulário), para teclado e leitor de tela. */
export function focarPrimeiroErro(form: HTMLFormElement | null) {
  setTimeout(() => {
    const el = form?.querySelector<HTMLElement>('[aria-invalid="true"]')
    el?.focus()
    el?.scrollIntoView({ block: 'center', behavior: 'smooth' })
  }, 0)
}

/** Formata enquanto a pessoa digita: 123.456.789-09 */
export function mascaraCpf(valor: string) {
  const d = soDigitos(valor).slice(0, 11)
  if (d.length <= 3) return d
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`
  if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`
}

/** Valida CPF pelos dígitos verificadores. */
export function cpfValido(cpf: string) {
  const d = soDigitos(cpf)
  if (d.length !== 11 || /^(\d)\1{10}$/.test(d)) return false
  const dv = (n: number) => {
    let s = 0
    for (let i = 0; i < n; i++) s += Number(d[i]) * (n + 1 - i)
    return ((s * 10) % 11) % 10
  }
  return dv(9) === Number(d[9]) && dv(10) === Number(d[10])
}

export function erroCpf(cpf: string) {
  const d = soDigitos(cpf)
  if (!d) return 'Preencha o CPF.'
  if (d.length < 11) return 'CPF incompleto: são 11 números.'
  if (!cpfValido(d)) return 'CPF inválido. Confira os números.'
  return ''
}

/** Senha de acesso do paciente: 8 números (ex.: 4821-7395). */
export function mascaraSenhaAcesso(valor: string) {
  const d = soDigitos(valor).slice(0, 8)
  return d.length > 4 ? `${d.slice(0, 4)}-${d.slice(4)}` : d
}

export function erroNascimentoObrigatorio(data?: string) {
  if (!data) return 'Preencha a data de nascimento.'
  return erroNascimento(data)
}

export const CONSELHOS = ['CRM', 'COREN', 'CRF', 'CREFITO', 'CRP', 'CRN', 'CRO', 'CRFa'] as const
export const UFS = ['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'] as const

export function erroNumeroConselho(n: string) {
  const d = soDigitos(n)
  if (!d) return 'Preencha o número do registro.'
  if (d.length < 4 || d.length > 7) return 'O número do registro tem de 4 a 7 dígitos.'
  return ''
}
