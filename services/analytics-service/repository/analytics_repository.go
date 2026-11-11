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
			TotalBookings:    1428,
			TotalRevenue:     9854200.0,
			ActiveGuests:     312,
			OccupancyRate:    84.6,
			AverageDailyRate: 8500.0,
			RevenuePerRoom:   7191.0,
			MonthlyRevenue: []models.MonthlyRevenue{
				{Month: "Jun", Revenue: 1250000},
				{Month: "Jul", Revenue: 1420000},
				{Month: "Aug", Revenue: 1380000},
				{Month: "Sep", Revenue: 1690000},
				{Month: "Oct", Revenue: 1980000},
				{Month: "Nov", Revenue: 2134200},
			},
			OccupancyByHotel: []models.HotelOccupancy{
				{HotelName: "The Palm House (Goa)", Rate: 92.4},
				{HotelName: "Haveli & Co. (Jaipur)", Rate: 88.1},
				{HotelName: "Lakehouse Retreat (Udaipur)", Rate: 86.5},
				{HotelName: "Green Canopy (Munnar)", Rate: 74.0},
			},
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
