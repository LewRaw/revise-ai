# 👥 Governança Multi-Agentes & Diretrizes de Desenvolvimento (Antigravity Blueprint)

Este documento estabelece as regras de desenvolvimento, divisão de papéis e pipeline de qualidade para este projeto.

## 🎯 Pipeline Obrigatório em 4 Fases

1. **Fase 1: Arquitetura & Plano**
   - Criação e validação do plano detalhado em artefato antes de alterações estruturais.
2. **Fase 2: Execução com Isolamento**
   - Código estrito em TypeScript, design system Fintech (`#000000`, `#141414`, `#11C76F`), zero `alert()` (usar `ToastContext`).
   - Ergonomia mobile-first com alvos de toque >= 44px e responsividade a partir de 320px (`xs`).
3. **Fase 3: Quality Gates Automatizados**
   - Validação de compilação sem erros (`npm run build`).
   - Testes unitários e de integração executados com sucesso.
4. **Fase 4: Auditoria de Segurança & Entrega**
   - Scanner de credenciais via `python scripts/verify_security.py`.
   - Pre-commit hook ativo em `.git/hooks/pre-commit`.
   - Nenhuma chave ou credencial exposta em repositório.

## 🤖 Especialistas Multi-Agentes

- **Lead Architect:** Coordenação geral, tomada de decisão de arquitetura e validação de requisitos.
- **Codebase Researcher:** Pesquisa de documentação, esquemas de dados e boas práticas.
- **Feature Implementer:** Construção de componentes React/Next.js e Server Actions com fidelidade visual.
- **QA Test Engineer:** Testes funcionais, usabilidade mobile e validação em telas compactas (320px).
- **Security Gatekeeper:** Auditoria de políticas RLS no Supabase e sanitização contra prompt injection na IA.
