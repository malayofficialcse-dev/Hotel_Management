package middleware

import (
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestRequireAdminDoesNotTrustForwardedIdentityHeaders(t *testing.T) {
	called := false
	protected := RequireAdmin("http://127.0.0.1:1")(http.HandlerFunc(func(http.ResponseWriter, *http.Request) {
		called = true
	}))
	req := httptest.NewRequest(http.MethodGet, "/api/v1/bookings/admin", nil)
	req.Header.Set("Authorization", "Bearer unverified-token")
	req.Header.Set("x-user-id", "00000000-0000-4000-8000-000000000001")
	req.Header.Set("x-user-role", "ADMIN")
	response := httptest.NewRecorder()

	protected.ServeHTTP(response, req)

	if called {
		t.Fatal("protected handler ran with only unverified forwarded headers")
	}
	if response.Code != http.StatusUnauthorized {
		t.Fatalf("expected 401 for unverified token, got %d", response.Code)
	}
}
