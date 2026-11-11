package utils

import (
	"fmt"
)

func RenderTemplate(templateName string, params map[string]interface{}) (string, string) {
	switch templateName {
	case "BOOKING_CONFIRMED":
		subject := "StayEase Booking Confirmation"
		body := fmt.Sprintf("Dear %v, your booking (%v) for %v is confirmed! Check-in: %v. Total: ₹%v.",
			params["guestName"], params["bookingCode"], params["hotelName"], params["checkInDate"], params["totalPrice"])
		return subject, body
	case "PAYMENT_RECEIPT":
		subject := "StayEase Payment Receipt"
		body := fmt.Sprintf("Payment of ₹%v received for reservation %v. Thank you for choosing StayEase.",
			params["amount"], params["bookingCode"])
		return subject, body
	case "HOUSEKEEPING_ALERT":
		subject := "Housekeeping Task Assigned"
		body := fmt.Sprintf("Room %v has been flagged for cleaning. Priority: %v.",
			params["roomNumber"], params["priority"])
		return subject, body
	default:
		return "StayEase Notification", fmt.Sprintf("Notification: %v", params)
	}
}

