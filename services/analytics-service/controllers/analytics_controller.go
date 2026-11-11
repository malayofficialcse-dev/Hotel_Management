package controllers

import (
	"encoding/json"
	"net/http"

	"analytics-service/services"
)

type AnalyticsController struct {
	service *services.AnalyticsService
}

func NewAnalyticsController(service *services.AnalyticsService) *AnalyticsController {
	return &AnalyticsController{service: service}
}

func (c *AnalyticsController) HealthCheck(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(map[string]interface{}{
		"status":  "UP",
		"service": "analytics-service",
		"engine":  "Go/Chi",
		"port":    8011,
	})
}

func (c *AnalyticsController) GetOverview(w http.ResponseWriter, r *http.Request) {
	data := c.service.GetOverview()
	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(map[string]interface{}{"success": true, "data": data})
}

