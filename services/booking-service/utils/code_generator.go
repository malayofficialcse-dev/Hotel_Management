package utils

import (
	"crypto/rand"
)

const charset = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"

func GenerateBookingCode() string {
	b := make([]byte, 6)
	_, _ = rand.Read(b)
	for i := range b {
		b[i] = charset[int(b[i])%len(charset)]
	}
	return "SE-" + string(b)
}

