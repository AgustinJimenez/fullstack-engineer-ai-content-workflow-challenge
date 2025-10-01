# Development stage
FROM node:18.20-alpine3.18

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies
RUN npm ci --legacy-peer-deps || npm install --legacy-peer-deps

# Copy all source files
COPY . .

# Build the application
RUN echo "Building TypeScript..." && \
    npm run build && \
    echo "Build complete, checking output..." && \
    ls -la dist/ && \
    echo "Checking for server.js..." && \
    ls -la dist/src/server.js

# Expose port
EXPOSE 8080

# Start the application
CMD ["npm", "start"]