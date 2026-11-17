package services

import (
	"context"
	"fmt"
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestFetchInventoryReturnsRoomPrice(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if got, want := r.URL.Path, "/internal/rooms/room-id/inventory"; got != want {
			t.Errorf("request path = %q, want %q", got, want)
		}
		_, _ = fmt.Fprint(w, `{"inventory":4,"capacity":3,"pricePerNight":125.5}`)
	}))
	defer server.Close()

	service := &BookingService{hotelServiceURL: server.URL}
	inventory, price, capacity, err := service.fetchInventory(context.Background(), "room-id")
	if err != nil {
		t.Fatalf("fetchInventory() error = %v", err)
	}
	if inventory != 4 {
		t.Errorf("inventory = %d, want 4", inventory)
	}
	if price != 125.5 {
		t.Errorf("price = %v, want 125.5", price)
	}
	if capacity != 3 {
		t.Errorf("capacity = %d, want 3", capacity)
	}
}
