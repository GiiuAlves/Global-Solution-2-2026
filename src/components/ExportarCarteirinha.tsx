import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { QRCodeCanvas } from 'qrcode.react'
import { Download, Printer, Share2 } from 'lucide-react'
import { Button } from './ui'
import { Modal } from './Modal'
import { PREVIA } from './Lembretes'

interface Dados {
  nome: string
  tipoSanguineo?: string
  contato?: string
  telefoneContato?: string
  alergias?: string
  url: string
}

function retanguloArredondado(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}
function cortar(ctx: CanvasRenderingContext2D, texto: string, max: number) {
  if (ctx.measureText(texto).width <= max) return texto
  let t = texto
  while (t.length > 1 && ctx.measureText(t + '…').width > max) t = t.slice(0, -1)
  return t + '…'
}

/** Desenha a carteirinha em tamanho de cartão de crédito (85,6 × 54 mm, 300 dpi). */
async function desenhar(d: Dados, qr: HTMLCanvasElement) {
  const W = 1011, H = 638
  const c = document.createElement('canvas')
  c.width = W
  c.height = H
  const ctx = c.getContext('2d')!
  try { await document.fonts.ready } catch { /* segue com a fonte padrão */ }
  const fonte = (peso: number, px: number) => `${peso} ${px}px "Nunito Sans", system-ui, sans-serif`

  const g = ctx.createLinearGradient(0, 0, W, H)
  g.addColorStop(0, '#087F75')
  g.addColorStop(1, '#0B5F7A')
  retanguloArredondado(ctx, 0, 0, W, H, 44)
  ctx.fillStyle = g
  ctx.fill()
  ctx.save()
  ctx.clip()
  ctx.fillStyle = 'rgba(255,255,255,0.08)'
  ctx.beginPath(); ctx.arc(W - 60, 40, 220, 0, Math.PI * 2); ctx.fill()
  ctx.beginPath(); ctx.arc(80, H + 40, 200, 0, Math.PI * 2); ctx.fill()
  ctx.restore()

  // Marca
  ctx.fillStyle = '#fff'
  retanguloArredondado(ctx, 56, 50, 66, 54, 14); ctx.fill()
  ctx.fillStyle = '#087F75'
  retanguloArredondado(ctx, 66, 72, 30, 11, 5); ctx.fill()
  retanguloArredondado(ctx, 75.5, 62, 11, 30, 5); ctx.fill()
  ctx.fillStyle = '#BFEDE3'
  retanguloArredondado(ctx, 101, 63, 10, 10, 3); ctx.fill()
  retanguloArredondado(ctx, 101, 81, 10, 10, 3); ctx.fill()
  ctx.fillStyle = '#fff'
  ctx.font = fonte(800, 38)
  ctx.textBaseline = 'middle'
  ctx.fillText('Saúde Fácil', 140, 78)
  ctx.font = fonte(800, 20)
  ctx.textAlign = 'right'
  ctx.fillText('CARTEIRINHA DE SAÚDE', W - 56, 78)
  ctx.textAlign = 'left'

  // Dados
  const colTexto = W - 56 - 300 - 40 - 56
  ctx.textBaseline = 'alphabetic'
  ctx.fillStyle = 'rgba(255,255,255,0.75)'
  ctx.font = fonte(700, 22)
  ctx.fillText('TITULAR', 56, 190)
  ctx.fillStyle = '#fff'
  ctx.font = fonte(800, 46)
  ctx.fillText(cortar(ctx, d.nome, colTexto), 56, 242)

  const bloco = (rotulo: string, valor: string, y: number, grande = false) => {
    ctx.fillStyle = 'rgba(255,255,255,0.75)'
    ctx.font = fonte(700, 22)
    ctx.fillText(rotulo, 56, y)
    ctx.fillStyle = '#fff'
    ctx.font = fonte(800, grande ? 48 : 32)
    ctx.fillText(cortar(ctx, valor, colTexto), 56, y + (grande ? 52 : 40))
  }
  bloco('TIPO SANGUÍNEO', d.tipoSanguineo || '—', 310, true)
  if (d.alergias) {
    ctx.fillStyle = '#FFE3E0'
    ctx.font = fonte(800, 26)
    ctx.fillText(cortar(ctx, `⚠ Alergia: ${d.alergias}`, colTexto), 210, 362)
  }
  bloco('EMERGÊNCIA', [d.contato, d.telefoneContato].filter(Boolean).join(' · ') || '—', 450)

  // QR Code
  const qx = W - 56 - 300, qy = 160
  ctx.fillStyle = '#fff'
  retanguloArredondado(ctx, qx - 20, qy - 20, 340, 340, 28); ctx.fill()
  ctx.imageSmoothingEnabled = false
  ctx.drawImage(qr, qx, qy, 300, 300)
  ctx.fillStyle = 'rgba(255,255,255,0.9)'
  ctx.font = fonte(700, 20)
  ctx.textAlign = 'center'
  ctx.fillText('Escaneie em caso de emergência', qx + 150, qy + 360)
  ctx.textAlign = 'left'

  ctx.fillStyle = 'rgba(255,255,255,0.85)'
  ctx.font = fonte(600, 20)
  ctx.fillText('Compartilhamento controlado pelo titular · Ligue 192 (SAMU)', 56, H - 48)
  return c.toDataURL('image/png')
}

