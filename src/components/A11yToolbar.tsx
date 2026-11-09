import { Contrast } from 'lucide-react'
import { useA11y } from '../context/A11yContext'

/** Controles de acessibilidade sempre visíveis: tamanho da letra e alto contraste. */
export function A11yToolbar() {
  const { escala, aumentar, diminuir, altoContraste, alternarContraste } = useA11y()
  const base = 'min-h-11 min-w-11 px-3 rounded-xl border-2 border-line bg-card font-extrabold text-ink hover:border-brand disabled:opacity-40'
  return (
    <div role="group" aria-label="Acessibilidade" className="flex items-center gap-1.5">
      <button type="button" className={base} onClick={diminuir} disabled={escala === 0} aria-label="Diminuir letra">
        A<span className="text-xs">−</span>
      </button>
      <button type="button" className={base} onClick={aumentar} disabled={escala === 2} aria-label="Aumentar letra">
        A<span className="text-sm">+</span>
      </button>
      <button
        type="button"
        className={`${base} inline-flex items-center gap-1.5 ${altoContraste ? '!bg-ink !text-card !border-ink' : ''}`}
        onClick={alternarContraste}
        aria-pressed={altoContraste}
      >
        <Contrast size={18} aria-hidden />
        <span className="hidden sm:inline">Contraste</span>
        <span className="sr-only sm:hidden">Alto contraste</span>
      </button>
    </div>
  )
}
