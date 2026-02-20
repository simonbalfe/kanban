FROM oven/bun:1-alpine AS base
WORKDIR /app

FROM base AS deps
COPY package.json bun.lock* ./
RUN bun install --frozen-lockfile || bun install

FROM base AS runner
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NODE_ENV=production
EXPOSE 3001

USER bun
CMD ["bun", "run", "src/index.ts"]
