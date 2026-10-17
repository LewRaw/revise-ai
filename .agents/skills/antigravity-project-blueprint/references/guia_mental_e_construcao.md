# 🧠 Guia Mestre: Como Pensar e Construir Projetos com Agentes de IA

> **"A maioria dos projetos com IA falha não pela falta de capacidade do modelo, mas pela ausência de governança e rédeas de engenharia."**

Este documento é a referência definitiva para desenvolvedores e agentes sobre como estruturar qualquer projeto novo no ecossistema Antigravity, garantindo que tudo funcione com a mesma estabilidade e excelência do Coach AI.

---

## 🧭 1. O Modelo Mental: Por que Projetos com IA Falham?

Quando um desenvolvedor pede à IA:
> ❌ *"Crie um aplicativo completo de finanças com login, banco de dados e gráficos."*

Acontece o **Efeito Avalanche**:
1. A IA tenta criar dezenas de arquivos ao mesmo tempo.
2. Ela instala bibliotecas conflitantes (ex: misturar Tailwind v3 com Tailwind v4, ou App Router com Pages Router).
3. Ela não testa se o código compila.
4. Quando surge o primeiro erro, você pede para corrigir e ela **reescreve o arquivo inteiro**, apagando o que já funcionava e gerando novos bugs.
5. Em 20 minutos, o projeto fica completamente quebrado.

### 💡 A Regra de Ouro da Engenharia com IA
> **A IA não é uma fábrica que entrega um prédio pronto. A IA é um time de pedreiros ultra-rápidos que precisa de uma planta rigorosa, fiscalização a cada tijolo e um teste de carga antes de colocar o teto.**

---

## 🏛️ 2. Os 3 Pilares Inegociáveis

Para que qualquer projeto funcione com alta estabilidade, ele precisa de 3 pilares:

### Pilar 1: A "Constituição" do Projeto (`AGENTS.md`)
O arquivo `AGENTS.md` na raiz do projeto é a **lei suprema** que a IA lê antes de dar qualquer resposta. Se você não colocar o `AGENTS.md`, a IA vai agir por impulso.

O que o `AGENTS.md` dita:
1. **Design System rígido:** Fundo `#000000`, cartões `#141414`, destaque `#11C76F`. Zero degradês e **proibido `alert()` do navegador** (usar `ToastContext`).
2. **Proibido reescrever arquivos inteiros:** Obrigue a IA a editar apenas os blocos alterados via `replace_file_content`.
3. **Quality Gates obrigatórios:** A IA **não tem permissão** de dizer "pronto" sem antes rodar `npm run build` e a suíte de testes.
4. **Zero credenciais no Git:** Obrigatório rodar o scanner `verify_security.py`.

### Pilar 2: O Pipeline em 4 Fases (The Iron Pipeline)

Toda tarefa passa rigorosamente por 4 fases:

1. **Fase 1 (Plano):** A IA mapeia os arquivos impactados, desenha o fluxo e lista os riscos antes de tocar em código.
2. **Fase 2 (Código):** Edição cirúrgica e modular. Componentes desacoplados.
3. **Fase 3 (Testes):** Rodar `npm run build`. Se der erro de TypeScript, corrigir imediatamente.
4. **Fase 4 (Entrega):** Rodar o scanner de segurança e gerar o commit semântico (`git commit`).

### Pilar 3: O Time de Agentes Especialistas (Orquestração)

Nunca trate o agente como uma entidade genérica. Pense nele como uma equipe:

| Especialista | Papel Principal | Quando Chamar |
| :--- | :--- | :--- |
| 🕵️ **Codebase Researcher** | Lê arquivos e documentações sem alterar nada. | Antes de qualquer implementação. Mapeia como o código funciona. |
| 📐 **Architect / Planner** | Cria o plano de implementação passo a passo. | Para aprovar a estratégia antes de codificar. |
| 💻 **Feature Implementer** | Escreve código limpo, modular e aderente ao design. | Para criar os componentes e Server Actions. |
| 🧪 **QA & Security Gatekeeper** | Roda o build, escreve testes e verifica segredos. | Antes de finalizar a demanda ou comitar. |

---

## 🛠️ 3. O Passo a Passo "Day Zero" (Como Iniciar um Projeto do Zero)

Siga este roteiro para inicializar novos projetos blindados:

### Passo 1: Inicialize o Git e os Guardiões de Segurança
```bash
mkdir meu-novo-app
cd meu-novo-app
git init

# Copie os scripts da skill e instale o hook:
python scripts/setup_git_hook.py
```
*(Garante que nenhuma credencial ou chave seja commitada).*

### Passo 2: Scaffold Limpo do Next.js 14
```bash
npx create-next-app@latest frontend --typescript --tailwind --eslint --app --src-dir=false --import-alias="@/*"
```

### Passo 3: Configurar o `AGENTS.md`
Copie o template do `AGENTS.md` para a raiz do novo projeto com as regras de qualidade.

### Passo 4: Instalar os Blocos Fundamentais (Templates da Skill)
Importe diretamente os templates da skill `antigravity-project-blueprint`:
- `ToastContext.tsx`: Notificações flutuantes elegantes.
- `Portal.tsx` & `useBodyScrollLock.ts`: Modais mobile sem travamento de scroll.
- `tailwind.config.ts`: Paleta Fintech oficial (`#000000`, `#141414`, `#11C76F`).
- `supabase_schema.sql`: Execute no SQL Editor do Supabase para criar o banco com RLS estrito.

---

## 🎯 4. Como Comandar a IA (Prompts de Ouro vs Proibidos)

A forma como você comanda a IA dita 100% da estabilidade do código:

### ❌ O Jeito Proibido (Gera bugs e código quebrado):
> *"O botão de login não está funcionando, conserta aí."*  
> (A IA vai tentar adivinhar, reescrever arquivos e criar 5 novos erros).

### ✅ O Jeito Cirúrgico (Gera código de produção):
> *"Analise o arquivo `frontend/components/LoginForm.tsx`. O envio está retornando erro 400. Siga o pipeline em 4 fases: primeiro me mostre onde está o erro no console/payload; depois proponha uma correção cirúrgica sem alterar a estrutura visual do formulário; ao final, valide com `npm run build`."*

---

## 📋 5. Prompts Prontos para o Dia a Dia

1. **Para iniciar uma funcionalidade complexa:**
   > *"Quero implementar a funcionalidade [X]. Não escreva código ainda. Atue como Arquiteto de Software e elabore um plano de implementação detalhando: 1) Arquivos a criar/modificar; 2) Impacto no banco de dados; 3) Compatibilidade mobile (320px); 4) Possíveis riscos. Aguarde meu 'proceder' antes de codificar."*

2. **Para debugar um erro persistente:**
   > *"Ocorreu o erro [COLAR ERRO AQUI]. Não reescreva arquivos inteiros. Localize a linha exata da falha, explique a causa raiz em 2 frases e faça uma substituição mínima apenas no bloco afetado. Em seguida, rode o build de validação."*

3. **Para auditar antes de subir para produção:**
   > *"Atue como QA e Security Gatekeeper. Execute: 1) Build de produção do Next.js; 2) Suíte de testes automatizados; 3) Scanner de segurança `verify_security.py`. Me entregue o relatório com a contagem de testes e status de cada portão."*
