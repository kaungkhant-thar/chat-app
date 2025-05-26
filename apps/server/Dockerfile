FROM node:slim AS base


RUN npm install -g pnpm

WORKDIR /app

COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY apps/server/package.json ./apps/server/
COPY libs/shared-schemas/package.json ./libs/shared-schemas/
COPY apps/server/prisma ./apps/server/prisma

RUN pnpm install

COPY . .

RUN pnpm build:server 

FROM node:slim AS server

WORKDIR /app

RUN npm install -g pnpm

COPY --from=base /app/package.json .
COPY --from=base /app/node_modules /app/node_modules
COPY --from=base /app/apps/server /app/apps/server
COPY --from=base /app/libs/shared-schemas /app/libs/shared-schemas

EXPOSE 4000

WORKDIR /app/apps/server

CMD ["pnpm", "start:prod"]

