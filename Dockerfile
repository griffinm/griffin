# Stage 1: Build the application
FROM node:20-alpine AS builder

# Set the working directory
WORKDIR /app

RUN npm install -g nx

# Install dependencies
COPY package.json package-lock.json ./
RUN npm ci

# Copy the Nx workspace and backend app source
COPY . .

# Build the backend application
RUN nx reset
RUN npx nx run-many --target=build

# Stage 2: Production image
FROM node:20-alpine AS runner

# Set environment variables
ENV NODE_ENV=production

# Set the working directory
WORKDIR /app

# Copy the built application from the builder stage
COPY --from=builder /app/dist/apps/ ./dist/apps/

# Install only production dependencies
COPY package.json package-lock.json ./
RUN npm ci --production

# Expose the port your app runs on
EXPOSE 3000

# Start the backend application
CMD ["node", "/app/dist/apps/api/main.js"]
