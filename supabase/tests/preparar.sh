#!/usr/bin/env bash
# Cria do zero o banco de teste local (Postgres comum + stub do Auth + migrações do projeto).
# Uso: PGHOST=/tmp PGPORT=54329 bash supabase/tests/preparar.sh
set -euo pipefail
cd "$(dirname "$0")"
node ../../tools/sincronizar.mjs --verificar
DB=${TESTE_DB:-megacover_teste}
dropdb -U postgres --if-exists "$DB" >/dev/null
createdb -U postgres "$DB"
psql -U postgres -d "$DB" -q -v ON_ERROR_STOP=1 -f auth_stub.sql >/dev/null
for m in ../migrations/*.sql; do psql -U postgres -d "$DB" -q -v ON_ERROR_STOP=1 -f "$m" 2>&1 | grep -v NOTICE || true; done
echo "banco $DB pronto"
