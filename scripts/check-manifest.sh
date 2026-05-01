#!/usr/bin/env bash
# MilkyPot - check-manifest
# Valida que todos os arquivos/markers listados em MILKYPOT-MANIFEST.json existem.
# Usado por git hook pre-push e GitHub Actions para evitar que um revert acidental
# de outro PC apague arquivos criticos do Finance OS/Caixa/Rede.
#
# Uso:
#   bash scripts/check-manifest.sh

set -e
cd "$(dirname "$0")/.."

MANIFEST="MILKYPOT-MANIFEST.json"

if [ ! -f "$MANIFEST" ]; then
  echo "ERRO: $MANIFEST nao encontrado."
  exit 1
fi

FAIL=0

# Lista de arquivos obrigatorios
FILES=$(node -e "const m=require('./$MANIFEST');m.requiredFiles.forEach(f=>console.log(f))" 2>/dev/null || \
        python -c "import json; m=json.load(open('$MANIFEST')); [print(f) for f in m['requiredFiles']]" 2>/dev/null)

if [ -z "$FILES" ]; then
  echo "ERRO: nao consegui ler requiredFiles (instale node OU python)."
  exit 2
fi

echo "→ Verificando arquivos obrigatorios..."
while IFS= read -r f; do
  if [ -z "$f" ]; then continue; fi
  if [ ! -f "$f" ]; then
    echo "  ✗ FALTA: $f"
    FAIL=1
  fi
done <<< "$FILES"

# Markers (strings que precisam existir em certos arquivos)
MARKERS=$(node -e "const m=require('./$MANIFEST');(m.requiredMarkers||[]).forEach(r=>console.log(r.file+'::'+r.contains))" 2>/dev/null || \
          python -c "import json; m=json.load(open('$MANIFEST')); [print(r['file']+'::'+r['contains']) for r in m.get('requiredMarkers',[])]" 2>/dev/null)

echo "→ Verificando marcadores de integridade..."
while IFS= read -r line; do
  if [ -z "$line" ]; then continue; fi
  file="${line%%::*}"
  marker="${line##*::}"
  if [ ! -f "$file" ]; then
    echo "  ✗ arquivo-marker $file ausente"
    FAIL=1
    continue
  fi
  if ! grep -q "$marker" "$file"; then
    echo "  ✗ marcador '$marker' ausente em $file"
    FAIL=1
  fi
done <<< "$MARKERS"

if [ "$FAIL" -ne 0 ]; then
  echo ""
  echo "❌ check-manifest FALHOU — commit/push bloqueado."
  echo "   Esse erro significa que arquivos criticos do Finance OS/Caixa/Rede"
  echo "   foram removidos ou alterados de forma incompativel. Restaure via:"
  echo "     git checkout origin/main -- <arquivo>"
  echo "   ou recupere do backup antes de commitar."
  exit 3
fi

echo ""
echo "✅ check-manifest OK — todos os arquivos e marcadores presentes."
exit 0
