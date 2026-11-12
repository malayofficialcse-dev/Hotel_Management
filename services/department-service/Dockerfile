FROM node:20-alpine AS builder
WORKDIR /app/services/department-service
COPY services/department-service/package*.json ./
RUN npm ci
COPY services/department-service ./
COPY proto/operations.proto /app/proto/operations.proto
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app/services/department-service
COPY --from=builder /app/services/department-service/package*.json ./
COPY --from=builder /app/services/department-service/node_modules ./node_modules
COPY --from=builder /app/services/department-service/dist ./dist
COPY --from=builder /app/proto/operations.proto /app/proto/operations.proto
EXPOSE 8012 50059
CMD ["node", "dist/main.js"]
