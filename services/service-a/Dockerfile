FROM node:20-alpine
WORKDIR /app

# Lock pnpm to your host's exact version (9.4.0)
RUN corepack enable && corepack prepare pnpm@9.4.0 --activate

# Copy workspace configuration and base setup
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml tsconfig.base.json ./

# Copy the service code (including src/)
COPY services/service-a ./services/service-a

# Install all dependencies (including devDependencies like tsx)
RUN pnpm install --frozen-lockfile --unsafe-perm

ARG PORT=3000
ARG NODE_ENV=production

ENV PORT=${PORT}
ENV NODE_ENV=${NODE_ENV}

EXPOSE ${PORT}

# Run TypeScript directly using tsx via your service dev/start script
CMD ["pnpm", "--filter", "service-a", "dev"]