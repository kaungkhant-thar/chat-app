FROM node:slim

ENV COREPACK_ENABLE=1
ENV NODE_ENV=production

ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_METERED_API_KEY

ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_METERED_API_KEY=$NEXT_PUBLIC_METERED_API_KEY

WORKDIR /app

COPY ../../pnpm-workspace.yaml ../../pnpm-lock.yaml ../../package.json ./
COPY ../../apps/web/package.json ./apps/web/
COPY ../../libs/shared-schemas/package.json ./libs/shared-schemas/

RUN corepack enable && pnpm install --frozen-lockfile

COPY ../../apps/web ./apps/web
COPY ../../libs/shared-schemas ./libs/shared-schemas

RUN pnpm --filter web build

EXPOSE 3000
WORKDIR /app/apps/web

CMD ["pnpm", "start"]
