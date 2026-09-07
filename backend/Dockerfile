FROM node:20-alpine AS builder

WORKDIR /app

# Install system dependencies if required
RUN apk add --no-cache openssl

COPY package*.json ./
COPY prisma ./prisma/

RUN npm install

COPY . .

RUN npm run build

FROM node:20-alpine AS runner

WORKDIR /app

RUN apk add --no-cache openssl

ENV NODE_ENV=production
ENV PORT=5000

COPY package*.json ./
COPY prisma ./prisma/

RUN npm install --omit=dev

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/scripts ./scripts
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

# Uploads volume directory
RUN mkdir -p /app/uploads

EXPOSE 5000

CMD ["node", "dist/server.js"]
