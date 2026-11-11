package services

import (
	"encoding/json"
	"log"

	"notification-service/models"

	amqp "github.com/rabbitmq/amqp091-go"
)

type EventPayload struct {
	EventType   string                 `json:"event_type"`
	BookingID   string                 `json:"booking_id"`
	BookingCode string                 `json:"booking_code"`
	GuestEmail  string                 `json:"guest_email"`
	GuestName   string                 `json:"guest_name"`
	HotelName   string                 `json:"hotel_name"`
	RoomNumber  string                 `json:"room_number,omitempty"`
	RoomType    string                 `json:"room_type,omitempty"`
	CheckIn     string                 `json:"check_in,omitempty"`
	Amount      float64                `json:"amount,omitempty"`
	TotalPrice  float64                `json:"total_price,omitempty"`
	Status      string                 `json:"status,omitempty"`
	Extra       map[string]interface{} `json:"extra,omitempty"`
}

// StartRabbitMQConsumer connects to RabbitMQ and listens to events in a goroutine.
func StartRabbitMQConsumer(rabbitURL string, notifService *NotificationService) {
	conn, err := amqp.Dial(rabbitURL)
	if err != nil {
		log.Printf("⚠️  [Notification Service] RabbitMQ unavailable, skipping async consumer: %v", err)
		return
	}

	ch, err := conn.Channel()
	if err != nil {
		log.Printf("⚠️  [Notification Service] RabbitMQ channel error: %v", err)
		conn.Close()
		return
	}

	err = ch.ExchangeDeclare(
		"hotel_events",
		"topic",
		true,
		false,
		false,
		false,
		nil,
	)
	if err != nil {
		log.Printf("⚠️  [Notification Service] Exchange declare error: %v", err)
		ch.Close()
		conn.Close()
		return
	}

	q, err := ch.QueueDeclare(
		"notifications_service_queue",
		true,
		false,
		false,
		false,
		nil,
	)
	if err != nil {
		log.Printf("⚠️  [Notification Service] Queue declare error: %v", err)
		ch.Close()
		conn.Close()
		return
	}

	routingKeys := []string{
		"booking.confirmed",
		"booking.held",
		"payment.succeeded",
		"room.cleaned",
		"notification.dispatch",
	}

	for _, key := range routingKeys {
		if err := ch.QueueBind(q.Name, key, "hotel_events", false, nil); err != nil {
			log.Printf("⚠️  QueueBind error for key %s: %v", key, err)
		}
	}

	msgs, err := ch.Consume(
		q.Name,
		"",
		true, // auto-ack
		false,
		false,
		false,
		nil,
	)
	if err != nil {
		log.Printf("⚠️  Consume error: %v", err)
		ch.Close()
		conn.Close()
		return
	}

	log.Printf("✅ [Notification Service] Listening for RabbitMQ events on 'hotel_events' exchange...")

	go func() {
		defer ch.Close()
		defer conn.Close()

		for d := range msgs {
			var event EventPayload
			if err := json.Unmarshal(d.Body, &event); err != nil {
				log.Printf("⚠️  Failed to unmarshal event: %v", err)
				continue
			}

			log.Printf("📥 [Notification Service] Received event %s (routing key: %s)", event.EventType, d.RoutingKey)

			switch d.RoutingKey {
			case "booking.confirmed":
				recipient := event.GuestEmail
				if recipient == "" {
					recipient = "guest@stayease.internal"
				}
				_, _ = notifService.Send(&models.SendRequest{
					Recipient: recipient,
					Channel:   "EMAIL",
					Template:  "BOOKING_CONFIRMED",
					Parameters: map[string]interface{}{
						"guestName":   event.GuestName,
						"bookingCode": event.BookingCode,
						"hotelName":   event.HotelName,
						"checkInDate": event.CheckIn,
						"totalPrice":  event.TotalPrice,
					},
				})

			case "payment.succeeded":
				recipient := event.GuestEmail
				if recipient == "" {
					recipient = "guest@stayease.internal"
				}
				_, _ = notifService.Send(&models.SendRequest{
					Recipient: recipient,
					Channel:   "EMAIL",
					Template:  "PAYMENT_RECEIPT",
					Parameters: map[string]interface{}{
						"amount":      event.Amount,
						"bookingCode": event.BookingCode,
					},
				})

			case "room.cleaned":
				_, _ = notifService.Send(&models.SendRequest{
					Recipient: "frontdesk@stayease.internal",
					Channel:   "PUSH",
					Template:  "HOUSEKEEPING_ALERT",
					Parameters: map[string]interface{}{
						"roomNumber": event.RoomNumber,
						"priority":   "NORMAL",
					},
				})
			}
		}
	}()
}

