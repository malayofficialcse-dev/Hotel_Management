package main

import (
	"fmt"
	"log"
	"net/http"

	"analytics-service/config"
	"analytics-service/controllers"
	"analytics-service/repository"
	"analytics-service/routes"
	"analytics-service/services"
)

func main() {
	cfg := config.Load()

	repo := repository.NewAnalyticsRepository()
	analyticsService := services.NewAnalyticsService(repo)
	controller := controllers.NewAnalyticsController(analyticsService)

	// Start RabbitMQ metrics consumer
	services.StartRabbitMQConsumer(cfg.RabbitMQURL, repo)

	router := routes.SetupRoutes(controller)

	addr := fmt.Sprintf(":%s", cfg.Port)
	log.Printf("🚀 [Go] Analytics Service running on port %s", cfg.Port)
	if err := http.ListenAndServe(addr, router); err != nil {
		log.Fatalf("Server exited: %v", err)
	}
}

