# Saúde Fácil — Front-end

Plataforma de saúde acessível para idosos e pessoas com deficiência.
FIAP · Global Solution 2 · CitizenTech 2026.

## Como rodar

```bash
npm install
npm run dev          # http://localhost:5173
npm run build        # gera a pasta dist/ (deploy na Vercel)
```

Sem configurar nada, o site abre em **modo demonstração**: dados fictícios salvos no navegador.
Para ligar no back-end Java, crie um arquivo `.env`:

```
VITE_API_URL=http://localhost:8080
```

## Tecnologias

React 19 + Vite · TypeScript · Tailwind CSS 4 · React Router · Lucide (ícones) · qrcode.react · Web Speech API (leitura em voz alta)

## Telas

| Rota | Tela |
|---|---|
| `#/` | Página inicial (apresentação, recursos, acessibilidade, ODS 3 e 10) |
| `#/dashboard` | Painel: próxima consulta, remédios do dia, indicadores e interpretação |
| `#/consultas` | Cadastrar, editar, marcar como realizada, cancelar e excluir |
| `#/medicamentos` | Cadastrar remédios com vários horários, pausar, editar, excluir |
| `#/carteirinha` | Carteirinha com QR Code, escolha do que compartilhar, novo código e revogação |
| `#/c/:token` | Página aberta pelo QR Code (só informações autorizadas) |
| `#/perfil` | Dados pessoais, contato de emergência, dados essenciais e preferências |

## Acessibilidade (WCAG 2.2)

- Aumentar/diminuir letra (3 níveis) e modo alto contraste, salvos no aparelho
- Botão **Ouvir** em consultas, remédios, painel e carteirinha (leitura em voz alta em pt-BR)
- Navegação completa por teclado, link "Pular para o conteúdo", foco visível
- Rótulos em todos os campos, mensagens anunciadas a leitores de tela (`aria-live`)
- Botões com no mínimo 48 px de altura e navegação inferior grande no celular
- Respeita "reduzir movimento" do sistema

## Segurança e LGPD

- O QR Code contém **apenas um link com token aleatório** — nenhum dado de saúde.
- O titular escolhe quais informações aparecem, pode **revogar** o acesso e **gerar novo código** (o antigo para de funcionar).
- Demonstrações usam somente dados fictícios.

## Contrato da API (para os integrantes 2 e 3)

Os tipos estão em `src/types/index.ts` e as chamadas em `src/services/api.ts`.
Protótipo com um usuário (`id = 1`). JSON com os mesmos nomes de campo.

| Método | Endpoint | Corpo / Retorno |
|---|---|---|
| GET | `/api/usuarios/{id}` | `Usuario` |
| PUT | `/api/usuarios/{id}` | `Usuario` → `Usuario` |
| GET | `/api/usuarios/{id}/consultas` | `Consulta[]` |
| POST | `/api/usuarios/{id}/consultas` | `NovaConsulta` → `Consulta` |
| PUT | `/api/consultas/{id}` | `Consulta` → `Consulta` |
| DELETE | `/api/consultas/{id}` | 204 |
| GET | `/api/usuarios/{id}/medicamentos` | `Medicamento[]` |
| POST | `/api/usuarios/{id}/medicamentos` | `NovoMedicamento` → `Medicamento` |
| PUT | `/api/medicamentos/{id}` | `Medicamento` → `Medicamento` |
| DELETE | `/api/medicamentos/{id}` | 204 |
| GET | `/api/usuarios/{id}/carteirinha` | `Carteirinha` |
| PUT | `/api/usuarios/{id}/carteirinha` | `{ camposAutorizados: string[] }` → `Carteirinha` |
| POST | `/api/usuarios/{id}/carteirinha/token` | gera novo token → `Carteirinha` |
| POST | `/api/usuarios/{id}/carteirinha/revogar` | → `Carteirinha` (ativa = false) |
| POST | `/api/usuarios/{id}/carteirinha/ativar` | → `Carteirinha` (ativa = true) |
| GET | `/api/public/carteirinha/{token}` | `CarteirinhaPublica` · 404 se revogada/inválida |
| GET | `/api/usuarios/{id}/estatisticas` | `Estatisticas` |

Enum `StatusConsulta`: `AGENDADA`, `REALIZADA`, `CANCELADA`.
Campos da carteirinha: `tipoSanguineo`, `alergias`, `condicoes`, `medicamentos`, `contatoEmergencia`, `necessidadesAcessibilidade`.

**Importante para o back-end:**
- Habilitar CORS para a URL do front (`@CrossOrigin` ou `WebMvcConfigurer`).
- O endpoint público deve devolver **somente** os campos autorizados e nunca expor o `id` do usuário.
- Gerar o token com `UUID.randomUUID()` (ou `SecureRandom`).
- `Estatisticas` pode ser calculado com consultas JPQL (`COUNT`, `GROUP BY` por mês e especialidade).

## Estrutura

```
src/
├── components/   AppLayout, Logo, A11yToolbar, HealthCard, StatCard, ui (Button, Card, Field…)
├── context/      A11yContext (letra, contraste, leitura em voz alta)
├── pages/        Home, Dashboard, Consultas, Medicamentos, Carteirinha, CarteirinhaPublica, Perfil
├── services/     api.ts (API Java + modo demonstração)
├── types/        index.ts (contratos de dados)
├── App.tsx       rotas
└── main.tsx
```

## Identidade visual

| Uso | Cor |
|---|---|
| Principal | `#087F75` |
| Títulos | `#123B5D` |
| Destaque | `#DDF5EF` |
| Fundo | `#F5F8FA` |
| Cartões | `#FFFFFF` |

Fonte: Nunito Sans. Logo: cartão digital + cruz arredondada (não usa o emblema da Cruz Vermelha).
