FROM node:slim

ENV COREPACK_ENABLE=1
ENV NODE_ENV=production

WORKDIR /app

COPY ../../pnpm-workspace.yaml ../../pnpm-lock.yaml ../../package.json ./
COPY ../../apps/server/package.json ./apps/server/
COPY ../../libs/shared-schemas/package.json ./libs/shared-schemas/
COPY ../../apps/server/prisma ./apps/server/prisma

RUN corepack enable && pnpm install --frozen-lockfile

COPY ../../apps/server ./apps/server
COPY ../../libs/shared-schemas ./libs/shared-schemas

RUN pnpm --filter server build

EXPOSE 4000
WORKDIR /app/apps/server

CMD ["pnpm", "start:prod"]
