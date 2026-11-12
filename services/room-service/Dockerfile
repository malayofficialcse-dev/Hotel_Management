FROM node:20-alpine AS builder
WORKDIR /app/services/room-service
COPY services/room-service/package*.json ./
RUN npm ci
COPY services/room-service ./
COPY proto/operations.proto /app/proto/operations.proto
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app/services/room-service
COPY --from=builder /app/services/room-service/package*.json ./
COPY --from=builder /app/services/room-service/node_modules ./node_modules
COPY --from=builder /app/services/room-service/dist ./dist
COPY --from=builder /app/proto/operations.proto /app/proto/operations.proto
EXPOSE 8004 50054
CMD ["node", "dist/main.js"]
