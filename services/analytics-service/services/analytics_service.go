package services

import (
	"analytics-service/models"
	"analytics-service/repository"
)

type AnalyticsService struct {
	repo *repository.AnalyticsRepository
}

func NewAnalyticsService(repo *repository.AnalyticsRepository) *AnalyticsService {
	return &AnalyticsService{repo: repo}
}

func (s *AnalyticsService) GetOverview() *models.DashboardMetrics {
	return s.repo.GetLiveMetrics()
}

