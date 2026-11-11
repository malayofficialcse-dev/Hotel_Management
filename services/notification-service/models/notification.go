package models

import "time"

type NotificationChannel string

const (
	ChannelEmail    NotificationChannel = "EMAIL"
	ChannelSMS      NotificationChannel = "SMS"
	ChannelWhatsApp NotificationChannel = "WHATSAPP"
	ChannelPush     NotificationChannel = "PUSH"
)

type Notification struct {
	ID        string              `json:"id"`
	Recipient string              `json:"recipient"`
	Channel   NotificationChannel `json:"channel"`
	Template  string              `json:"template"`
	Subject   string              `json:"subject"`
	Body      string              `json:"body"`
	Status    string              `json:"status"` // SENT | FAILED | PENDING
	CreatedAt time.Time           `json:"createdAt"`
}

type SendRequest struct {
	Recipient  string                 `json:"recipient"`
	Channel    NotificationChannel    `json:"channel"`
	Template   string                 `json:"template"`
	Parameters map[string]interface{} `json:"parameters"`
}

