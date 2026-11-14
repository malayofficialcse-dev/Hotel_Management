package config

import (
	"fmt"
	"os"
	"strconv"
)

// Config holds all application configuration
type Config struct {
	Port              string
	GRPCPort          string
	DatabaseURL       string
	RedisURL          string
	RabbitMQURL       string
	AuthServiceURL    string
	PaymentServiceURL string
	HotelServiceURL   string
}

// Load reads environment variables and returns a Config.
// It panics if any mandatory variable is missing.
func Load() *Config {
	cfg := &Config{
		Port:              getEnv("PORT", "8005"),
		GRPCPort:          getEnv("GRPC_PORT", "50051"),
		DatabaseURL:       mustEnv("DATABASE_URL"),
		RedisURL:          mustEnv("REDIS_URL"),
		RabbitMQURL:       getEnv("RABBITMQ_URL", "amqp://hotel_admin:hotel_rabbit_pass@localhost:5672"),
		AuthServiceURL:    mustEnv("AUTH_SERVICE_URL"),
		PaymentServiceURL: mustEnv("PAYMENT_SERVICE_URL"),
		HotelServiceURL:   getEnv("ROOM_SERVICE_URL", getEnv("HOTEL_SERVICE_URL", "http://localhost:8004")),
	}
	return cfg
}

// getEnv returns the value of the environment variable or a fallback.
func getEnv(key, fallback string) string {
	if v, ok := os.LookupEnv(key); ok && v != "" {
		return v
	}
	return fallback
}

// mustEnv panics when the required variable is unset or empty.
func mustEnv(key string) string {
	v := os.Getenv(key)
	if v == "" {
		panic(fmt.Sprintf("required environment variable %q is not set", key))
	}
	return v
}

// getEnvInt parses an integer env var with a fallback.
func getEnvInt(key string, fallback int) int {
	raw := os.Getenv(key)
	if raw == "" {
		return fallback
	}
	v, err := strconv.Atoi(raw)
	if err != nil {
		return fallback
	}
	return v
}
