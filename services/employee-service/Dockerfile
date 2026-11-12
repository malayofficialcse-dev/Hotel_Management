FROM node:20-alpine AS builder
WORKDIR /app/services/employee-service
COPY services/employee-service/package*.json ./
RUN npm ci
COPY services/employee-service/prisma ./prisma
RUN npx prisma generate
COPY services/employee-service/tsconfig.json ./tsconfig.json
COPY services/employee-service/src ./src
COPY proto/operations.proto /app/proto/operations.proto
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app/services/employee-service
COPY --from=builder /app/services/employee-service/package*.json ./
COPY --from=builder /app/services/employee-service/node_modules ./node_modules
COPY --from=builder /app/services/employee-service/dist ./dist
COPY --from=builder /app/services/employee-service/prisma ./prisma
COPY --from=builder /app/proto/operations.proto /app/proto/operations.proto
EXPOSE 8007 50057
CMD ["node", "dist/main.js"]
