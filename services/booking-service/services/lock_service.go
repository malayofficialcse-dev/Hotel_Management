package services

import (
	"context"
	"fmt"
	"time"

	"github.com/redis/go-redis/v9"
)

const (
	// lockTTL is the maximum time a distributed lock is held.
	lockTTL = 5 * time.Second
	// holdTTL is how long a booking hold is kept in Redis (10 minutes).
	holdTTL = 600 * time.Second
)

// LockService manages distributed locks and booking holds via Redis.
type LockService struct {
	rdb *redis.Client
}

// NewLockService creates a LockService backed by the given Redis client.
func NewLockService(rdb *redis.Client) *LockService {
	return &LockService{rdb: rdb}
}

// lockKey returns the Redis key for a room-availability lock.
func lockKey(roomTypeID, checkIn, checkOut string) string {
	return fmt.Sprintf("lock:room:%s:%s:%s", roomTypeID, checkIn, checkOut)
}

// holdKey returns the Redis key for a booking hold.
func holdKey(bookingID string) string {
	return fmt.Sprintf("hold:booking:%s", bookingID)
}

// AcquireLock attempts to set a Redis NX lock with a 5-second TTL.
// Returns (true, nil) when the lock is acquired, (false, nil) when it is
// already held by another caller, and (false, err) on Redis errors.
func (s *LockService) AcquireLock(ctx context.Context, roomTypeID, checkIn, checkOut string) (bool, error) {
	key := lockKey(roomTypeID, checkIn, checkOut)
	ok, err := s.rdb.SetNX(ctx, key, "1", lockTTL).Result()
	if err != nil {
		return false, fmt.Errorf("acquire lock %q: %w", key, err)
	}
	return ok, nil
}

// ReleaseLock deletes the distributed lock key.
func (s *LockService) ReleaseLock(ctx context.Context, roomTypeID, checkIn, checkOut string) error {
	key := lockKey(roomTypeID, checkIn, checkOut)
	if err := s.rdb.Del(ctx, key).Err(); err != nil {
		return fmt.Errorf("release lock %q: %w", key, err)
	}
	return nil
}

// SetHold stores a booking code under the hold key with a 600-second TTL.
func (s *LockService) SetHold(ctx context.Context, bookingID, bookingCode string) error {
	key := holdKey(bookingID)
	if err := s.rdb.Set(ctx, key, bookingCode, holdTTL).Err(); err != nil {
		return fmt.Errorf("set hold %q: %w", key, err)
	}
	return nil
}

// RemoveHold deletes the hold entry for a booking.
func (s *LockService) RemoveHold(ctx context.Context, bookingID string) error {
	key := holdKey(bookingID)
	if err := s.rdb.Del(ctx, key).Err(); err != nil {
		return fmt.Errorf("remove hold %q: %w", key, err)
	}
	return nil
}

// HoldTTLRemaining returns the remaining TTL (in seconds) of a booking hold.
// Returns 0 if the key does not exist.
func (s *LockService) HoldTTLRemaining(ctx context.Context, bookingID string) (int, error) {
	key := holdKey(bookingID)
	d, err := s.rdb.TTL(ctx, key).Result()
	if err != nil {
		return 0, fmt.Errorf("ttl hold %q: %w", key, err)
	}
	if d < 0 {
		return 0, nil
	}
	return int(d / time.Second), nil
}
