ARG NODE_VERSION=20

FROM node:${NODE_VERSION}-alpine AS alpine
RUN apk update && \
    apk add --no-cache libc6-compat python3 make g++ git && \
    rm -rf /var/cache/apk/* /tmp/* || true
RUN corepack enable

FROM alpine AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN --mount=type=cache,id=pnpm,target=~/.pnpm-store pnpm install --frozen-lockfile

FROM alpine AS builder
ARG APP_VERSION
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN git fetch --tags --unshallow 2>/dev/null || git fetch --tags 2>/dev/null || true && \
    AUTO_VERSION=$(git describe --tags --always --long 2>/dev/null | \
    sed -E 's/^v?([0-9]+\.[0-9]+\.[0-9]+)-[0-9]+-g([a-f0-9]{7}).*/\1+\2/' | \
    sed 's/^v//' || \
    git rev-parse --short HEAD 2>/dev/null | head -c 7 || \
    echo "unknown") && \
    VERSION="${APP_VERSION:-$AUTO_VERSION}" && \
    VITE_APP_VERSION="$VERSION" pnpm build

FROM alpine AS runner
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
USER nextjs
WORKDIR /app
ENV NODE_ENV=production

COPY --chown=nextjs:nodejs --from=builder /app/ ./

ARG PORT=3000
ENV PORT=${PORT}
EXPOSE ${PORT}

CMD ["sh", "-c", "if [ -n \"$POSTGRES_URL\" ]; then pnpm db:migrate; fi && pnpm start"]
