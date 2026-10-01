#!/usr/bin/env bash
# Calcula os valores que você NÃO precisa inventar (usado pelos workflows do GitHub).
#  - TAREFA_TOKEN e ASAAS_WEBHOOK_TOKEN: derivados da senha do banco (SUPABASE_DB_PASSWORD), sempre iguais nos dois workflows
#  - MEGACOVER_API_URL: a partir de SUPABASE_PROJECT_REF
#  - site: a partir de DOMINIO (ex.: megacover.com.br); e-mails: EMAIL_DOMINIO (ex.: nassatech.com.br) ou DOMINIO
# Qualquer um deles pode ser trocado criando o segredo com o mesmo nome no GitHub.
set -euo pipefail
saida="${GITHUB_ENV:-/dev/stdout}"
deriva() { printf '%s' "megacover:$1:${SUPABASE_DB_PASSWORD:-}" | sha256sum | cut -c1-48 | sed -E 's/(.)\1+/\1/g'; }   # sem caracteres repetidos em sequência
put() { local k="$1" v="$2"; [ -z "$v" ] && return 0; [ "${3:-}" = "segredo" ] && echo "::add-mask::$v"; echo "$k=$v" >> "$saida"; }

# chaves dos serviços passam adiante para os próximos passos (o GitHub já esconde seus valores no log)
put ASAAS_API_KEY "${ASAAS_API_KEY:-}" segredo
put RESEND_API_KEY "${RESEND_API_KEY:-}" segredo
if [ -n "${SUPABASE_DB_PASSWORD:-}" ]; then
  put TAREFA_TOKEN "${TAREFA_TOKEN:-$(deriva tarefa)}" segredo
  put ASAAS_WEBHOOK_TOKEN "${ASAAS_WEBHOOK_TOKEN:-$(deriva asaas)}" segredo
fi
[ -n "${SUPABASE_PROJECT_REF:-}" ] && put MEGACOVER_API_URL "${MEGACOVER_API_URL:-https://$SUPABASE_PROJECT_REF.supabase.co/functions/v1/api}"
put ASAAS_AMBIENTE "${ASAAS_AMBIENTE:-sandbox}"
if [ -n "${RESEND_API_KEY:-}" ]; then put EMAIL_PROVEDOR "${EMAIL_PROVEDOR:-resend}"; else put EMAIL_PROVEDOR "${EMAIL_PROVEDOR:-teste}"; fi
if [ -n "${DOMINIO:-}" ]; then
  d="${DOMINIO#https://}"; d="${d#http://}"; d="${d#www.}"; d="${d%/}"
  put DOMINIO "$d"
  put SITE_URL "https://$d"
  put URL_REDIRECT "https://$d/**"
  put URL_REDIRECT_WWW "https://www.$d/**"
fi
# domínio dos e-mails automáticos: EMAIL_DOMINIO (ex.: nassatech.com.br) ou, se não houver, o do site
e="${EMAIL_DOMINIO:-${DOMINIO:-}}"; e="${e#https://}"; e="${e#http://}"; e="${e#www.}"; e="${e%/}"
if [ -n "$e" ]; then
  put EMAIL_DOMINIO "$e"
  put EMAIL_AVISOS "avisos@$e"
  put EMAIL_REMETENTE "${EMAIL_REMETENTE:-MegaCover <avisos@$e>}"
  put SUPORTE_EMAIL "${SUPORTE_EMAIL:-suporte@$e}"
fi
