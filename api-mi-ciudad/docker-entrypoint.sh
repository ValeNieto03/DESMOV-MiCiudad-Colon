
#!/bin/sh
set -eu

echo "=========================================="
echo " Iniciando API Mi Ciudad"
echo "=========================================="

mkdir -p /app/datos

if [ ! -f /app/datos/api.sqlite ]; then
  echo "No existe una base local."
  echo "Copiando la base inicial compartida..."

  if [ ! -f /app/semilla/api-inicial.sqlite ]; then
    echo "ERROR: No se encontro la base inicial."
    exit 1
  fi

  cp /app/semilla/api-inicial.sqlite /app/datos/api.sqlite

  echo "Base inicial copiada correctamente."
else
  echo "Se encontro una base local existente."
  echo "Se conservaran sus datos."
fi

echo "Iniciando servidor NestJS..."

exec node dist/src/main.js
