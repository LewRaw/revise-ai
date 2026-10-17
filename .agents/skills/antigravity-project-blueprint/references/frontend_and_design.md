# 🎨 Padrão de Frontend e Design System Fintech

Este documento estabelece as diretrizes de interface, ergonomia mobile e arquitetura de componentes React para novos projetos criados com o Antigravity.

---

## 1. Stack Tecnológica Obrigatória
- **Framework:** Next.js 14+ (App Router).
- **Linguagem:** TypeScript estrito (`strict: true`).
- **Estilização:** Tailwind CSS (com classes utilitárias diretas, sem CSS modular fragmentado).
- **Ícones:** `lucide-react` (ícones leves, consistentes e SVG inline).
- **PWA:** Web App Manifest (`manifest.json` ou `manifest.ts`), suporte a standalone e service worker.

---

## 2. Paleta de Cores (Estilo Fintech Escuro / PicPay / Nubank)

| Função | Token Tailwind | Hexadecimal | Uso |
| :--- | :--- | :--- | :--- |
| **Fundo Principal** | `bg-black` / `dark:bg-[#000000]` | `#000000` | Fundo base absoluto da aplicação |
| **Superfície / Cartão** | `dark:bg-[#141414]` | `#141414` | Cards de destaque, menus e seções |
| **Sub-cartão / Input** | `dark:bg-[#1c1c1c]` | `#1c1c1c` | Inputs de formulário, itens de lista |
| **Bordas Sutis** | `dark:border-[#262626]` | `#262626` | Delimitadores de cards e divisores |
| **Destaque Principal** | `bg-[#11C76F]` / `text-[#11C76F]` | `#11C76F` | Botões primários, badges de sucesso |
| **Texto de Alto Contraste** | `text-white` | `#FFFFFF` | Títulos, métricas e valores principais |
| **Texto Secundário** | `text-[#8E8E93]` / `text-slate-400` | `#8E8E93` | Legendas, rótulos e unidades |

> ⚠️ **Regra Estrita:** Zero degradês coloridos exagerados. Priorize blocos sólidos de alto contraste, estética limpa e profissional.

---

## 3. Ergonomia Mobile & Acessibilidade (Touch Targets)

1. **Tamanho Mínimo de Toque (WCAG / Apple HIG):**
   - Qualquer elemento clicável (botão, ícone, link, chip) deve ter altura mínima de **44px** (`min-h-[44px]`).
   - Botões compactos devem usar padding de toque seguro (`p-2.5` ou `p-3`).
2. **Prevenção de Quebras em Telas Estreitas (320px):**
   - Use sempre contêiner com largura contida: `max-w-md md:max-w-3xl lg:max-w-5xl mx-auto px-4`.
   - Quebre grids em `grid-cols-1 sm:grid-cols-2` para evitar overflow horizontal.
3. **Feedback Tátil:**
   - Efeito active em botões de ação: `active:scale-98 transition-all`.
4. **Proibição de `alert()` do Navegador:**
   - É **estritamente proibido** utilizar `window.alert()`, `confirm()` ou `prompt()`.
   - Todas as notificações ao usuário devem utilizar um contexto centralizado de Toast (`useToast() -> showToast(msg, 'success' | 'error' | 'info')`).

---

## 4. Estrutura de Pastas Recomendada

```text
frontend/
├── app/
│   ├── layout.tsx         # Root layout com fontes, meta tags e Viewport mobile
│   ├── page.tsx           # Página inicial / Dashboard central
│   ├── actions/           # Server Actions ('use server') para mutações seguras
│   ├── api/               # Webhooks e rotas HTTP externas
│   └── globals.css        # Tailwind base e resets de scrollbar
├── components/            # Componentes modulares reutilizáveis
│   ├── BottomNav.tsx      # Barra de navegação inferior estilo app nativo
│   ├── Toast.tsx          # Notificações flutuantes não intrusivas
│   └── ModalPortal.tsx    # Modais acessíveis com trava de scroll do body
├── context/               # React Contexts (AuthContext, ToastContext)
└── lib/                   # Tipos TypeScript, clientes de API e date-utils
```