/** Botão "Exportar carteirinha": gera a imagem, permite baixar, compartilhar e imprimir em tamanho real. */
export function ExportarCarteirinha({ dados, desabilitado }: { dados: Dados; desabilitado?: boolean }) {
  const [aberto, setAberto] = useState(false)
  const [img, setImg] = useState('')
  const qrRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!aberto) return
    let vivo = true
    setImg('')
    setTimeout(async () => {
      if (qrRef.current) {
        const url = await desenhar(dados, qrRef.current)
        if (vivo) setImg(url)
      }
    }, 30)
    return () => { vivo = false }
  }, [aberto, dados])

  const nomeArquivo = `carteirinha-${dados.nome.split(' ')[0].normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()}.png`

  function baixar() {
    const a = document.createElement('a')
    a.href = img
    a.download = nomeArquivo
    a.click()
  }
  async function compartilhar() {
    try {
      const blob = await (await fetch(img)).blob()
      const arquivo = new File([blob], nomeArquivo, { type: 'image/png' })
      await navigator.share({ files: [arquivo], title: 'Carteirinha Saúde Fácil' })
    } catch {
      baixar()
    }
  }
  function imprimir() {
    document.documentElement.classList.add('imprimir-cartao')
    const fim = () => {
      document.documentElement.classList.remove('imprimir-cartao')
      window.removeEventListener('afterprint', fim)
    }
    window.addEventListener('afterprint', fim)
    setTimeout(() => window.print(), 50)
  }
  const podeCompartilhar = typeof navigator !== 'undefined' && 'canShare' in navigator

  return (
    <>
      <Button variant="secondary" className="!px-3" onClick={() => setAberto(true)} disabled={desabilitado}>
        <Download size={18} aria-hidden /> Exportar
      </Button>
      <span className="sr-only" aria-hidden>
        <QRCodeCanvas ref={qrRef} value={dados.url} size={300} level="M" fgColor="#123B5D" marginSize={0} />
      </span>
      <Modal titulo="Exportar carteirinha" aberto={aberto} onFechar={() => setAberto(false)} largura="max-w-2xl">
        {img ? (
          <img src={img} alt={`Carteirinha de ${dados.nome}, com QR Code`} className="w-full rounded-2xl shadow-lg" />
        ) : (
          <p role="status" className="py-16 text-center text-muted">Gerando imagem…</p>
        )}
        {PREVIA ? (
          <p className="mt-4 rounded-xl bg-page p-3 text-muted">Para salvar, toque e segure a imagem (celular) ou clique com o botão direito (computador).</p>
        ) : (
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <Button onClick={baixar} disabled={!img}><Download size={18} aria-hidden /> Baixar imagem</Button>
            {podeCompartilhar && <Button variant="secondary" onClick={compartilhar} disabled={!img}><Share2 size={18} aria-hidden /> Enviar</Button>}
            <Button variant="secondary" onClick={imprimir} disabled={!img}><Printer size={18} aria-hidden /> Imprimir cartão</Button>
          </div>
        )}
        <p className="mt-4 text-sm text-muted">
          Imprima e guarde na carteira, ou deixe a imagem como fundo de tela do celular. O QR Code continua funcionando enquanto o compartilhamento estiver ligado.
        </p>
      </Modal>
      {img && createPortal(<img src={img} alt="" className="cartao-impressao" />, document.body)}
    </>
  )
}
