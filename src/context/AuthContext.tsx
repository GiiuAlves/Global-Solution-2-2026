import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'
import { api, getSessao } from '../services/api'
import type { NovoProfissional, Perfil, Sessao } from '../types'

interface Auth {
  sessao: Sessao | null
  entrar: (perfil: Perfil, login: string, senha: string) => Promise<Sessao>
  cadastrarProfissional: (dados: NovoProfissional) => Promise<Sessao>
  sair: () => void
  excluirMinhaConta: () => Promise<void>
}

const Ctx = createContext<Auth | null>(null)

export const inicioDoPerfil = (perfil?: Perfil) => (perfil === 'PROFISSIONAL' ? '/pro' : '/painel')

export function AuthProvider({ children }: { children: ReactNode }) {
  const [sessao, setSessao] = useState<Sessao | null>(() => getSessao())

  const entrar = useCallback(async (perfil: Perfil, login: string, senha: string) => {
    const s = await api.entrar(perfil, login, senha)
    setSessao(s)
    return s
  }, [])
  const cadastrarProfissional = useCallback(async (dados: NovoProfissional) => {
    const s = await api.cadastrarProfissional(dados)
    setSessao(s)
    return s
  }, [])
  const sair = useCallback(() => {
    api.sair()
    setSessao(null)
  }, [])
  const excluirMinhaConta = useCallback(async () => {
    await api.excluirMinhaConta()
    setSessao(null)
  }, [])

  return <Ctx.Provider value={{ sessao, entrar, cadastrarProfissional, sair, excluirMinhaConta }}>{children}</Ctx.Provider>
}

export function useAuth() {
  const c = useContext(Ctx)
  if (!c) throw new Error('useAuth precisa estar dentro de AuthProvider')
  return c
}

/** Sessão de paciente garantida (usar só dentro das rotas do paciente). */
export function usePaciente() {
  const { sessao } = useAuth()
  if (sessao?.perfil !== 'PACIENTE') throw new Error('Rota exclusiva do paciente')
  return sessao.usuario
}
/** Sessão de profissional garantida (usar só dentro das rotas do profissional). */
export function useProfissional() {
  const { sessao } = useAuth()
  if (sessao?.perfil !== 'PROFISSIONAL') throw new Error('Rota exclusiva do profissional')
  return sessao.usuario
}
