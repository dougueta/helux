# Stage 1: Builder
FROM node:24-alpine AS builder

RUN corepack enable && corepack prepare pnpm@9.0.0 --activate

WORKDIR /app

# Copy workspace config and root package.json for pnpm workspace resolution
COPY pnpm-workspace.yaml ./
COPY package.json ./
COPY pnpm-lock.yaml ./

# Copy package.json files for all workspace packages used by @helux/api
COPY apps/api/package.json ./apps/api/package.json
COPY packages/types/package.json ./packages/types/package.json
COPY packages/ai/package.json ./packages/ai/package.json
COPY packages/genetics/package.json ./packages/genetics/package.json
COPY packages/health/package.json ./packages/health/package.json

# Install all dependencies (frozen for reproducibility)
RUN pnpm install --frozen-lockfile

# Copy source files for the API and its workspace dependencies
COPY apps/api/ ./apps/api/
COPY packages/types/ ./packages/types/
COPY packages/ai/ ./packages/ai/
COPY packages/genetics/ ./packages/genetics/
COPY packages/health/ ./packages/health/

# Build the API
RUN pnpm --filter @helux/api build

# Stage 2: Runner
FROM node:24-alpine AS runner

WORKDIR /app/apps/api

# Copy node_modules from builder (includes workspace symlinks)
COPY --from=builder /app/node_modules /app/node_modules

# Copy workspace packages (needed for runtime resolution)
COPY --from=builder /app/packages /app/packages

# Copy the built API dist and static data
COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/apps/api/package.json ./package.json
COPY --from=builder /app/apps/api/data ./data

ENV NODE_ENV=production

EXPOSE 3001

CMD ["node", "dist/index.js"]
