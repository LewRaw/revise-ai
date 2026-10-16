# 🎓 ReviseAI — Plataforma de Estudos Ativos, FSRS & Boletim Escolar (Ensino Médio & ENEM)

Plataforma mobile-first construída sob o padrão **Antigravity Project Blueprint** (Next.js 14 App Router, TypeScript estrito, Tailwind CSS Fintech Dark Mode `#000000` / `#141414` / `#11C76F`, Supabase PostgreSQL com RLS e Google Gemini Multimodal).

---

## 🚀 Principais Módulos

1. **🎙️ Revisão Ativa por Voz (Técnica de Feynman):**
   - Transcrição nativa em português (`Web Speech API`) + diagnóstico conceitual via IA apontando clareza (0-100%), pontos fortes e lacunas.
2. **📸 Foto do Caderno (OCR Multimodal Gemini Vision):**
   - Extração instantânea de anotações, fórmulas e geração de simulado de fixação com 1 clique.
3. **⚡ Motor de Rotinas Guiadas & Construtor Customizado:**
   - Modos prontos (*Dia Normal*, *Pré-Prova Intensivo*, *Revisão Relâmpago*) + Construtor onde o estudante monta sua própria sequência de blocos.
   - Geração automática de **Resumo Focal** focado nas questões erradas durante a sessão.
4. **🧠 Caderno de Erros com Repetição Espaçada (Algoritmo FSRS):**
   - Toda questão errada nos simulados ou nas rotinas alimenta automaticamente a fila FSRS (*Free Spaced Repetition Scheduler*), calculando estabilidade da memória ($S$) e agendamento inteligente.
5. **📊 Boletim Escolar Universal & Simulador de Período:**
   - Compatível com regimes **Bimestral (4)**, **Trimestral (3)** e **Semestral (2)**, média simples ou ponderada por pesos, calculadora de sub-avaliações (*Prova 1 + Prova 2 + Trabalho*) e alerta automático nas Rotinas quando uma disciplina está abaixo da média de corte.

---

## 🛠️ Como Executar Localmente

```bash
# 1. Instalar dependências e compilar o frontend
cd frontend
npm install
npm run dev
```

---

## 🧪 Suíte de Testes & Auditoria de Segurança

```bash
# Executar todas as suítes de testes automatizados
node tests/core_coverage.test.js
node tests/grade_calculations.test.js
node tests/routine_engine.test.js
node tests/fsrs_and_persistence.test.js

# Executar scanner de segredos (ativo também em .git/hooks/pre-commit)
python scripts/verify_security.py
```

---

## 🚢 Subindo nas Plataformas (GitHub + Supabase + Vercel)

1. **Supabase:**
   - No painel do Supabase, abra o **SQL Editor** e execute o arquivo [`supabase/schema.sql`](./supabase/schema.sql) (cria as 13 tabelas, triggers e políticas RLS).
2. **Vercel:**
   - Conecte seu repositório GitHub na Vercel.
   - Configure **Root Directory** como `frontend`.
   - Adicione as variáveis listadas em [`.env.example`](./.env.example) (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `GEMINI_API_KEY`).
