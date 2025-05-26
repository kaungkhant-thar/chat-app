# Base stage: install deps, build both apps
FROM node:slim AS base

ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_METERED_API_KEY

ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_METERED_API_KEY=$NEXT_PUBLIC_METERED_API_KEY

RUN npm install -g pnpm

WORKDIR /app

COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY apps/web/package.json ./apps/web/
COPY libs/shared-schemas/package.json ./libs/shared-schemas/

RUN pnpm install

COPY . .

RUN pnpm build:web


# Frontend runtime stage
FROM node:slim AS web

RUN npm install -g pnpm

ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_METERED_API_KEY

ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_METERED_API_KEY=$NEXT_PUBLIC_METERED_API_KEY
ENV NODE_ENV=production

WORKDIR /app

COPY --from=base /app/package.json .
COPY --from=base /app/node_modules /app/node_modules
COPY --from=base /app/apps/web /app/apps/web

EXPOSE 3000

WORKDIR /app/apps/web

CMD ["pnpm", "start"]
