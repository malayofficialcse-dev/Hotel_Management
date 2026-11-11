package repository

import (
	"sync"
	"time"

	"notification-service/models"

	"github.com/google/uuid"
)

type NotificationRepository struct {
	mu    sync.RWMutex
	store map[string]*models.Notification
}

func NewNotificationRepository() *NotificationRepository {
	return &NotificationRepository{
		store: make(map[string]*models.Notification),
	}
}

func (r *NotificationRepository) Save(n *models.Notification) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	if n.ID == "" {
		n.ID = uuid.New().String()
	}
	n.CreatedAt = time.Now()
	r.store[n.ID] = n
	return nil
}

func (r *NotificationRepository) FindByID(id string) (*models.Notification, bool) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	n, ok := r.store[id]
	return n, ok
}

func (r *NotificationRepository) FindAll() []*models.Notification {
	r.mu.RLock()
	defer r.mu.RUnlock()

	list := make([]*models.Notification, 0, len(r.store))
	for _, n := range r.store {
		list = append(list, n)
	}
	return list
}

