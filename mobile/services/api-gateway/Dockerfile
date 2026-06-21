FROM node:20-alpine

LABEL maintainer="TSN Team"
LABEL service="api-gateway"

WORKDIR /app

# Install dependencies first (layer caching)
COPY package*.json ./
RUN npm install --omit=dev

# Copy source
COPY . .

# Non-root user for security
RUN addgroup -S tsn && adduser -S tsn -G tsn
USER tsn

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=20s --retries=3 \
  CMD wget -qO- http://localhost:3000/health || exit 1

CMD ["node", "index.js"]
