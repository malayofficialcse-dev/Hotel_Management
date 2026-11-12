FROM node:20-alpine AS builder
WORKDIR /app/services/api-gateway
COPY services/api-gateway/package*.json ./
RUN npm install
COPY services/api-gateway ./
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app/services/api-gateway
COPY --from=builder /app/services/api-gateway/package*.json ./
COPY --from=builder /app/services/api-gateway/node_modules ./node_modules
COPY --from=builder /app/services/api-gateway/dist ./dist
EXPOSE 8000
CMD ["node", "dist/main.js"]

