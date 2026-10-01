#!/usr/bin/env bash
# Monta a pasta "site/" só com o que é público (páginas, assets e resultados).
# Cloudflare Pages: comando de build "bash tools/montar_site.sh" e pasta de saída "site".
# Fica de fora: supabase/ (servidor, matrizes dos fechamentos), tools/, .github/ e documentação interna.
set -euo pipefail
cd "$(dirname "$0")/.."
rm -rf site && mkdir -p site
cp ./*.html site/
cp -r assets data site/
cat > site/_headers <<'H'
/*
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  X-Frame-Options: SAMEORIGIN
  Permissions-Policy: camera=(), microphone=(), geolocation=()
/data/*
  Cache-Control: public, max-age=600
/assets/*
  Cache-Control: public, max-age=3600
H
echo "site/ pronto: $(find site -type f | wc -l) arquivos, $(du -sh site | cut -f1)"
