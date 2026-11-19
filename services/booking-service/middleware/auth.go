package middleware

import (
	"context"
	"encoding/json"
	"log"
	"net/http"
	"net/url"
	"strings"
	"time"

	"github.com/google/uuid"
)

type contextKey string

const (
	UserIDKey      contextKey = "user_id"
	UserEmailKey   contextKey = "user_email"
	UserRoleKey    contextKey = "user_role"
	UserHotelIDKey contextKey = "user_hotel_id"
)

type validateTokenResponse struct {
	Valid bool `json:"valid"`
	User  *struct {
		ID      string `json:"id"`
		Email   string `json:"email"`
		Role    string `json:"role"`
		HotelID string `json:"hotelId"`
	} `json:"user"`
}

func authServiceCandidates(authServiceURL string) []string {
	base := strings.TrimRight(authServiceURL, "/")
	candidates := []string{base}
	parsed, err := url.Parse(base)
	if err != nil {
		return candidates
	}
	if strings.EqualFold(parsed.Hostname(), "localhost") || parsed.Hostname() == "127.0.0.1" {
		fallback := *parsed
		fallback.Host = strings.Replace(parsed.Host, parsed.Hostname(), "host.docker.internal", 1)
		candidates = append(candidates, strings.TrimRight(fallback.String(), "/"))
	}
	return candidates
}

func validateToken(ctx context.Context, client *http.Client, authServiceURL, token string) (*validateTokenResponse, int) {
	body, err := json.Marshal(map[string]string{"token": token})
	if err != nil {
		return nil, http.StatusInternalServerError
	}
	status := http.StatusServiceUnavailable
	for _, baseURL := range authServiceCandidates(authServiceURL) {
		req, err := http.NewRequestWithContext(ctx, http.MethodPost, baseURL+"/internal/auth/validate", strings.NewReader(string(body)))
		if err != nil {
			log.Printf("booking auth validation: invalid auth service URL %q: %v", baseURL, err)
			continue
		}
		req.Header.Set("Content-Type", "application/json")
		resp, err := client.Do(req)
		if err != nil {
			log.Printf("booking auth validation: cannot reach %s: %v", baseURL, err)
			continue
		}
		if resp.StatusCode != http.StatusOK {
			if resp.StatusCode == http.StatusUnauthorized {
				status = http.StatusUnauthorized
			} else if status != http.StatusUnauthorized {
				status = http.StatusServiceUnavailable
			}
			log.Printf("booking auth validation: %s returned HTTP %d", baseURL, resp.StatusCode)
			resp.Body.Close()
			continue
		}

		var result validateTokenResponse
		decodeErr := json.NewDecoder(resp.Body).Decode(&result)
		resp.Body.Close()
		if decodeErr != nil {
			status = http.StatusUnauthorized
			log.Printf("booking auth validation: invalid response from %s: %v", baseURL, decodeErr)
			continue
		}
		if result.Valid && result.User != nil {
			return &result, http.StatusOK
		}
		status = http.StatusUnauthorized
		log.Printf("booking auth validation: %s rejected the access token", baseURL)
	}

	return nil, status
}

// RequireAuth creates a middleware that validates JWT token against Auth Service.
func RequireAuth(authServiceURL string) func(next http.Handler) http.Handler {
	client := &http.Client{Timeout: 4 * time.Second}

	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			authHeader := r.Header.Get("Authorization")
			if authHeader == "" || !strings.HasPrefix(authHeader, "Bearer ") {
				http.Error(w, `{"error":"unauthorized","message":"missing or invalid token"}`, http.StatusUnauthorized)
				return
			}

			token := strings.TrimPrefix(authHeader, "Bearer ")

			valRes, status := validateToken(r.Context(), client, authServiceURL, token)
			if valRes == nil {
				if status == http.StatusServiceUnavailable {
					http.Error(w, `{"error":"auth_service_unavailable","message":"booking service cannot reach the authentication service"}`, http.StatusServiceUnavailable)
					return
				}
				http.Error(w, `{"error":"unauthorized","message":"invalid or expired token"}`, http.StatusUnauthorized)
				return
			}

			parsedID, err := uuid.Parse(valRes.User.ID)
			if err != nil {
				http.Error(w, `{"error":"invalid_user_id"}`, http.StatusUnauthorized)
				return
			}

			ctx := context.WithValue(r.Context(), UserIDKey, parsedID)
			ctx = context.WithValue(ctx, UserEmailKey, valRes.User.Email)
			ctx = context.WithValue(ctx, UserRoleKey, valRes.User.Role)
			ctx = context.WithValue(ctx, UserHotelIDKey, valRes.User.HotelID)

			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

// RequireAdmin validates the token and restricts access to administrator accounts.
func RequireAdmin(authServiceURL string) func(next http.Handler) http.Handler {
	requireAuth := RequireAuth(authServiceURL)
	return func(next http.Handler) http.Handler {
		return requireAuth(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			role, _ := r.Context().Value(UserRoleKey).(string)
			if role == "" || role == "CUSTOMER" {
				http.Error(w, `{"error":"forbidden","message":"staff or administrator access required"}`, http.StatusForbidden)
				return
			}
			next.ServeHTTP(w, r)
		}))
	}
}

// OptionalAuth attaches user context if token is present and valid, but doesn't block unauthenticated requests.
func OptionalAuth(authServiceURL string) func(next http.Handler) http.Handler {
	client := &http.Client{Timeout: 4 * time.Second}

	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			authHeader := r.Header.Get("Authorization")
			if authHeader == "" || !strings.HasPrefix(authHeader, "Bearer ") {
				next.ServeHTTP(w, r)
				return
			}

			token := strings.TrimPrefix(authHeader, "Bearer ")
			if valRes, _ := validateToken(r.Context(), client, authServiceURL, token); valRes != nil {
				if parsedID, err := uuid.Parse(valRes.User.ID); err == nil {
					ctx := context.WithValue(r.Context(), UserIDKey, parsedID)
					ctx = context.WithValue(ctx, UserEmailKey, valRes.User.Email)
					ctx = context.WithValue(ctx, UserRoleKey, valRes.User.Role)
					ctx = context.WithValue(ctx, UserHotelIDKey, valRes.User.HotelID)
					next.ServeHTTP(w, r.WithContext(ctx))
					return
				}
			}

			next.ServeHTTP(w, r)
		})
	}
}
