# 🛡️ Padrão de Configuração de Ambientes e Chaves de Integração

Este documento padroniza as variáveis de ambiente necessárias para inicializar qualquer novo projeto no ecossistema Antigravity com Supabase, Google AI Studio (Gemini), Stripe e APIs externas.

---

## 1. Arquivo de Desenvolvimento Local (`frontend/.env.local`)

Crie este arquivo dentro da pasta do frontend (`frontend/.env.local` ou `.env.local` na raiz):

```bash
# ==============================================================================
# 🗄️ SUPABASE (Backend & PostgreSQL Database)
# ==============================================================================
# URL do projeto Supabase (obtenha em: Project Settings -> API)
NEXT_PUBLIC_SUPABASE_URL=https://<seu-projeto>.supabase.co

# Chave pública anon (acesso seguro pelo client-side / browser)
NEXT_PUBLIC_SUPABASE_ANON_KEY=<sua_chave_publica_anon_aqui>

# Chave secreta de serviço (USO ESTRITAMENTE BACKEND / SERVER ACTIONS)
# ATENÇÃO: NUNCA exponha esta chave com prefixo NEXT_PUBLIC_
SUPABASE_SERVICE_ROLE_KEY=<sua_chave_service_role_secreta_aqui>

# ==============================================================================
# 🤖 GOOGLE AI STUDIO (Gemini SDK / GenAI)
# ==============================================================================
# Obtenha em: https://aistudio.google.com/app/apikey
GEMINI_API_KEY=<sua_chave_api_do_google_ai_studio_aqui>

# Modelo padrão recomendado para velocidade e custo:
# - gemini-2.5-flash ou gemini-2.0-flash (para chat rápido, classificação e parsing)
# - gemini-1.5-pro (para raciocínio complexo, geração longa de código)

# ==============================================================================
# 💳 STRIPE (Pagamentos & Checkout - Opcional)
# ==============================================================================
STRIPE_SECRET_KEY=<sua_chave_secreta_stripe_aqui>
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=<sua_chave_publica_stripe_aqui>
STRIPE_WEBHOOK_SECRET=<seu_webhook_secret_stripe_aqui>

# ==============================================================================
# 🌐 DEPLOY (Vercel / Produção)
# ==============================================================================
NEXT_PUBLIC_APP_URL=https://seu-app.vercel.app
NEXT_PUBLIC_APP_VERSION=1.0.0
```

---

## 2. Configuração no Painel da Vercel (Produção)

Ao fazer deploy na Vercel:
1. Acesse: **Project Settings -> Environment Variables**.
2. Adicione individualmente:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `GEMINI_API_KEY`
   - Demais chaves de produção (Stripe, etc.)
3. Marque os ambientes: **Production**, **Preview**, **Development**.

---

## 3. Regra de Ouro de Segurança (Zero-Leak)
- Arquivos `.env`, `.env.local` e `secrets.toml` devem estar sempre listados no `.gitignore`.
- Nunca commite chaves de produção ou chaves de serviço no repositório Git.
- Para testes locais seguros, mantenha um arquivo `.env.example` versionado com valores vazios/placeholders.
