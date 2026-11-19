FROM node:22-alpine AS build
WORKDIR /app
COPY services/operations-service/package*.json ./
RUN npm install --no-audit --no-fund
COPY services/operations-service ./
RUN npx prisma generate --schema prisma/schema.prisma && npm run build

FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/package*.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma
EXPOSE 8020
CMD ["npm", "start"]
