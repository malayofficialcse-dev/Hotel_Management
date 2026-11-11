package main

import (
	"fmt"
	"log"
	"log/slog"
	"net/http"
	"os"

	"booking-service/config"
	"booking-service/controllers"
	"booking-service/repository"
	"booking-service/routes"
	"booking-service/services"
)

func main() {
	cfg := config.Load()
	logger := slog.New(slog.NewJSONHandler(os.Stdout, nil))

	db, err := config.InitDB(cfg.DatabaseURL)
	if err != nil {
		log.Printf("⚠️ PostgreSQL warning: %v", err)
	}
	if db != nil {
		defer db.Close()
	}

	rdb, err := config.InitRedis(cfg.RedisURL)
	if err != nil {
		log.Printf("⚠️ Redis warning: %v", err)
	}

	publisher := services.NewRabbitMQPublisher(cfg.RabbitMQURL, logger)
	defer publisher.Close()

	bookingRepo := repository.NewBookingRepository(db)
	lockService := services.NewLockService(rdb)
	bookingService := services.NewBookingService(bookingRepo, lockService, publisher, cfg.HotelServiceURL, logger)
	bookingController := controllers.NewBookingController(bookingService)

	router := routes.SetupRoutes(bookingController, cfg.AuthServiceURL)

	addr := fmt.Sprintf(":%s", cfg.Port)
	log.Printf("🚀 [Go] Booking Engine Service running on HTTP port %s (gRPC port %s)", cfg.Port, cfg.GRPCPort)
	if err := http.ListenAndServe(addr, router); err != nil {
		log.Fatalf("Server exited: %v", err)
	}
}

