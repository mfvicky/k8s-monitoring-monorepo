FROM node:20-alpine AS builder
WORKDIR /app
RUN apk add --no-cache python3 make g++
RUN corepack enable && corepack prepare pnpm@latest --activate

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml tsconfig.base.json ./
COPY services/service-b ./services/service-b

RUN pnpm install --frozen-lockfile
RUN pnpm --filter service-b build

FROM node:20-alpine AS runner
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@latest --activate

ARG PORT=3001
ARG NODE_ENV=production

ENV PORT=${PORT}
ENV NODE_ENV=${NODE_ENV}

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY services/service-b/package.json ./services/service-b/

RUN pnpm install --prod --frozen-lockfile
COPY --from=builder /app/services/service-b/dist ./services/service-b/dist

EXPOSE ${PORT}

CMD ["node", "services/service-b/dist/index.js"]