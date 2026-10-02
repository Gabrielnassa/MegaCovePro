#!/usr/bin/env bash
# Monta "node-app/": o site dentro de um mini servidor Express, para hospedagens de app Node.js
# (ex.: Hostinger → "Faça upload dos arquivos do seu app"). Framework detectado: Express. Comando: npm start.
set -euo pipefail
cd "$(dirname "$0")/.."
bash tools/montar_site.sh >/dev/null
rm -rf node-app && mkdir -p node-app && mv site node-app/public && rm -f node-app/public/_headers node-app/public/.htaccess
cat > node-app/package.json <<'J'
{
  "name": "megacover-pro-elite",
  "version": "1.0.0",
  "private": true,
  "description": "MegaCover Pro Elite: site e painel (arquivos estáticos servidos pelo Express)",
  "main": "server.js",
  "type": "commonjs",
  "scripts": {
    "start": "node server.js",
    "build": "echo \"site pronto, nada para compilar\""
  },
  "engines": { "node": ">=18" },
  "dependencies": {
    "express": "^4.21.2"
  }
}
J
cat > node-app/server.js <<'S'
// MegaCover Pro Elite: entrega o site (pasta public/). Toda a lógica de planos fica no Supabase.
const express = require("express");
const path = require("path");
const app = express();
const PUB = path.join(__dirname, "public");

app.disable("x-powered-by");
app.use((req, res, next) => {
  res.set({"X-Content-Type-Options": "nosniff", "Referrer-Policy": "strict-origin-when-cross-origin", "X-Frame-Options": "SAMEORIGIN"});
  next();
});
// endereços limpos: /planos → planos.html, /conta → conta.html, /app → app.html
app.use(express.static(PUB, {
  extensions: ["html"],
  setHeaders(res, arquivo) {
    if (arquivo.endsWith(".json")) res.set("Cache-Control", "public, max-age=600");
    else if (!arquivo.endsWith(".html")) res.set("Cache-Control", "public, max-age=3600");
  },
}));
app.use((req, res) => res.status(404).sendFile(path.join(PUB, "index.html")));

const PORTA = process.env.PORT || 3000;
app.listen(PORTA, () => console.log("MegaCover no ar na porta " + PORTA));
S
echo "node-app/ pronto: $(find node-app -type f | wc -l) arquivos"
