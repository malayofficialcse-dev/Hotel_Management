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
		AllowedMethods:   []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type", "x-user-id", "x-user-email", "x-user-role"},
		AllowCredentials: true,
	}))

	r.Get("/health", c.HealthCheck)

	r.Route("/api/v1/bookings", func(api chi.Router) {
		api.Get("/availability", c.GetAvailabilityCalendar)
		api.With(bookingMiddleware.RequireAuth(authServiceURL)).Get("/notifications/mine", c.ListMyNotifications)
		api.With(bookingMiddleware.RequireAuth(authServiceURL)).Patch("/notifications/{notificationId}/read", c.MarkMyNotificationRead)
		// Hold allows guest checkout or logged in user (optional token)
		api.With(bookingMiddleware.OptionalAuth(authServiceURL)).Post("/hold", c.HoldRoom)
		api.With(bookingMiddleware.RequireAuth(authServiceURL)).Get("/mine", c.ListMyBookings)
		api.With(bookingMiddleware.RequireAuth(authServiceURL)).Patch("/{id}", c.UpdateMyBooking)
		api.With(bookingMiddleware.RequireAdmin(authServiceURL)).Get("/service-requests/admin", c.ListAdminGuestServiceRequests)
		api.With(bookingMiddleware.RequireAdmin(authServiceURL)).Patch("/service-requests/{requestId}", c.UpdateGuestServiceRequestStatus)
		api.With(bookingMiddleware.RequireAuth(authServiceURL)).Post("/{id}/service-requests", c.CreateGuestServiceRequest)
		api.With(bookingMiddleware.RequireAuth(authServiceURL)).Get("/{id}/service-requests", c.ListGuestServiceRequests)
		api.With(bookingMiddleware.RequireAdmin(authServiceURL)).Get("/admin", c.ListAdminBookings)
		api.Post("/{id}/confirm", c.ConfirmBooking)
		api.With(bookingMiddleware.RequireAuth(authServiceURL)).Post("/{id}/cancel", c.CancelBooking)
		api.Get("/{id}", c.GetBookingByID)
		api.Get("/code", c.GetBookingByCode)
		api.Get("/code/{code}", c.GetBookingByCode)
		api.Get("/code/*", c.GetBookingByCode)

		// Contactless QR Pass & Digital Check-In
		api.Get("/{id}/qr-pass", c.GetQRPass)
		api.Get("/qr-pass", c.GetQRPass)
		api.Post("/verify-qr", c.VerifyQRPass)
	})

	r.Get("/internal/rooms/{roomTypeId}/availability", c.GetAvailabilityCalendar)

	// Internal endpoint for Hotel/Room service availability checks
	r.Get("/internal/rooms/{roomTypeId}/booked-count", c.GetBookedRoomCount)

	return r
}
