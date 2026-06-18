FROM node:20-alpine
LABEL service="location-service"
WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev
COPY . .
RUN addgroup -S tsn && adduser -S tsn -G tsn
USER tsn
EXPOSE 3003
HEALTHCHECK --interval=30s --timeout=10s --start-period=20s --retries=3 \
  CMD wget -qO- http://localhost:3003/health || exit 1
CMD ["node", "index.js"]
