package utils

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"strings"
	"time"
)

// QRPassClaims is the signed payload embedded inside the QR code JWT.
type QRPassClaims struct {
	Sub          string `json:"sub"`           // booking UUID
	BookingCode  string `json:"code"`          // e.g. "SE-ABC123"
	HotelID      string `json:"hotel_id"`
	HotelName    string `json:"hotel_name"`
	RoomTypeID   string `json:"room_type_id"`
	RoomTypeName string `json:"room_type_name"`
	GuestName    string `json:"guest_name"`
	GuestEmail   string `json:"guest_email"`
	CheckInDate  string `json:"check_in_date"`
	CheckOutDate string `json:"check_out_date"`
	TotalNights  int    `json:"total_nights"`
	RoomCount    int    `json:"room_count"`
	IssuedAt     int64  `json:"iat"`
	ExpiresAt    int64  `json:"exp"`
}

var (
	ErrQRPassExpired   = errors.New("QR pass has expired")
	ErrQRPassInvalid   = errors.New("QR pass signature is invalid")
	ErrQRPassMalformed = errors.New("QR pass token is malformed")
)

// jwtHeader is a fixed HS256 header, base64url-encoded.
var jwtHeader = base64.RawURLEncoding.EncodeToString([]byte(`{"alg":"HS256","typ":"JWT"}`))

// SignQRPass creates a compact JWS (Header.Payload.Signature) using HMAC-SHA256.
func SignQRPass(secret string, claims QRPassClaims) (string, error) {
	payload, err := json.Marshal(claims)
	if err != nil {
		return "", fmt.Errorf("marshal QR claims: %w", err)
	}
	encodedPayload := base64.RawURLEncoding.EncodeToString(payload)
	signingInput := jwtHeader + "." + encodedPayload

	mac := hmac.New(sha256.New, []byte(secret))
	mac.Write([]byte(signingInput))
	sig := base64.RawURLEncoding.EncodeToString(mac.Sum(nil))

	return signingInput + "." + sig, nil
}

// VerifyQRPass parses, validates signature, and checks expiry of a QR pass token.
func VerifyQRPass(secret string, token string) (*QRPassClaims, error) {
	parts := strings.Split(token, ".")
	if len(parts) != 3 {
		return nil, ErrQRPassMalformed
	}

	signingInput := parts[0] + "." + parts[1]
	mac := hmac.New(sha256.New, []byte(secret))
	mac.Write([]byte(signingInput))
	expectedSig := base64.RawURLEncoding.EncodeToString(mac.Sum(nil))

	if !hmac.Equal([]byte(parts[2]), []byte(expectedSig)) {
		return nil, ErrQRPassInvalid
	}

	payloadBytes, err := base64.RawURLEncoding.DecodeString(parts[1])
	if err != nil {
		return nil, ErrQRPassMalformed
	}

	var claims QRPassClaims
	if err := json.Unmarshal(payloadBytes, &claims); err != nil {
		return nil, ErrQRPassMalformed
	}

	if time.Now().Unix() > claims.ExpiresAt {
		return nil, ErrQRPassExpired
	}

	return &claims, nil
}
