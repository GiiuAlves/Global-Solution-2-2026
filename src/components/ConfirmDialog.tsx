import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { AlertTriangle, HelpCircle } from 'lucide-react'
import { Button } from './ui'

interface Opcoes {
  titulo: string
  mensagem: string
  confirmar?: string
  cancelar?: string
  perigo?: boolean // ação destrutiva: botão vermelho e foco inicial em "Cancelar"
}

type Confirmar = (o: Opcoes) => Promise<boolean>
const Ctx = createContext<Confirmar | null>(null)

/**
 * Janela de confirmação acessível (substitui o confirm() do navegador):
 * role="alertdialog", foco preso dentro da janela, Esc cancela e o foco volta para o botão de origem.
 */
export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [opcoes, setOpcoes] = useState<Opcoes | null>(null)
  const resolver = useRef<(v: boolean) => void>(() => {})
  const origem = useRef<HTMLElement | null>(null)
  const caixa = useRef<HTMLDivElement>(null)

  const confirmar = useCallback<Confirmar>((o) => {
    origem.current = document.activeElement as HTMLElement | null
    setOpcoes(o)
    return new Promise<boolean>((r) => (resolver.current = r))
  }, [])

  const fechar = useCallback((v: boolean) => {
    setOpcoes(null)
    resolver.current(v)
    setTimeout(() => origem.current?.focus?.(), 0)
  }, [])

  useEffect(() => {
    if (!opcoes) return
    const botoes = caixa.current?.querySelectorAll<HTMLButtonElement>('button')
    // Ação perigosa: foco em Cancelar; senão, em Confirmar
    ;(opcoes.perigo ? botoes?.[0] : botoes?.[1])?.focus()
    const html = document.documentElement
    const antes = html.style.overflow
    html.style.overflow = 'hidden'

    const tecla = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        fechar(false)
      }
      if (e.key === 'Tab' && botoes?.length) {
        const primeiro = botoes[0]
        const ultimo = botoes[botoes.length - 1]
        if (e.shiftKey && document.activeElement === primeiro) {
          e.preventDefault()
          ultimo.focus()
        } else if (!e.shiftKey && document.activeElement === ultimo) {
          e.preventDefault()
          primeiro.focus()
        }
      }
    }
    document.addEventListener('keydown', tecla)
    return () => {
      document.removeEventListener('keydown', tecla)
      html.style.overflow = antes
    }
  }, [opcoes, fechar])

  return (
    <Ctx.Provider value={confirmar}>
      {children}
      {opcoes && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-[#0b2238]/60 p-4" onMouseDown={(e) => e.target === e.currentTarget && fechar(false)}>
          <div
            ref={caixa}
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="dlg-titulo"
            aria-describedby="dlg-msg"
            className="card w-full max-w-md rounded-3xl border border-line bg-card p-6 shadow-2xl"
          >
            <span
              className={`grid h-14 w-14 place-items-center rounded-2xl ${opcoes.perigo ? 'bg-danger/10 text-danger' : 'bg-soft text-brand'}`}
              aria-hidden
            >
              {opcoes.perigo ? <AlertTriangle size={28} /> : <HelpCircle size={28} />}
            </span>
            <h2 id="dlg-titulo" className="mt-4 text-2xl font-extrabold text-ink">{opcoes.titulo}</h2>
            <p id="dlg-msg" className="mt-2 text-lg text-muted">{opcoes.mensagem}</p>
            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <Button variant="secondary" onClick={() => fechar(false)}>{opcoes.cancelar ?? 'Cancelar'}</Button>
              <Button
                className={opcoes.perigo ? '!bg-danger hover:!bg-danger/90 !text-white' : ''}
                onClick={() => fechar(true)}
              >
                {opcoes.confirmar ?? 'Confirmar'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </Ctx.Provider>
  )
}

export function useConfirm() {
  const c = useContext(Ctx)
  if (!c) throw new Error('useConfirm precisa estar dentro de ConfirmProvider')
  return c
}
