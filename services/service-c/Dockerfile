FROM node:20-alpine AS builder
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@latest --activate

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml tsconfig.base.json ./
COPY services/service-c ./services/service-c

RUN pnpm install --frozen-lockfile
RUN pnpm --filter service-c build

FROM node:20-alpine AS runner
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@latest --activate

ARG PORT=3002
ARG NODE_ENV=production

ENV PORT=${PORT}
ENV NODE_ENV=${NODE_ENV}

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY services/service-c/package.json ./services/service-c/

RUN pnpm install --prod --frozen-lockfile
COPY --from=builder /app/services/service-c/dist ./services/service-c/dist

EXPOSE ${PORT}

CMD ["node", "services/service-c/dist/index.js"]