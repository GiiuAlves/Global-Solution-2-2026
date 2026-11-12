import { ShieldCheck } from 'lucide-react'
import { NECESSIDADES, PARENTESCOS, type DadosPaciente } from '../types'
import { Field, aria, campoClass } from './ui'
import {
  erroCpf, erroNascimentoObrigatorio, erroNome, erroObrigatorio, erroTelefone,
  mascaraCpf, mascaraTelefone, type Erros,
} from '../services/validacao'

export type FormPacienteDados = DadosPaciente & { consentimentoLgpd: boolean }

export const PACIENTE_VAZIO: FormPacienteDados = {
  nome: '', cpf: '', dataNascimento: '', telefone: '',
  contatoEmergenciaNome: '', contatoEmergenciaParentesco: '', contatoEmergenciaTelefone: '',
  tipoSanguineo: '', alergias: '', condicoes: '',
  necessidadesAcessibilidade: [], observacoesAcessibilidade: '',
  consentimentoLgpd: false,
}

export const TIPOS_SANGUINEOS = ['', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']

export const ETAPAS_PACIENTE = ['Identificação', 'Emergência e saúde', 'Acessibilidade'] as const

/** Validação por etapa (0, 1, 2) ou de tudo de uma vez (edição da ficha). */
export function validarPaciente(f: FormPacienteDados, etapa: 0 | 1 | 2 | 'tudo'): Erros {
  const e: Erros = {}
  if (etapa === 0 || etapa === 'tudo') {
    e.nome = erroNome(f.nome)
    e.cpf = erroCpf(f.cpf)
    e.dataNascimento = erroNascimentoObrigatorio(f.dataNascimento)
    e.telefone = erroTelefone(f.telefone, false)
  }
  if (etapa === 1 || etapa === 'tudo') {
    e.contatoEmergenciaNome = erroObrigatorio(f.contatoEmergenciaNome, 'o nome do contato')
    e.contatoEmergenciaParentesco = f.contatoEmergenciaParentesco ? '' : 'Escolha o parentesco.'
    e.contatoEmergenciaTelefone = erroTelefone(f.contatoEmergenciaTelefone, true, 'o telefone do contato')
  }
  if (etapa === 2) e.consentimentoLgpd = f.consentimentoLgpd ? '' : 'Confirme a autorização para concluir o cadastro.'
  return e
}

/** Limpa espaços e campos vazios antes de enviar ao back-end. */
export function normalizarPaciente(f: FormPacienteDados): DadosPaciente {
  const { consentimentoLgpd: _c, ...d } = f
  return {
    ...d,
    nome: d.nome.trim().replace(/\s+/g, ' '),
    contatoEmergenciaNome: d.contatoEmergenciaNome.trim(),
    telefone: d.telefone || undefined,
    tipoSanguineo: d.tipoSanguineo || undefined,
    alergias: d.alergias?.trim() || undefined,
    condicoes: d.condicoes?.trim() || undefined,
    observacoesAcessibilidade: d.observacoesAcessibilidade?.trim() || undefined,
  }
}

interface Props {
  f: FormPacienteDados
  set: <K extends keyof FormPacienteDados>(k: K, v: FormPacienteDados[K]) => void
  erros: Erros
}

export function SecaoIdentificacao({ f, set, erros }: Props) {
  return (
    <div className="grid gap-5 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <Field id="p-nome" label="Nome completo do paciente" obrigatorio erro={erros.nome}>
          <input {...aria('p-nome', erros.nome)} autoComplete="off" className={campoClass(erros.nome)} value={f.nome} onChange={(e) => set('nome', e.target.value)} />
        </Field>
      </div>
      <Field id="p-cpf" label="CPF" obrigatorio erro={erros.cpf} dica="O paciente vai usar o CPF para entrar.">
        <input {...aria('p-cpf', erros.cpf, true)} inputMode="numeric" autoComplete="off" className={campoClass(erros.cpf)} value={f.cpf} onChange={(e) => set('cpf', mascaraCpf(e.target.value))} placeholder="000.000.000-00" />
      </Field>
      <Field id="p-nasc" label="Data de nascimento" obrigatorio erro={erros.dataNascimento}>
        <input {...aria('p-nasc', erros.dataNascimento)} type="date" className={campoClass(erros.dataNascimento)} value={f.dataNascimento} onChange={(e) => set('dataNascimento', e.target.value)} />
      </Field>
      <Field id="p-tel" label="Telefone do paciente" erro={erros.telefone}>
        <input {...aria('p-tel', erros.telefone)} type="tel" inputMode="tel" className={campoClass(erros.telefone)} value={f.telefone ?? ''} onChange={(e) => set('telefone', mascaraTelefone(e.target.value))} placeholder="(11) 99999-0000" />
      </Field>
    </div>
  )
}

export function SecaoEmergencia({ f, set, erros }: Props) {
  return (
    <fieldset className="flex flex-col gap-5">
      <legend className="mb-1 text-lg font-extrabold text-ink">Quem chamar numa emergência</legend>
      <div className="grid gap-5 sm:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <Field id="p-cnome" label="Nome do contato" obrigatorio erro={erros.contatoEmergenciaNome}>
          <input {...aria('p-cnome', erros.contatoEmergenciaNome)} className={campoClass(erros.contatoEmergenciaNome)} value={f.contatoEmergenciaNome} onChange={(e) => set('contatoEmergenciaNome', e.target.value)} placeholder="Ex.: Ana Silva" />
        </Field>
        <Field id="p-cparentesco" label="Parentesco" obrigatorio erro={erros.contatoEmergenciaParentesco}>
          <select {...aria('p-cparentesco', erros.contatoEmergenciaParentesco)} className={campoClass(erros.contatoEmergenciaParentesco)} value={f.contatoEmergenciaParentesco} onChange={(e) => set('contatoEmergenciaParentesco', e.target.value)}>
            <option value="">Escolha…</option>
            {PARENTESCOS.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </Field>
      </div>
      <div className="sm:max-w-xs">
        <Field id="p-ctel" label="Telefone do contato" obrigatorio erro={erros.contatoEmergenciaTelefone}>
          <input {...aria('p-ctel', erros.contatoEmergenciaTelefone)} type="tel" inputMode="tel" className={campoClass(erros.contatoEmergenciaTelefone)} value={f.contatoEmergenciaTelefone} onChange={(e) => set('contatoEmergenciaTelefone', mascaraTelefone(e.target.value))} placeholder="(11) 99999-0000" />
        </Field>
      </div>
    </fieldset>
  )
}

export function SecaoSaude({ f, set }: Props) {
  return (
    <fieldset className="flex flex-col gap-5">
      <legend className="mb-1 text-lg font-extrabold text-ink">Informações essenciais de saúde</legend>
      <div className="grid gap-5 sm:grid-cols-[10rem_minmax(0,1fr)]">
        <Field id="p-sangue" label="Tipo sanguíneo">
          <select id="p-sangue" className={campoClass()} value={f.tipoSanguineo ?? ''} onChange={(e) => set('tipoSanguineo', e.target.value)}>
            {TIPOS_SANGUINEOS.map((t) => <option key={t} value={t}>{t || 'Não informado'}</option>)}
          </select>
        </Field>
        <Field id="p-alergias" label="Alergias" dica="Ex.: Dipirona, penicilina, frutos do mar. Deixe vazio se não houver.">
          <input {...aria('p-alergias', undefined, true)} maxLength={200} className={campoClass()} value={f.alergias ?? ''} onChange={(e) => set('alergias', e.target.value)} />
        </Field>
      </div>
      <Field id="p-cond" label="Condições de saúde relevantes" dica="Ex.: diabetes tipo 2, marca-passo, anticoagulado.">
        <input {...aria('p-cond', undefined, true)} maxLength={200} className={campoClass()} value={f.condicoes ?? ''} onChange={(e) => set('condicoes', e.target.value)} />
      </Field>
    </fieldset>
  )
}

export function SecaoAcessibilidade({ f, set }: Props) {
  return (
    <>
      <fieldset>
        <legend className="text-lg font-extrabold text-ink">Necessidades de acessibilidade</legend>
        <p className="mt-1 text-muted">Ajustam a forma de atender o paciente e aparecem para quem ler o QR Code.</p>
        <ul className="mt-3 grid gap-2 sm:grid-cols-2">
          {NECESSIDADES.map((n) => {
            const marcado = f.necessidadesAcessibilidade.includes(n)
            return (
              <li key={n}>
                <label className={`flex min-h-14 cursor-pointer items-center gap-3 rounded-xl border-2 px-4 font-bold text-ink ${marcado ? 'border-brand bg-soft' : 'border-line hover:border-brand/50'}`}>
                  <input type="checkbox" className="h-6 w-6 shrink-0 accent-[var(--color-brand)]" checked={marcado} onChange={() => set('necessidadesAcessibilidade', marcado ? f.necessidadesAcessibilidade.filter((x) => x !== n) : [...f.necessidadesAcessibilidade, n])} />
                  {n}
                </label>
              </li>
            )
          })}
        </ul>
      </fieldset>
      <Field id="p-obs-acess" label="Como se comunicar com o paciente" dica="Ex.: falar devagar e de frente; usa intérprete de Libras; descrever tudo em voz alta.">
        <input {...aria('p-obs-acess', undefined, true)} maxLength={200} className={campoClass()} value={f.observacoesAcessibilidade ?? ''} onChange={(e) => set('observacoesAcessibilidade', e.target.value)} />
      </Field>
    </>
  )
}

export function SecaoConsentimento({ f, set, erros }: Props) {
  return (
    <div className={`rounded-2xl border-2 bg-soft/50 p-5 ${erros.consentimentoLgpd ? 'border-danger' : 'border-brand/40'}`}>
      <p className="flex items-center gap-2 text-lg font-extrabold text-ink">
        <ShieldCheck size={22} className="text-brand" aria-hidden /> Autorização do paciente (LGPD)
      </p>
      <p className="mt-1 text-muted">Leia para o paciente ou responsável antes de concluir:</p>
      <ul className="mt-2 list-disc space-y-1 pl-6 text-ink">
        <li>Os dados são usados só para organizar o tratamento, as consultas e a carteirinha.</li>
        <li>Só profissionais vinculados podem alterar a ficha; toda alteração fica registrada.</li>
        <li>O QR Code mostra apenas o essencial para emergências e pode ser desligado.</li>
        <li>O paciente pode pedir a exclusão de todos os dados quando quiser.</li>
      </ul>
      <label className="mt-4 flex cursor-pointer items-start gap-3 font-bold text-ink">
        <input
          {...aria('p-consentimento', erros.consentimentoLgpd)}
          type="checkbox"
          className="mt-0.5 h-6 w-6 shrink-0 accent-[var(--color-brand)]"
          checked={f.consentimentoLgpd}
          onChange={(e) => set('consentimentoLgpd', e.target.checked)}
        />
        O paciente (ou o responsável legal) autorizou o tratamento dos dados de saúde para essas finalidades.
      </label>
      {erros.consentimentoLgpd && <p id="p-consentimento-erro" className="mt-2 text-sm font-bold text-danger">{erros.consentimentoLgpd}</p>}
    </div>
  )
}
