import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { ShieldCheck, RotateCcw } from 'lucide-react'
import { api, MODO_DEMO } from '../services/api'
import type { Usuario } from '../types'
import { Aviso, Button, Card, Carregando, Field, PageHeader, inputClass } from '../components/ui'
import { A11yToolbar } from '../components/A11yToolbar'

const TIPOS = ['', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']

export default function Perfil() {
  const [u, setU] = useState<Usuario>()
  const [aviso, setAviso] = useState({ texto: '', tom: 'ok' as 'ok' | 'erro' })

  useEffect(() => { api.getUsuario().then(setU).catch((e: Error) => setAviso({ texto: e.message, tom: 'erro' })) }, [])
  if (!u) return <><Aviso {...aviso} /><Carregando /></>

  const set = <K extends keyof Usuario>(k: K, v: Usuario[K]) => setU({ ...u, [k]: v })

  async function salvar(e: FormEvent) {
    e.preventDefault()
    try {
      setU(await api.atualizarUsuario(u!))
      setAviso({ texto: 'Perfil salvo com sucesso.', tom: 'ok' })
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (err) {
      setAviso({ texto: (err as Error).message, tom: 'erro' })
    }
  }

  return (
    <>
      <PageHeader titulo="Meu perfil" descricao="Seus dados básicos e o que aparece na carteirinha." />
      <Aviso texto={aviso.texto} tom={aviso.tom} />

      <form onSubmit={salvar} className="flex flex-col gap-6">
        <Card className="p-6">
          <h2 className="mb-5 text-xl font-extrabold text-ink">Dados pessoais</h2>
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Field id="p-nome" label="Nome completo" obrigatorio>
                <input id="p-nome" required autoComplete="name" className={inputClass} value={u.nome} onChange={(e) => set('nome', e.target.value)} />
              </Field>
            </div>
            <Field id="p-nasc" label="Data de nascimento">
              <input id="p-nasc" type="date" autoComplete="bday" className={inputClass} value={u.dataNascimento ?? ''} onChange={(e) => set('dataNascimento', e.target.value)} />
            </Field>
            <Field id="p-tel" label="Telefone">
              <input id="p-tel" type="tel" autoComplete="tel" className={inputClass} value={u.telefone ?? ''} onChange={(e) => set('telefone', e.target.value)} placeholder="(11) 99999-0000" />
            </Field>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="mb-5 text-xl font-extrabold text-ink">Contato de emergência</h2>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field id="p-cnome" label="Nome e parentesco" obrigatorio>
              <input id="p-cnome" required className={inputClass} value={u.contatoEmergenciaNome} onChange={(e) => set('contatoEmergenciaNome', e.target.value)} placeholder="Ex.: Ana Silva (filha)" />
            </Field>
            <Field id="p-ctel" label="Telefone" obrigatorio>
              <input id="p-ctel" type="tel" required className={inputClass} value={u.contatoEmergenciaTelefone} onChange={(e) => set('contatoEmergenciaTelefone', e.target.value)} />
            </Field>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-xl font-extrabold text-ink">Informações essenciais de saúde</h2>
          <p className="mb-5 mt-1 flex items-start gap-2 text-muted">
            <ShieldCheck size={20} className="mt-0.5 shrink-0 text-brand" aria-hidden />
            Todos opcionais. Você escolhe na <Link to="/carteirinha" className="font-bold text-brand underline">carteirinha</Link> quais deles podem ser vistos pelo QR Code.
          </p>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field id="p-sangue" label="Tipo sanguíneo">
              <select id="p-sangue" className={inputClass} value={u.tipoSanguineo ?? ''} onChange={(e) => set('tipoSanguineo', e.target.value)}>
                {TIPOS.map((t) => <option key={t} value={t}>{t || 'Não informar'}</option>)}
              </select>
            </Field>
            <Field id="p-alergias" label="Alergias" dica="Ex.: Dipirona, frutos do mar.">
              <input id="p-alergias" aria-describedby="p-alergias-dica" className={inputClass} value={u.alergias ?? ''} onChange={(e) => set('alergias', e.target.value)} />
            </Field>
            <Field id="p-cond" label="Condições de saúde" dica="Somente o que for importante numa emergência.">
              <input id="p-cond" aria-describedby="p-cond-dica" className={inputClass} value={u.condicoes ?? ''} onChange={(e) => set('condicoes', e.target.value)} />
            </Field>
            <Field id="p-acess" label="Necessidades de acessibilidade" dica="Ex.: sou surdo e uso Libras; tenho baixa visão.">
              <input id="p-acess" aria-describedby="p-acess-dica" className={inputClass} value={u.necessidadesAcessibilidade ?? ''} onChange={(e) => set('necessidadesAcessibilidade', e.target.value)} />
            </Field>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-xl font-extrabold text-ink">Preferências de acessibilidade</h2>
          <p className="mb-4 mt-1 text-muted">Ajuste o tamanho da letra e o contraste. Fica salvo neste aparelho.</p>
          <A11yToolbar />
        </Card>

        <div className="flex flex-wrap gap-3">
          <Button type="submit" className="!min-h-14 !px-8 text-lg">Salvar perfil</Button>
          {MODO_DEMO && (
            <Button
              variant="secondary"
              className="!min-h-14"
              onClick={() => {
                if (!window.confirm('Voltar todos os dados para o exemplo inicial?')) return
                api.restaurarDemo()
                window.location.reload()
              }}
            >
              <RotateCcw size={18} aria-hidden /> Restaurar dados de exemplo
            </Button>
          )}
        </div>
      </form>
    </>
  )
}
