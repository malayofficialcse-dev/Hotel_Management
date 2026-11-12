package repository

import (
	"sync"
	"time"

	"analytics-service/models"
)

type AnalyticsRepository struct {
	mu      sync.RWMutex
	metrics *models.DashboardMetrics
}

func NewAnalyticsRepository() *AnalyticsRepository {
	return &AnalyticsRepository{
		metrics: &models.DashboardMetrics{
			MonthlyRevenue:    []models.MonthlyRevenue{},
			OccupancyByHotel:  []models.HotelOccupancy{},
			UpdatedAt: time.Now(),
		},
	}
}

func (r *AnalyticsRepository) GetLiveMetrics() *models.DashboardMetrics {
	r.mu.RLock()
	defer r.mu.RUnlock()

	// Return a copy
	metricsCopy := *r.metrics
	return &metricsCopy
}

func (r *AnalyticsRepository) RecordBooking(amount float64) {
	r.mu.Lock()
	defer r.mu.Unlock()

	r.metrics.TotalBookings++
	r.metrics.ActiveGuests += 2
	if amount > 0 {
		r.metrics.TotalRevenue += amount
		if len(r.metrics.MonthlyRevenue) > 0 {
			r.metrics.MonthlyRevenue[len(r.metrics.MonthlyRevenue)-1].Revenue += amount
		}
	}
	r.metrics.UpdatedAt = time.Now()
}

func (r *AnalyticsRepository) RecordRevenue(amount float64) {
	r.mu.Lock()
	defer r.mu.Unlock()

	if amount > 0 {
		r.metrics.TotalRevenue += amount
		if len(r.metrics.MonthlyRevenue) > 0 {
			r.metrics.MonthlyRevenue[len(r.metrics.MonthlyRevenue)-1].Revenue += amount
		}
		r.metrics.UpdatedAt = time.Now()
	}
}
