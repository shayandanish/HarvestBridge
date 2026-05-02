/**
 * Financial calculation utilities for the Agro-Investment Platform
 */

/**
 * Calculate the total investment amount including land fees, maintenance fees, and platform commission.
 * @param {number} landFee - Initial land acquisition or rental fee
 * @param {number} monthlyFee - Ongoing maintenance fee per month
 * @param {number} durationMonths - Duration of the investment in months
 * @param {number} platformCommissionRate - Platform commission percentage (e.g., 0.05 for 5%)
 * @returns {Object} breakdown of calculations
 */
const calculateInvestmentBreakdown = (landFee, monthlyFee, durationMonths, platformCommissionRate = 0.05) => {
    const totalMonthly = monthlyFee * durationMonths;
    const platformFee = (landFee + totalMonthly) * platformCommissionRate;
    const totalAmount = landFee + totalMonthly + platformFee;

    return {
        landFee,
        monthlyFee,
        duration: durationMonths,
        totalMonthly,
        platformFee,
        totalAmount: parseFloat(totalAmount.toFixed(2))
    };
};

module.exports = {
    calculateInvestmentBreakdown
};
