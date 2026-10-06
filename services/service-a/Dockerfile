FROM node:20-alpine AS builder
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@latest --activate

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml tsconfig.base.json ./
COPY services/service-a ./services/service-a

RUN pnpm install --frozen-lockfile
RUN pnpm --filter service-a build

FROM node:20-alpine AS runner
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@latest --activate

# Declare build arguments with default fallbacks
ARG PORT=3000
ARG NODE_ENV=production

# Assign to environment variables
ENV PORT=${PORT}
ENV NODE_ENV=${NODE_ENV}

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY services/service-a/package.json ./services/service-a/

RUN pnpm install --prod --frozen-lockfile
COPY --from=builder /app/services/service-a/dist ./services/service-a/dist

EXPOSE ${PORT}

CMD ["node", "services/service-a/dist/index.js"]