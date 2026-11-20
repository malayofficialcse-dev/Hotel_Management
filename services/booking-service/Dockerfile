FROM golang:1.22-alpine AS builder
WORKDIR /src

COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -trimpath -ldflags="-s -w" -o /out/booking-service .

FROM alpine:3.20
RUN apk --no-cache add ca-certificates tzdata \
    && addgroup -S app && adduser -S -G app app
WORKDIR /app
COPY --from=builder --chown=app:app /out/booking-service ./booking-service
COPY --from=builder --chown=app:app /src/sql ./sql
USER app
EXPOSE 8005
HEALTHCHECK --interval=30s --timeout=3s --start-period=20s --retries=3 CMD wget -q -O /dev/null http://127.0.0.1:8005/health || exit 1
ENTRYPOINT ["./booking-service"]
