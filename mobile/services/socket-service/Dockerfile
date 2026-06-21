FROM node:20-alpine
LABEL service="socket-service"
WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev
COPY . .
RUN addgroup -S tsn && adduser -S tsn -G tsn
USER tsn
EXPOSE 3006
HEALTHCHECK --interval=30s --timeout=10s --start-period=20s --retries=3 \
  CMD wget -qO- http://localhost:3006/health || exit 1
CMD ["node", "index.js"]
