# 🚢 Pipeline de Deploy & Integração Contínua (Vercel + GitHub)

Este documento padroniza o ciclo de build, testes e deploy para garantir estabilidade contínua em qualquer novo projeto.

---

## 1. Quality Gates Pré-Deploy (Obrigatório)

Antes de enviar qualquer código para a branch `main`:

```bash
# 1. Validação de Build de Produção do Next.js
cd frontend && npm run build

# 2. Execução da Suíte de Testes Automatizados
node tests/core_coverage.test.js && node tests/security_adversarial.test.js

# 3. Auditoria Física de Segredos (Zero credenciais expostas)
python scripts/verify_security.py
```

### Configuração do Pre-Commit Hook Automático:
Para que ninguém esqueça de rodar o verificador manualmente, configure o hook do Git:
```bash
python scripts/setup_git_hook.py
```
Isso cria o script em `.git/hooks/pre-commit`, barrando automaticamente qualquer `git commit` caso haja chaves de API ou arquivos `.env` preparados para envio.


---

## 2. Configuração de Deploy na Vercel

### A. Estrutura do Repositório:
- Se o projeto Next.js estiver na pasta `frontend/`:
  - No painel da Vercel, defina **Root Directory**: `frontend`.
  - **Framework Preset:** Next.js.
  - **Build Command:** `npm run build` (padrão).
  - **Install Command:** `npm install` (padrão).

### B. Variáveis de Ambiente no Painel da Vercel:
Cadastre todas as variáveis necessárias em **Project Settings -> Environment Variables**:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `GEMINI_API_KEY`
- `NEXT_PUBLIC_APP_URL` (URL gerada pela Vercel, ex: `https://meu-projeto.vercel.app`)

---

## 3. Padrão de Commits Semânticos
Todos os commits devem seguir a convenção de mensagens semânticas:
- `feat:` Nova funcionalidade adicionada.
- `fix:` Correção de bug ou regressão.
- `refactor:` Melhoria interna de código sem alteração de comportamento.
- `chore:` Atualização de dependências ou scripts de build.
- `docs:` Documentação ou arquivos de orientação.
