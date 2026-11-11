package controllers

import (
	"encoding/json"
	"net/http"

	"notification-service/models"
	"notification-service/services"
)

type NotificationController struct {
	service *services.NotificationService
}

func NewNotificationController(service *services.NotificationService) *NotificationController {
	return &NotificationController{service: service}
}

func (c *NotificationController) HealthCheck(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(map[string]interface{}{
		"status":  "UP",
		"service": "notification-service",
		"engine":  "Go/Chi + RabbitMQ Worker",
		"port":    8010,
	})
}

func (c *NotificationController) SendNotification(w http.ResponseWriter, r *http.Request) {
	var req models.SendRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		_ = json.NewEncoder(w).Encode(map[string]interface{}{"success": false, "message": "Invalid payload"})
		return
	}

	res, err := c.service.Send(&req)
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		_ = json.NewEncoder(w).Encode(map[string]interface{}{"success": false, "message": err.Error()})
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	_ = json.NewEncoder(w).Encode(map[string]interface{}{"success": true, "data": res})
}

func (c *NotificationController) GetHistory(w http.ResponseWriter, r *http.Request) {
	history := c.service.GetAll()
	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(map[string]interface{}{"success": true, "count": len(history), "data": history})
}

