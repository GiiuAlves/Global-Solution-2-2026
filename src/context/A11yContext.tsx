import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'

type Escala = 0 | 1 | 2

interface A11y {
  escala: Escala
  altoContraste: boolean
  aumentar: () => void
  diminuir: () => void
  alternarContraste: () => void
  falar: (texto: string) => void
  pararFala: () => void
  falando: boolean
  vozDisponivel: boolean
}

const Ctx = createContext<A11y | null>(null)
const KEY = 'saude-facil:a11y'
const TAMANHOS = ['100%', '112.5%', '125%']

function ler(): { escala: Escala; altoContraste: boolean } {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) || '{}')
    return { escala: [0, 1, 2].includes(v.escala) ? v.escala : 0, altoContraste: !!v.altoContraste }
  } catch {
    return { escala: 0, altoContraste: false }
  }
}

export function A11yProvider({ children }: { children: ReactNode }) {
  const inicial = ler()
  const [escala, setEscala] = useState<Escala>(inicial.escala)
  const [altoContraste, setAlto] = useState(inicial.altoContraste)
  const [falando, setFalando] = useState(false)
  const vozDisponivel = typeof window !== 'undefined' && 'speechSynthesis' in window

  useEffect(() => {
    document.documentElement.style.fontSize = TAMANHOS[escala]
    document.documentElement.classList.toggle('hc', altoContraste)
    try {
      localStorage.setItem(KEY, JSON.stringify({ escala, altoContraste }))
    } catch {
      /* ignora */
    }
  }, [escala, altoContraste])

  const pararFala = useCallback(() => {
    if (vozDisponivel) window.speechSynthesis.cancel()
    setFalando(false)
  }, [vozDisponivel])

  const falar = useCallback(
    (texto: string) => {
      if (!vozDisponivel) return
      window.speechSynthesis.cancel()
      const u = new SpeechSynthesisUtterance(texto)
      u.lang = 'pt-BR'
      u.rate = 0.9
      const voz = window.speechSynthesis.getVoices().find((v) => v.lang.toLowerCase().startsWith('pt'))
      if (voz) u.voice = voz
      u.onend = () => setFalando(false)
      u.onerror = () => setFalando(false)
      setFalando(true)
      window.speechSynthesis.speak(u)
    },
    [vozDisponivel],
  )

  return (
    <Ctx.Provider
      value={{
        escala,
        altoContraste,
        aumentar: () => setEscala((e) => (e < 2 ? ((e + 1) as Escala) : e)),
        diminuir: () => setEscala((e) => (e > 0 ? ((e - 1) as Escala) : e)),
        alternarContraste: () => setAlto((v) => !v),
        falar,
        pararFala,
        falando,
        vozDisponivel,
      }}
    >
      {children}
    </Ctx.Provider>
  )
}

export function useA11y() {
  const c = useContext(Ctx)
  if (!c) throw new Error('useA11y precisa estar dentro de A11yProvider')
  return c
}
