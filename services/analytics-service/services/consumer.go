package services

import (
	"encoding/json"
	"log"

	"analytics-service/repository"

	amqp "github.com/rabbitmq/amqp091-go"
)

type AnalyticsEvent struct {
	EventType  string  `json:"event_type"`
	Amount     float64 `json:"amount,omitempty"`
	TotalPrice float64 `json:"total_price,omitempty"`
}

// StartRabbitMQConsumer connects to RabbitMQ and listens to events to update live metrics.
func StartRabbitMQConsumer(rabbitURL string, repo *repository.AnalyticsRepository) {
	conn, err := amqp.Dial(rabbitURL)
	if err != nil {
		log.Printf("⚠️  [Analytics Service] RabbitMQ unavailable, skipping async consumer: %v", err)
		return
	}

	ch, err := conn.Channel()
	if err != nil {
		log.Printf("⚠️  [Analytics Service] RabbitMQ channel error: %v", err)
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
		log.Printf("⚠️  [Analytics Service] Exchange declare error: %v", err)
		ch.Close()
		conn.Close()
		return
	}

	q, err := ch.QueueDeclare(
		"analytics_service_queue",
		true,
		false,
		false,
		false,
		nil,
	)
	if err != nil {
		log.Printf("⚠️  [Analytics Service] Queue declare error: %v", err)
		ch.Close()
		conn.Close()
		return
	}

	topics := []string{"booking.confirmed", "payment.succeeded"}
	for _, t := range topics {
		if err := ch.QueueBind(q.Name, t, "hotel_events", false, nil); err != nil {
			log.Printf("⚠️  QueueBind error for topic %s: %v", t, err)
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

	log.Printf("✅ [Analytics Service] Consuming metrics events from RabbitMQ...")

	go func() {
		defer ch.Close()
		defer conn.Close()

		for d := range msgs {
			var event AnalyticsEvent
			if err := json.Unmarshal(d.Body, &event); err != nil {
				log.Printf("⚠️  Failed to unmarshal analytics event: %v", err)
				continue
			}

			switch d.RoutingKey {
			case "booking.confirmed":
				amount := event.TotalPrice
				if amount == 0 {
					amount = event.Amount
				}
				repo.RecordBooking(amount)
				log.Printf("📊 [Analytics Service] Recorded confirmed booking, revenue: ₹%.2f", amount)

			case "payment.succeeded":
				if event.Amount > 0 {
					repo.RecordRevenue(event.Amount)
					log.Printf("📊 [Analytics Service] Recorded payment revenue: ₹%.2f", event.Amount)
				}
			}
		}
	}()
}

