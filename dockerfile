FROM node:18-alpine

WORKDIR /app

COPY server/package*.json ./
RUN npm ci --only=production

COPY server/ ./server/
COPY client/ ./client/

EXPOSE 3000

CMD ["node", "server/server.js"]