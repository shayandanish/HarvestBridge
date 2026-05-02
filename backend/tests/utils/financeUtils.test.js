const { calculateInvestmentBreakdown } = require('../../src/utils/financeUtils');

describe('Finance Utilities', () => {
    test('calculateInvestmentBreakdown should calculate totals correctly', () => {
        const landFee = 1000;
        const monthlyFee = 50;
        const duration = 12;
        const commission = 0.05;

        const result = calculateInvestmentBreakdown(landFee, monthlyFee, duration, commission);

        expect(result.totalMonthly).toBe(600);
        expect(result.platformFee).toBe(80); // (1000 + 600) * 0.05
        expect(result.totalAmount).toBe(1680);
    });

    test('calculateInvestmentBreakdown should handle zero fees', () => {
        const result = calculateInvestmentBreakdown(0, 0, 10);
        expect(result.totalAmount).toBe(0);
    });

    test('calculateInvestmentBreakdown should use default commission if not provided', () => {
        const result = calculateInvestmentBreakdown(100, 10, 1);
        expect(result.platformFee).toBe(5.5); // (100 + 10) * 0.05
    });
});
