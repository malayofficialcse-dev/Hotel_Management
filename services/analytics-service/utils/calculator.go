package utils

func CalculateRevPAR(totalRevenue float64, totalAvailableRooms int) float64 {
	if totalAvailableRooms <= 0 {
		return 0
	}
	return totalRevenue / float64(totalAvailableRooms)
}

func CalculateOccupancy(roomsSold int, totalRooms int) float64 {
	if totalRooms <= 0 {
		return 0
	}
	return (float64(roomsSold) / float64(totalRooms)) * 100
}

