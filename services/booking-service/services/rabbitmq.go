package services

import (
	"context"
	"encoding/json"
	"fmt"
	"log/slog"
	"time"

	amqp "github.com/rabbitmq/amqp091-go"
)

// RabbitMQPublisher handles event publishing to RabbitMQ.
type RabbitMQPublisher struct {
	conn    *amqp.Connection
	channel *amqp.Channel
	logger  *slog.Logger
}

// BookingEvent is the standard event payload published to RabbitMQ.
type BookingEvent struct {
	EventType   string    `json:"event_type"`
	BookingID   string    `json:"booking_id"`
	BookingCode string    `json:"booking_code"`
	UserID      string    `json:"user_id,omitempty"`
	GuestEmail  string    `json:"guest_email"`
	GuestName   string    `json:"guest_name"`
	HotelName   string    `json:"hotel_name"`
	RoomType    string    `json:"room_type"`
	CheckIn     string    `json:"check_in"`
	CheckOut    string    `json:"check_out"`
	TotalPrice  float64   `json:"total_price"`
	Timestamp   time.Time `json:"timestamp"`
}

// NewRabbitMQPublisher dials RabbitMQ and creates a channel.
// If the broker is unreachable it logs a warning and returns a no-op publisher.
func NewRabbitMQPublisher(url string, logger *slog.Logger) *RabbitMQPublisher {
	pub := &RabbitMQPublisher{logger: logger}

	conn, err := amqp.Dial(url)
	if err != nil {
		logger.Warn("⚠️  RabbitMQ unavailable – booking events will be skipped", "error", err)
		return pub
	}

	ch, err := conn.Channel()
	if err != nil {
		logger.Warn("⚠️  RabbitMQ channel error – booking events will be skipped", "error", err)
		conn.Close()
		return pub
	}

	// Declare a durable topic exchange for hotel events.
	if err := ch.ExchangeDeclare(
		"hotel_events", // name
		"topic",        // kind
		true,           // durable
		false,          // auto-delete
		false,          // internal
		false,          // no-wait
		nil,
	); err != nil {
		logger.Warn("⚠️  RabbitMQ exchange declare failed", "error", err)
		ch.Close()
		conn.Close()
		return pub
	}

	pub.conn = conn
	pub.channel = ch
	logger.Info("✅ RabbitMQ publisher connected", "exchange", "hotel_events")
	return pub
}

// Publish sends an event to the hotel_events exchange with the given routing key.
func (p *RabbitMQPublisher) Publish(ctx context.Context, routingKey string, event BookingEvent) error {
	if p.channel == nil {
		p.logger.Warn("RabbitMQ not connected – dropping event", "routingKey", routingKey)
		return nil
	}

	event.Timestamp = time.Now().UTC()
	body, err := json.Marshal(event)
	if err != nil {
		return fmt.Errorf("marshal event: %w", err)
	}

	err = p.channel.PublishWithContext(ctx,
		"hotel_events", // exchange
		routingKey,     // routing key (e.g. "booking.held", "booking.confirmed")
		false,          // mandatory
		false,          // immediate
		amqp.Publishing{
			ContentType:  "application/json",
			DeliveryMode: amqp.Persistent,
			Body:         body,
		},
	)
	if err != nil {
		return fmt.Errorf("publish to %q: %w", routingKey, err)
	}

	p.logger.Info("📤 Event published", "routingKey", routingKey, "bookingID", event.BookingID)
	return nil
}

// Close gracefully shuts down the publisher.
func (p *RabbitMQPublisher) Close() {
	if p.channel != nil {
		p.channel.Close()
	}
	if p.conn != nil {
		p.conn.Close()
	}
}

