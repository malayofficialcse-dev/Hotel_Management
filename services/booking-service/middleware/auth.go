package middleware

import (
	"context"
	"encoding/json"
	"net/http"
	"strings"
	"time"

	"github.com/google/uuid"
)

type contextKey string

const (
	UserIDKey    contextKey = "user_id"
	UserEmailKey contextKey = "user_email"
	UserRoleKey  contextKey = "user_role"
)

type validateTokenResponse struct {
	Valid bool `json:"valid"`
	User  *struct {
		ID    string `json:"id"`
		Email string `json:"email"`
		Role  string `json:"role"`
	} `json:"user"`
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

			// Validate with Auth Service
			req, err := http.NewRequestWithContext(r.Context(), http.MethodPost, authServiceURL+"/internal/auth/validate", strings.NewReader(`{"token":"`+token+`"}`))
			if err != nil {
				http.Error(w, `{"error":"internal_error"}`, http.StatusInternalServerError)
				return
			}
			req.Header.Set("Content-Type", "application/json")

			resp, err := client.Do(req)
			if err != nil || resp.StatusCode != http.StatusOK {
				http.Error(w, `{"error":"unauthorized","message":"invalid or expired token"}`, http.StatusUnauthorized)
				return
			}
			defer resp.Body.Close()

			var valRes validateTokenResponse
			if err := json.NewDecoder(resp.Body).Decode(&valRes); err != nil || valRes.User == nil {
				http.Error(w, `{"error":"unauthorized"}`, http.StatusUnauthorized)
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
			if role != "ADMIN" {
				http.Error(w, `{"error":"forbidden","message":"administrator access required"}`, http.StatusForbidden)
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
			req, err := http.NewRequestWithContext(r.Context(), http.MethodPost, authServiceURL+"/internal/auth/validate", strings.NewReader(`{"token":"`+token+`"}`))
			if err == nil {
				req.Header.Set("Content-Type", "application/json")
				if resp, err := client.Do(req); err == nil {
					defer resp.Body.Close()
					var valRes validateTokenResponse
					if json.NewDecoder(resp.Body).Decode(&valRes) == nil && valRes.User != nil {
						if parsedID, err := uuid.Parse(valRes.User.ID); err == nil {
							ctx := context.WithValue(r.Context(), UserIDKey, parsedID)
							ctx = context.WithValue(ctx, UserEmailKey, valRes.User.Email)
							ctx = context.WithValue(ctx, UserRoleKey, valRes.User.Role)
							next.ServeHTTP(w, r.WithContext(ctx))
							return
						}
					}
				}
			}

			next.ServeHTTP(w, r)
		})
	}
}

