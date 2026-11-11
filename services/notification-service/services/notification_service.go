package services

import (
	"log"

	"notification-service/models"
	"notification-service/repository"
	"notification-service/utils"
)

type NotificationService struct {
	repo *repository.NotificationRepository
}

func NewNotificationService(repo *repository.NotificationRepository) *NotificationService {
	return &NotificationService{repo: repo}
}

func (s *NotificationService) Send(req *models.SendRequest) (*models.Notification, error) {
	subject, body := utils.RenderTemplate(req.Template, req.Parameters)

	notification := &models.Notification{
		Recipient: req.Recipient,
		Channel:   req.Channel,
		Template:  req.Template,
		Subject:   subject,
		Body:      body,
		Status:    "SENT",
	}

	if err := s.repo.Save(notification); err != nil {
		return nil, err
	}

	log.Printf("📨 [%s] Sent to %s: %s", notification.Channel, notification.Recipient, notification.Subject)
	return notification, nil
}

func (s *NotificationService) GetAll() []*models.Notification {
	return s.repo.FindAll()
}

