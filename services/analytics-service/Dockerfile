FROM golang:1.22-alpine AS builder
WORKDIR /app
COPY go.mod ./
RUN go mod tidy || true
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -o /analytics-service .

FROM alpine:3.19
RUN apk --no-cache add ca-certificates tzdata
WORKDIR /root/
COPY --from=builder /analytics-service .
EXPOSE 8011
CMD ["./analytics-service"]

