
# ==========================================
# ETAPA 1: Dependencias
# ==========================================
FROM node:24-bookworm-slim AS deps

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 make g++ \
    && rm -rf /var/lib/apt/lists/*

RUN corepack enable

COPY package.json pnpm-lock.yaml ./

RUN pnpm install --frozen-lockfile


# ==========================================
# ETAPA 2: Compilacion
# ==========================================
FROM deps AS build

COPY . .

RUN pnpm build && pnpm prune --prod --ignore-scripts


# ==========================================
# ETAPA 3: Imagen final
# ==========================================
FROM node:24-bookworm-slim AS final

WORKDIR /app

ENV NODE_ENV=production

COPY --from=build /app/package.json ./package.json
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist

# Recursos originales de las semillas
COPY --from=build /app/src/seeds/media ./src/seeds/media

# Base inicial compartida
COPY --from=build /app/semilla/api-inicial.sqlite ./semilla/api-inicial.sqlite

# Script de inicio
COPY docker-entrypoint.sh ./docker-entrypoint.sh

# Carpetas para datos y archivos
RUN mkdir -p /app/datos /app/archivos \
    && chown -R node:node /app/datos /app/archivos

USER node

EXPOSE 3000

HEALTHCHECK --interval=5s --timeout=3s --start-period=20s --retries=10 \
  CMD node -e "fetch('http://127.0.0.1:3000/salud').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["sh", "./docker-entrypoint.sh"]
