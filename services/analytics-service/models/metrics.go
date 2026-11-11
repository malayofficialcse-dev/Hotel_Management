package models

import "time"

type DashboardMetrics struct {
	TotalBookings      int                `json:"totalBookings"`
	TotalRevenue       float64            `json:"totalRevenue"`
	ActiveGuests       int                `json:"activeGuests"`
	OccupancyRate      float64            `json:"occupancyRate"`      // e.g. 78.4%
	AverageDailyRate   float64            `json:"averageDailyRate"`   // ADR in INR
	RevenuePerRoom     float64            `json:"revenuePerRoom"`     // RevPAR in INR
	MonthlyRevenue     []MonthlyRevenue   `json:"monthlyRevenue"`
	OccupancyByHotel   []HotelOccupancy   `json:"occupancyByHotel"`
	UpdatedAt          time.Time          `json:"updatedAt"`
}

type MonthlyRevenue struct {
	Month   string  `json:"month"`
	Revenue float64 `json:"revenue"`
}

type HotelOccupancy struct {
	HotelName string  `json:"hotelName"`
	Rate      float64 `json:"rate"`
}

