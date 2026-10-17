---
name: antigravity-project-blueprint
description: >-
  Skill padrão e blueprint para criação de novos projetos no ecossistema Antigravity.
  Padroniza a stack frontend (Next.js 14, Tailwind, PWA estilo fintech), configuração de chaves (Supabase, Google AI Studio Gemini, Stripe), fluxo de deploy na Vercel e orquestração de subagentes especializados.
---

# 🏗️ Antigravity Project Blueprint: Guia Oficial de Inicialização de Projetos

Esta skill é o **modelo padrão de excelência** para criar, estruturar e evoluir novos projetos web e mobile (PWA) no Antigravity.

---

## 🎯 1. Arquitetura Padrão Recomendada
- **Frontend / PWA:** Next.js 14+ (App Router), TypeScript estrito, Tailwind CSS, Lucide Icons.
- **Design System:** Estilo Fintech (Fundo `#000000`, superfícies `#141414`, destaque `#11C76F`, zero degradês, zero `alert()`).
- **Banco de Dados & Autenticação:** Supabase PostgreSQL com Row Level Security (RLS).
- **Inteligência Artificial:** Google GenAI SDK (`GEMINI_API_KEY`) com modelos `gemini-2.5-flash` ou `gemini-2.0-flash`.
- **Pagamentos / Assinaturas:** Stripe Checkout oficial (`STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`).
- **Deploy:** Vercel com CI/CD acoplado ao repositório GitHub.

---

## 🚀 2. Checklist Rápido de Inicialização de um Novo Projeto

Quando o usuário pedir para criar ou estruturar um novo projeto, siga este roteiro:

1. **Configuração de Ambiente & Chaves:**
   - Crie o `.env.local` na pasta `frontend/` com base no documento de referência:
     📖 [Guia de Variáveis de Ambiente e Chaves](./references/env_and_keys.md)
   - Garanta que `.env*` esteja adicionado no `.gitignore`.
2. **Setup do Frontend & Design System:**
   - Configure o layout base com visual Fintech escuro e ergonomia touch mobile (mínimo 44px).
   - Configure o `ToastContext` para notificações limpas.
     📖 [Padrões de Frontend & Design System](./references/frontend_and_design.md)
3. **Setup de Regras e Governança:**
   - Crie um arquivo `AGENTS.md` na raiz do novo projeto definindo o pipeline em 4 fases e as regras de segurança.
   - Adicione o script `scripts/verify_security.py` para barrar commits acidentais de chaves.
4. **Orquestração de Agentes:**
   - Delegue tarefas especializadas para subagentes (`Codebase Researcher`, `Feature Implementer`, `QA Test Engineer`, `Security Gatekeeper`).
     📖 [Guia de Colaboração Multi-Agentes](./references/multi_agent_collaboration.md)
5. **Quality Gates & Deploy na Vercel:**
   - Valide compilação com `npm run build` e execute a suíte de testes antes do commit.
     📖 [Pipeline de Deploy e CI/CD](./references/deploy_and_ci.md)

## 🛡️ 3. Verificador de Commit & Pre-Commit Hook (Anti-Vazamento)

Para garantir que nenhuma credencial (chaves de API, senhas ou tokens) seja commitada acidentalmente no Git:

1. **Scripts inclusos na Skill:**
   - [scripts/verify_security.py](./scripts/verify_security.py): Scanner que inspeciona o diff em staging antes de cada commit.
   - [scripts/setup_git_hook.py](./scripts/setup_git_hook.py): Instalador de 1 comando para ativar o pre-commit hook.

2. **Como ativar no novo projeto:**
   ```bash
   # 1. Copie os scripts para a pasta scripts/ do seu novo projeto:
   # (verify_security.py e setup_git_hook.py)

   # 2. Ative o hook automático no Git:
   python scripts/setup_git_hook.py
   ```
   A partir desse momento, qualquer tentativa de executar `git commit` com chaves expostas ou arquivos `.env*` será imediatamente bloqueada com saída de erro e instrução de correção.

---

## 📁 4. Templates Prontos Inclusos (Starter Kit)

A skill fornece templates de código prontos e testados para acelerar a inicialização:

| Categoria | Arquivo do Template | Finalidade |
| :--- | :--- | :--- |
| **Banco de Dados** | [`templates/database/supabase_schema.sql`](./templates/database/supabase_schema.sql) | Schema PostgreSQL com RLS, tabela `profiles` e trigger de cadastro. |
| **Notificações UI** | [`templates/frontend/ToastContext.tsx`](./templates/frontend/ToastContext.tsx) | Sistema de toasts fintech (sucesso/erro/info) eliminando `alert()`. |
| **Modais Mobile** | [`templates/frontend/Portal.tsx`](./templates/frontend/Portal.tsx) | Portal no `document.body` evitando problemas de z-index e overflow. |
| **Scroll Lock** | [`templates/frontend/useBodyScrollLock.ts`](./templates/frontend/useBodyScrollLock.ts) | Trava o scroll de fundo em smartphones ao abrir modais. |
| **Estilos & Cores** | [`templates/frontend/tailwind.config.ts`](./templates/frontend/tailwind.config.ts) | Paleta fintech (`#000000`, `#141414`, `#11C76F`) e tela `xs: 320px`. |
| **IA & Guardrails** | [`templates/ai/ai_service.ts`](./templates/ai/ai_service.ts) | Gemini SDK com anti-prompt injection e fallbacks determinísticos. |
| **Stripe Webhook** | [`templates/stripe/route_webhook.ts`](./templates/stripe/route_webhook.ts) | Endpoint do Next.js App Router para assinar/atualizar planos. |
| **PWA Mobile** | [`templates/pwa/manifest.json`](./templates/pwa/manifest.json) & [`sw.js`](./templates/pwa/sw.js) | Configuração de PWA standalone e cache offline. |
| **Testes Iniciais** | [`templates/tests/starter_suite.test.js`](./templates/tests/starter_suite.test.js) | Teste leve em Node.js puro sem dependências externas. |

---

## 📚 Documentos de Referência Disponíveis
- [Guia Mestre de Construção & Mentalidade com Agentes](./references/guia_mental_e_construcao.md)
- [Configuração de Chaves (Supabase & AI Studio)](./references/env_and_keys.md)
- [Padrão Visual Frontend & Ergonomia Mobile](./references/frontend_and_design.md)
- [Orquestração de Subagentes & Divisão de Papéis](./references/multi_agent_collaboration.md)
- [Pipeline de Build, Testes & Deploy](./references/deploy_and_ci.md)



