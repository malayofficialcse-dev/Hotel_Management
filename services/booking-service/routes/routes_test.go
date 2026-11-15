package routes

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"booking-service/controllers"
)

func TestMyBookingsRequiresAuthentication(t *testing.T) {
	handler := SetupRoutes(controllers.NewBookingController(nil), "")
	request := httptest.NewRequest(http.MethodGet, "/api/v1/bookings/mine", nil)
	response := httptest.NewRecorder()

	handler.ServeHTTP(response, request)

	if response.Code != http.StatusUnauthorized {
		t.Fatalf("status = %d, want %d", response.Code, http.StatusUnauthorized)
	}
}
