/**
 * Land area unit conversion utility for calculations across different units.
 * Base unit reference: Kanal
 */

const UNIT_CONVERSIONS = {
    'KANAL': 1,
    'MARLA': 20,       // 1 Kanal = 20 Marla
    'SQ FT': 5445,     // 1 Kanal = 5445 Sq Ft (Standard Pakistani/Punjab Revenue)
    'SQ YD': 605,      // 1 Kanal = 605 Sq Yd
    'ACRE': 0.125      // 1 Acre = 8 Kanal
};

/**
 * Convert area from one unit to another
 * @param {number} amount - The amount to convert
 * @param {string} fromUnit - Original unit
 * @param {string} toUnit - Target unit
 * @returns {number} Converted amount
 */
const convertArea = (amount, fromUnit, toUnit) => {
    if (amount === undefined || amount === null || !fromUnit || !toUnit) return amount;

    const normalizedFrom = fromUnit.toUpperCase().trim();
    const normalizedTo = toUnit.toUpperCase().trim();

    if (normalizedFrom === normalizedTo) return Number(amount);

    // If unit not in conversion table, return original
    if (!UNIT_CONVERSIONS[normalizedFrom] || !UNIT_CONVERSIONS[normalizedTo]) {
        console.warn(`Unit conversion not found for ${normalizedFrom} or ${normalizedTo}`);
        return Number(amount);
    }

    // Process: fromUnit -> Kanal -> toUnit
    const kanalAmount = Number(amount) / UNIT_CONVERSIONS[normalizedFrom];
    const result = kanalAmount * UNIT_CONVERSIONS[normalizedTo];

    return parseFloat(result.toFixed(4));
};

module.exports = {
    convertArea,
    UNIT_CONVERSIONS
};
