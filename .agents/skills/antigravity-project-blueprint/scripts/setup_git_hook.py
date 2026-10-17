#!/usr/bin/env python3
"""
Setup Git Pre-Commit Hook (Blueprint Installer)
Instala automaticamente o hook pre-commit na pasta .git/hooks/ do projeto
para executar o verify_security.py antes de cada commit.
"""

import os
import sys
import stat

HOOK_CONTENT = """#!/bin/sh
# Git pre-commit hook: Impede commits com credenciais expostas
python scripts/verify_security.py
if [ $? -ne 0 ]; then
    echo "❌ Commit abortado pelo scanner de segredos!"
    exit 1
fi
exit 0
"""

def setup_hook():
    git_dir = ".git"
    if not os.path.exists(git_dir):
        print("❌ Diretório .git não encontrado. Certifique-se de executar este script na raiz do repositório Git.")
        sys.exit(1)

    hooks_dir = os.path.join(git_dir, "hooks")
    os.makedirs(hooks_dir, exist_ok=True)
    hook_file = os.path.join(hooks_dir, "pre-commit")

    with open(hook_file, "w", encoding="utf-8", newline="\n") as f:
        f.write(HOOK_CONTENT)

    # Tornar executável em ambientes POSIX / Git Bash
    try:
        current_stat = os.stat(hook_file)
        os.chmod(hook_file, current_stat.st_mode | stat.S_IXUSR | stat.S_IXGRP | stat.S_IXOTH)
    except Exception:
        pass

    print(f"✅ Git pre-commit hook instalado com sucesso em: {hook_file}")
    print("🔒 Todos os futuros commits serão validados automaticamente pelo verify_security.py!")

if __name__ == "__main__":
    setup_hook()
