package config

import (
	"os"
)

type Config struct {
	Port        string
	GRPCPort    string
	RabbitMQURL string
	DatabaseURL string
	MongoDBURI  string
}

func Load() *Config {
	port := os.Getenv("PORT")
	if port == "" {
		port = "8010"
	}
	grpcPort := os.Getenv("GRPC_PORT")
	if grpcPort == "" {
		grpcPort = "50052"
	}
	rabbitURL := os.Getenv("RABBITMQ_URL")
	if rabbitURL == "" {
		rabbitURL = "amqp://hotel_admin:hotel_rabbit_pass@localhost:5672"
	}
	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		dbURL = "postgres://postgres:postgrespassword@localhost:5432/hotel_notifications_db?sslmode=disable"
	}
	mongoURI := os.Getenv("MONGODB_URI")
	if mongoURI == "" {
		mongoURI = "mongodb://localhost:27017/hotel_notifications"
	}

	return &Config{
		Port:        port,
		GRPCPort:    grpcPort,
		RabbitMQURL: rabbitURL,
		DatabaseURL: dbURL,
		MongoDBURI:  mongoURI,
	}
}

