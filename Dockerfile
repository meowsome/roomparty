FROM node:22-alpine

WORKDIR /app

# Install packages (for caching)
COPY package*.json ./
RUN npm ci

# Copy over source and build frontend
COPY . .
RUN npm run build

EXPOSE 8080

CMD ["node", "dist/server/main.js", "--production"]