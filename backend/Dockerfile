# --- Stage 1: Builder ---
FROM node:18-alpine AS builder

WORKDIR /usr/src/app

# Copy package.json and package-lock.json
COPY package*.json ./backend

# Install ALL dependencies (including devDependencies for building)
RUN npm ci

# Copy all application source code
COPY . .

# Build the TypeScript code into JavaScript
RUN npm run build

# --- Stage 2: Production Runtime ---
FROM node:18-alpine AS runner

WORKDIR /usr/src/app

# Copy package.json and package-lock.json (only for production dependencies)
COPY package*.json ./backend

# Install only production dependencies
RUN npm ci --omit=dev

# Copy only the built application from the builder stage
COPY --from=builder /usr/src/app/dist ./dist
COPY --from=builder /usr/src/app/src/config ./src/config # Copy config if it's not in dist

# The app is already built, so we just need to run it.
# The CMD will be set back to "npm start" in the docker-compose.yml
