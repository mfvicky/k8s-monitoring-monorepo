FROM node:20-alpine
WORKDIR /app

RUN apk add --no-cache python3 make g++
# Lock pnpm to your host's exact version (9.4.0)
RUN corepack enable && corepack prepare pnpm@9.4.0 --activate

# Copy workspace configuration and base setup
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml tsconfig.base.json ./

# Copy the service code
COPY services/service-b ./services/service-b

# Install all dependencies (including devDependencies like tsx)
RUN pnpm install --frozen-lockfile --unsafe-perm

ARG PORT=3001
ARG NODE_ENV=production

ENV PORT=${PORT}
ENV NODE_ENV=${NODE_ENV}

EXPOSE ${PORT}

# Run TypeScript directly using tsx
CMD ["pnpm", "--filter", "service-b", "dev"]