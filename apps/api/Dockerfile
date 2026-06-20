FROM node:24-alpine

RUN corepack enable && corepack prepare pnpm@9.0.0 --activate

WORKDIR /app

# Copy workspace config and root package.json for pnpm workspace resolution
COPY pnpm-workspace.yaml ./
COPY package.json ./
COPY pnpm-lock.yaml ./
COPY tsconfig.base.json ./

# Copy package.json files for all workspace packages used by @helux/api
COPY apps/api/package.json ./apps/api/package.json
COPY packages/types/package.json ./packages/types/package.json
COPY packages/ai/package.json ./packages/ai/package.json
COPY packages/genetics/package.json ./packages/genetics/package.json
COPY packages/health/package.json ./packages/health/package.json

# Install all dependencies (frozen for reproducibility)
RUN pnpm install --frozen-lockfile

# Copy source files for the API and its workspace dependencies
# (packages/* ship TypeScript source only — no build step — consumed at
# runtime via tsx, same as the local `pnpm dev` workflow)
COPY apps/api/ ./apps/api/
COPY packages/types/ ./packages/types/
COPY packages/ai/ ./packages/ai/
COPY packages/genetics/ ./packages/genetics/
COPY packages/health/ ./packages/health/

WORKDIR /app/apps/api

ENV NODE_ENV=production

EXPOSE 3001

CMD ["node_modules/.bin/tsx", "src/index.ts"]
