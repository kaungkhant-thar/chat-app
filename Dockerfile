# ---------- Base Stage ----------
    FROM node:slim AS base

    # Install pnpm globally
    RUN npm install -g pnpm
    
    WORKDIR /app
    
    # Copy necessary files for dependency installation
    COPY pnpm-workspace.yaml ./
    COPY pnpm-lock.yaml ./
    COPY package.json ./
    
    # Copy app-specific package.json files
    COPY apps/server/package.json ./apps/server/
    COPY apps/web/package.json ./apps/web/
    COPY libs/shared-schemas/package.json ./libs/shared-schemas/
    
    # Copy the Prisma schema for the server
    COPY apps/server/prisma ./apps/server/prisma
    
    # Install dependencies in the base stage (including next)
    RUN pnpm install
    
    # Copy the rest of the application code after installing dependencies
    COPY . .
    
    # Build both server and web apps in the base stage
    RUN pnpm build:server && pnpm build:web
    
    # ---------- Web Output Stage ----------
    FROM node:slim AS web
    
    WORKDIR /app
    
    # Install pnpm globally in the web stage
    RUN npm install -g pnpm
    
    # Copy necessary files from the base stage
    COPY --from=base /app/package.json .
    COPY --from=base /app/node_modules /app/node_modules
    COPY --from=base /app/apps/web /app/apps/web
    
    # Set production environment and expose port
    ENV NODE_ENV=production
    EXPOSE 3000
    
    # Set the working directory to /app/apps/web to run `pnpm start` correctly
    WORKDIR /app/apps/web
    
    # Run the Next.js app with the correct start command
    CMD ["pnpm", "start"]
    

    FROM node:slim AS server

    WORKDIR /app
    
    # Install PNPM globally for the server app
    RUN npm install -g pnpm
    
    # Copy necessary files from the base stage
    COPY --from=base /app/package.json .
    COPY --from=base /app/node_modules /app/node_modules
    COPY --from=base /app/apps/server /app/apps/server
    
    # Set production environment and expose port
    ENV NODE_ENV=production
    EXPOSE 4000
    
    # Set working directory for the server and run the server app
    WORKDIR /app/apps/server
    
    # Command to run the server app
    CMD ["pnpm", "start:prod"]