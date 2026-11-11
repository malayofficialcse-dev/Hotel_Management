package models

// GuestDetails holds the contact information for a booking guest.
// It is embedded in the Booking but can also be used as a standalone
// value-object when validating or transforming guest information.
type GuestDetails struct {
	FirstName       string `json:"first_name"`
	LastName        string `json:"last_name"`
	Email           string `json:"email"`
	Phone           string `json:"phone"`
	SpecialRequests string `json:"special_requests,omitempty"`
}

// FullName returns a combined display name.
func (g GuestDetails) FullName() string {
	return g.FirstName + " " + g.LastName
}

// Validate checks that mandatory guest fields are present.
func (g GuestDetails) Validate() error {
	if g.FirstName == "" {
		return ErrMissingField("guest_first_name")
	}
	if g.LastName == "" {
		return ErrMissingField("guest_last_name")
	}
	if g.Email == "" {
		return ErrMissingField("guest_email")
	}
	if g.Phone == "" {
		return ErrMissingField("guest_phone")
	}
	return nil
}

// ErrMissingField is a small sentinel error type for validation failures.
type ErrMissingField string

func (e ErrMissingField) Error() string {
	return "missing required field: " + string(e)
}
