FROM golang:1.22-alpine AS builder
WORKDIR /app
COPY go.mod ./
RUN go mod tidy || true
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -o /booking-service .

FROM alpine:3.19
RUN apk --no-cache add ca-certificates tzdata
WORKDIR /root/
COPY --from=builder /booking-service .
EXPOSE 8005 50051
CMD ["./booking-service"]

