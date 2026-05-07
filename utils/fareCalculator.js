const baseFares = {
    bike: { base: 20, perKm: 5, perMin: 1 },
    auto: { base: 30, perKm: 10, perMin: 1.5 },
    economy: { base: 50, perKm: 12, perMin: 2 },
    premium: { base: 80, perKm: 18, perMin: 3 }
};

/**
 * Calculate fare estimates for different vehicle types
 * @param {Number} distance - distance in kilometers
 * @param {Number} duration - duration in minutes
 * @returns {Object} Fare estimates for all vehicle types
 */
export const calculateFareEstimates = (distance, duration) => {
    const estimates = {};

    for (const [type, rates] of Object.entries(baseFares)) {
        let fare = rates.base + (rates.perKm * distance) + (rates.perMin * duration);
        
        // Add a surge multiplier if needed (e.g. 1.2x) - keeping it simple for now
        const surgeMultiplier = 1; 
        
        fare = Math.ceil(fare * surgeMultiplier);
        estimates[type] = fare;
    }

    return estimates;
};

/**
 * Calculate fare for a specific vehicle type
 * @param {String} vehicleType - type of vehicle
 * @param {Number} distance - distance in kilometers
 * @param {Number} duration - duration in minutes
 * @returns {Number} Calculated fare
 */
export const calculateFare = (vehicleType, distance, duration) => {
    const rates = baseFares[vehicleType];
    if (!rates) return 0;
    
    const fare = rates.base + (rates.perKm * distance) + (rates.perMin * duration);
    return Math.ceil(fare);
};
