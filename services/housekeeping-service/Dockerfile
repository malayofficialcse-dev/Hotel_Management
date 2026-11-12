FROM node:20-alpine AS builder
WORKDIR /app/services/housekeeping-service
COPY services/housekeeping-service/package*.json ./
RUN npm ci
COPY services/housekeeping-service ./
COPY proto/operations.proto /app/proto/operations.proto
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app/services/housekeeping-service
COPY --from=builder /app/services/housekeeping-service/package*.json ./
COPY --from=builder /app/services/housekeeping-service/node_modules ./node_modules
COPY --from=builder /app/services/housekeeping-service/dist ./dist
COPY --from=builder /app/proto/operations.proto /app/proto/operations.proto
EXPOSE 8008 50058
CMD ["node", "dist/main.js"]
