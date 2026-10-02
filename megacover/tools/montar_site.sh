#!/usr/bin/env bash
# Monta a pasta "site/" só com o que é público (páginas, assets e resultados).
# Cloudflare Pages: comando de build "bash tools/montar_site.sh" e pasta de saída "site".
# Hostinger: envie o CONTEÚDO de site/ para public_html (Gerenciador de Arquivos), não use o fluxo de app Node.js.
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
# Hostinger e outras hospedagens Apache/LiteSpeed (o Cloudflare ignora este arquivo)
cat > site/.htaccess <<'H'
Options -Indexes
DirectoryIndex index.html
AddType application/json .json
<IfModule mod_headers.c>
  Header set X-Content-Type-Options "nosniff"
  Header set Referrer-Policy "strict-origin-when-cross-origin"
  Header set X-Frame-Options "SAMEORIGIN"
</IfModule>
<IfModule mod_expires.c>
  ExpiresActive On
  ExpiresByType application/json "access plus 10 minutes"
  ExpiresByType text/css "access plus 1 hour"
  ExpiresByType application/javascript "access plus 1 hour"
  ExpiresByType image/png "access plus 1 week"
</IfModule>
H
echo "site/ pronto: $(find site -type f | wc -l) arquivos, $(du -sh site | cut -f1)"
