package routes

import (
	"booking-service/controllers"
	bookingMiddleware "booking-service/middleware"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
)

func SetupRoutes(c *controllers.BookingController, authServiceURL string) *chi.Mux {
	r := chi.NewRouter()

	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   []string{"*"},
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type", "x-user-id", "x-user-email", "x-user-role"},
		AllowCredentials: true,
	}))

	r.Get("/health", c.HealthCheck)

	r.Route("/api/v1/bookings", func(api chi.Router) {
		// Hold allows guest checkout or logged in user (optional token)
		api.With(bookingMiddleware.OptionalAuth(authServiceURL)).Post("/hold", c.HoldRoom)
		api.With(bookingMiddleware.RequireAdmin(authServiceURL)).Get("/admin", c.ListAdminBookings)
		api.Post("/{id}/confirm", c.ConfirmBooking)
		api.With(bookingMiddleware.OptionalAuth(authServiceURL)).Post("/{id}/cancel", c.CancelBooking)
		api.Get("/{id}", c.GetBookingByID)
		api.Get("/code", c.GetBookingByCode)
		api.Get("/code/{code}", c.GetBookingByCode)
		api.Get("/code/*", c.GetBookingByCode)
	})

	// Internal endpoint for Hotel/Room service availability checks
	r.Get("/internal/rooms/{roomTypeId}/booked-count", c.GetBookedRoomCount)

	return r
}
