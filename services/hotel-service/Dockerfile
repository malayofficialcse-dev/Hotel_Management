FROM node:20-alpine AS builder
WORKDIR /app/services/hotel-service
COPY services/hotel-service/package*.json ./
RUN npm ci
COPY services/hotel-service ./
COPY proto/operations.proto /app/proto/operations.proto
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app/services/hotel-service
COPY --from=builder /app/services/hotel-service/package*.json ./
COPY --from=builder /app/services/hotel-service/node_modules ./node_modules
COPY --from=builder /app/services/hotel-service/dist ./dist
COPY --from=builder /app/proto/operations.proto /app/proto/operations.proto
EXPOSE 8003 50053
CMD ["node", "dist/main.js"]
