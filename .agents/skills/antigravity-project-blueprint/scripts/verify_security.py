#!/usr/bin/env python3
"""
Pre-commit & CI/CD Security Gatekeeper Script (Blueprint Template)
Varre o repositório e os arquivos preparados para commit (staged files)
para garantir que NENHUMA chave de API, senha de banco ou token seja exposto.
"""

import os
import sys
import re
import subprocess

if sys.stdout.encoding and sys.stdout.encoding.lower() != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8', errors='replace')
    except Exception:
        pass

# Padrões estritos de segredos e credenciais proibidas
PROHIBITED_PATTERNS = [
    (re.compile(r"AIzaSy[A-Za-z0-9_-]{33}"), "Google / Gemini API Key"),
    (re.compile(r"sb_secret_[A-Za-z0-9_-]{16,}"), "Supabase Service Role Secret"),
    (re.compile(r"4b67utz[A-Za-z0-9]+"), "Supabase PostgreSQL Database Password"),
    (re.compile(r"-----BEGIN (?:RSA |EC )?PRIVATE KEY-----"), "Chave Privada SSL/SSH"),
    (re.compile(r"ghp_[A-Za-z0-9]{36}"), "GitHub Personal Access Token"),
    (re.compile(r"sk-[A-Za-z0-9_-]{32,}"), "OpenAI / Claude API Secret Key"),
]

# Arquivos que NUNCA devem ser commitados no Git
PROHIBITED_FILES = [
    re.compile(r"^\.env(\.local|\.production|\.development)?$", re.I),
    re.compile(r"^secrets\.toml$", re.I),
    re.compile(r".*\.pem$", re.I),
    re.compile(r".*\.key$", re.I),
]

def get_staged_files():
    """Recupera lista de arquivos em staging no Git."""
    try:
        res = subprocess.run(
            ["git", "diff", "--cached", "--name-only"],
            capture_output=True,
            text=True,
            encoding="utf-8",
            errors="ignore",
            check=True,
        )
        return [f.strip() for f in res.stdout.splitlines() if f.strip()]
    except Exception:
        return []

def get_staged_diff():
    """Recupera o diff completo do que está sendo commitado."""
    try:
        res = subprocess.run(
            ["git", "diff", "--cached", "-U0"],
            capture_output=True,
            text=True,
            encoding="utf-8",
            errors="ignore",
            check=True,
        )
        return res.stdout
    except Exception:
        return ""

def scan_full_repository():
    """Varre arquivos rastreados pelo Git caso não haja staged diff."""
    try:
        res = subprocess.run(
            ["git", "ls-files"],
            capture_output=True,
            text=True,
            encoding="utf-8",
            errors="ignore",
            check=True,
        )
        return [f.strip() for f in res.stdout.splitlines() if f.strip()]
    except Exception:
        return []

def main():
    print("=" * 70)
    print("🛡️  SECURITY AUDIT & SECRET LEAK PREVENTION SCANNER")
    print("=" * 70)

    violations = []
    staged_files = get_staged_files()

    # 1. Checagem de nomes de arquivos proibidos
    files_to_check = staged_files if staged_files else scan_full_repository()
    for file_path in files_to_check:
        base_name = os.path.basename(file_path)
        for pat in PROHIBITED_FILES:
            if pat.match(base_name):
                violations.append(
                    f"🚨 ARQUIVO PROIBIDO DETECTADO: '{file_path}' (arquivos de ambiente/chaves não devem ser versionados!)"
                )

    # 2. Checagem de conteúdo
    staged_diff = get_staged_diff()
    if staged_diff:
        current_file = "desconhecido"
        for line in staged_diff.splitlines():
            if line.startswith("+++ b/"):
                current_file = line.replace("+++ b/", "")
            elif line.startswith("+") and not line.startswith("+++"):
                # Ignorar scripts de scanner que definem os padrões regex
                if "verify_security.py" in current_file:
                    continue
                for pat, desc in PROHIBITED_PATTERNS:
                    if pat.search(line):
                        violations.append(
                            f"🚨 CREDENCIAL EXPOSTA [{desc}] no arquivo '{current_file}':\n   Linha: {line.strip()[:80]}"
                        )
    else:
        # Se não há commit staged, varre o código atual
        for file_path in files_to_check:
            if not os.path.isfile(file_path):
                continue
            if "verify_security.py" in file_path or file_path.startswith("venv") or file_path.startswith(".git"):
                continue
            try:
                with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                    for line_num, line in enumerate(f, start=1):
                        for pat, desc in PROHIBITED_PATTERNS:
                            if pat.search(line):
                                violations.append(
                                    f"🚨 CREDENCIAL EXPOSTA [{desc}] em '{file_path}:{line_num}':\n   {line.strip()[:80]}"
                                )
            except Exception:
                pass

    if violations:
        print("\n❌ FALHA NA AUDITORIA DE SEGURANÇA! COMMIT OU OPERAÇÃO BLOQUEADA:\n")
        for v in violations:
            print(f"  {v}")
        print("\n👉 AÇÃO NECESSÁRIA: Remova as credenciais expostas antes de prosseguir.")
        print("   Use variáveis de ambiente (.env.local no frontend) sem expor segredos no Git.\n")
        sys.exit(1)

    print("\n✅ AUDITORIA CONCLUÍDA COM SUCESSO: Zero credenciais ou segredos expostos!")
    print("   Repositório seguro para commit e push.\n")
    sys.exit(0)

if __name__ == "__main__":
    main()
