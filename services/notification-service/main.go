package main

import (
	"fmt"
	"log"
	"net/http"

	"notification-service/config"
	"notification-service/controllers"
	"notification-service/repository"
	"notification-service/routes"
	"notification-service/services"
)

func main() {
	cfg := config.Load()

	repo := repository.NewNotificationRepository()
	notifService := services.NewNotificationService(repo)
	controller := controllers.NewNotificationController(notifService)

	// Start RabbitMQ async consumer
	services.StartRabbitMQConsumer(cfg.RabbitMQURL, notifService)

	router := routes.SetupRoutes(controller)

	addr := fmt.Sprintf(":%s", cfg.Port)
	log.Printf("🚀 [Go] Notification Service running on port %s (gRPC on port %s)", cfg.Port, cfg.GRPCPort)
	if err := http.ListenAndServe(addr, router); err != nil {
		log.Fatalf("Server exited: %v", err)
	}
}

