#!/usr/bin/env bash
# Wrapper para invocar REA (Reverse Engineer Anything) directamente desde Antigravity
# Uso: ./scripts/rea-tools/rea.sh <comando> [opciones]

npx -y rea-agents@latest "$@"
