# Stage 1: Install dependencies
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
COPY client/package.json client/
COPY server/package.json server/
RUN npm ci --production=false

# Stage 2: Build client (Astro SSR)
FROM deps AS build-client
COPY client/ client/
ARG API_URL=http://localhost:3000
ENV API_URL=$API_URL
RUN npm run build -w client

# Stage 3: Server image (Express API)
FROM node:20-alpine AS server
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/server/node_modules ./server/node_modules
COPY server/ server/
COPY package.json ./
EXPOSE 3000
CMD ["node", "server/src/index.js"]

# Stage 4: Client image (Astro SSR standalone)
FROM node:20-alpine AS client
WORKDIR /app
COPY --from=build-client /app/client/dist ./client/dist
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/client/node_modules ./client/node_modules
COPY client/package.json ./client/
EXPOSE 4321
ENV HOST=0.0.0.0
ENV PORT=4321
CMD ["node", "client/dist/server/entry.mjs"]
