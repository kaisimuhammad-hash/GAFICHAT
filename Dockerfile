FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# Build frontend assets for production
RUN npm run build

ENV NODE_ENV=production
ENV PORT=8787

EXPOSE 8787

CMD ["node", "server/index.js"]
