import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { marketplaceService, investmentService, paymentService } from '../services/api';
import { useAuth } from '../context/AuthContext';

const InvestFlow = () => {
    const { plantId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();

    const [step, setStep] = useState(1);
    const [plant, setPlant] = useState(null);
    const [loading, setLoading] = useState(true);
    const [duration, setDuration] = useState(12);
    const [breakdown, setBreakdown] = useState(null);
    const [investmentId, setInvestmentId] = useState(null);
    const [paymentProcessing, setPaymentProcessing] = useState(false);

    useEffect(() => {
        const fetchPlant = async () => {
            try {
                const data = await marketplaceService.getPlantDetails(plantId);
                setPlant(data.plant);
                calculateBreakdown(data.plant, 12);
            } catch (error) {
                console.error('Error fetching plant:', error);
                alert('Failed to load plant details');
            } finally {
                setLoading(false);
            }
        };
        fetchPlant();
    }, [plantId]);

    const calculateBreakdown = (plantData, months) => {
        if (!plantData) return;
        const landFee = parseFloat(plantData.landFee) || 0;
        const monthlyFee = parseFloat(plantData.maintenanceFeeMonthly) || 0;
        const totalMonthly = monthlyFee * months;
        const platformFee = (landFee + totalMonthly) * 0.05;
        const total = landFee + totalMonthly + platformFee;

        setBreakdown({
            landFee,
            monthlyFee,
            duration: months,
            totalMonthly,
            platformFee,
            total
        });
    };

    const handleDurationChange = (e) => {
        const months = parseInt(e.target.value);
        setDuration(months);
        calculateBreakdown(plant, months);
    };

    // Step 1: Create Investment Record
    const handleProceedToContract = async () => {
        try {
            setLoading(true);
            const data = await investmentService.create({
                plantId,
                investmentDurationMonths: duration
            });
            setInvestmentId(data.investment.id);
            setStep(2); // Move to Contract
        } catch (error) {
            console.error('Error creating investment:', error);
            alert('Failed to create investment record.');
        } finally {
            setLoading(false);
        }
    };

    // Step 2: Agree to Contract
    const handleAgreeContract = () => {
        setStep(3); // Move to Payment
    };

    // Step 3: Payment
    const handlePayment = async () => {
        if (!investmentId) return;
        setPaymentProcessing(true);
        try {
            // 1. Initiate (Get Client Secret - Mocked for now)
            const initData = await paymentService.initiate({
                investmentId,
                paymentMethod: 'card'
            });

            // 2. Confirm (Mocked Stripe Confirmation)
            await paymentService.confirm({
                paymentId: initData.paymentId // Using ID returned from initiate
            });

            setStep(4); // Success
        } catch (error) {
            console.error('Payment failed:', error);
            alert('Payment execution failed. Please try again.');
        } finally {
            setPaymentProcessing(false);
        }
    };

    if (loading) return <div className="text-center py-20">Loading...</div>;
    if (!plant) return <div className="text-center py-20">Plant not found</div>;

    return (
        <div className="bg-gray-50 min-h-screen py-12">
            <div className="container mx-auto px-4 max-w-3xl">
                {/* Progress Bar */}
                <div className="flex justify-between mb-8 overflow-hidden rounded-full bg-gray-200 h-2">
                    <div className={`h-full bg-green-600 transition-all duration-500`} style={{ width: `${step * 25}%` }}></div>
                </div>

                <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                    {/* Step 1: Review */}
                    {step === 1 && (
                        <div className="p-8">
                            <h2 className="text-2xl font-bold mb-6 text-gray-800">Review Investment</h2>

                            <div className="flex items-center mb-6 bg-green-50 p-4 rounded-lg">
                                <span className="text-4xl mr-4">🌱</span>
                                <div>
                                    <h3 className="font-bold text-lg">{plant.cropType?.name} ({plant.cropType?.variety})</h3>
                                    <p className="text-gray-600">{plant.farm?.farmName} - {plant.farm?.land?.city}</p>
                                </div>
                            </div>

                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Investment Duration</label>
                                <select
                                    className="w-full border border-gray-300 rounded p-2"
                                    value={duration}
                                    onChange={handleDurationChange}
                                >
                                    <option value="6">6 Months</option>
                                    <option value="12">12 Months</option>
                                    <option value="24">24 Months</option>
                                </select>
                            </div>

                            <div className="border-t border-gray-200 pt-4 space-y-3 mb-8">
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Land Usage Fee</span>
                                    <span>${breakdown.landFee.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Farmer Fee (${breakdown.monthlyFee} x {duration}mo)</span>
                                    <span>${breakdown.totalMonthly.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Platform Fee (5%)</span>
                                    <span>${breakdown.platformFee.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between font-bold text-lg pt-2 border-t text-green-700">
                                    <span>Total Investment</span>
                                    <span>${breakdown.total.toFixed(2)}</span>
                                </div>
                            </div>

                            <button
                                onClick={handleProceedToContract}
                                className="w-full bg-green-600 text-white font-bold py-3 rounded hover:bg-green-700"
                            >
                                Continue to Contract
                            </button>
                        </div>
                    )}

                    {/* Step 2: Contract */}
                    {step === 2 && (
                        <div className="p-8">
                            <h2 className="text-2xl font-bold mb-4 text-gray-800">Digital Contract</h2>
                            <div className="bg-gray-100 p-4 rounded h-64 overflow-y-scroll text-sm text-gray-600 mb-6 border">
                                <p className="mb-2"><strong>AGREEMENT ID:</strong> {investmentId}</p>
                                <p className="mb-2"><strong>PARTIES:</strong> {user.fullName} (Investor) AND {plant.farm?.farmer?.user?.fullName || 'Farmer'} (Farmer)</p>
                                <p className="mb-2"><strong>TERMS:</strong> This agreement covers the investment in {plant.cropType?.name} for a period of {duration} months.</p>
                                <p className="mb-4">... [Full Legal Text Placeholder] ...</p>
                                <p>By signing below, you agree to the risks associated with agriculture, including weather and market fluctuations.</p>
                            </div>

                            <div className="mb-6">
                                <label className="flex items-center">
                                    <input type="checkbox" className="mr-2 h-5 w-5 text-green-600" />
                                    <span className="text-gray-700">I have read and agree to the Terms and Conditions</span>
                                </label>
                            </div>

                            <button
                                onClick={handleAgreeContract}
                                className="w-full bg-green-600 text-white font-bold py-3 rounded hover:bg-green-700"
                            >
                                Sign & Continue
                            </button>
                        </div>
                    )}

                    {/* Step 3: Payment */}
                    {step === 3 && (
                        <div className="p-8">
                            <h2 className="text-2xl font-bold mb-6 text-gray-800">Secure Payment</h2>

                            <div className="bg-blue-50 p-4 rounded mb-6 text-blue-800 text-sm">
                                Amount to Pay: <strong>${breakdown.total.toFixed(2)}</strong>
                            </div>

                            {/* Mock Stripe Element */}
                            <div className="mb-6 border p-4 rounded bg-gray-50">
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Card Information</label>
                                    <div className="bg-white border p-3 rounded text-gray-400">
                                        •••• •••• •••• 4242 (Test Mode)
                                    </div>
                                </div>
                                <div className="flex gap-4">
                                    <div className="w-1/2">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Expiry</label>
                                        <div className="bg-white border p-3 rounded text-gray-400">MM / YY</div>
                                    </div>
                                    <div className="w-1/2">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">CVC</label>
                                        <div className="bg-white border p-3 rounded text-gray-400">123</div>
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={handlePayment}
                                disabled={paymentProcessing}
                                className={`w-full font-bold py-3 rounded ${paymentProcessing ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700 text-white'}`}
                            >
                                {paymentProcessing ? 'Processing...' : `Pay $${breakdown.total.toFixed(2)}`}
                            </button>
                        </div>
                    )}

                    {/* Step 4: Success */}
                    {step === 4 && (
                        <div className="p-8 text-center">
                            <div className="text-6xl mb-4">🎉</div>
                            <h2 className="text-3xl font-bold text-gray-800 mb-2">Investment Successful!</h2>
                            <p className="text-gray-600 mb-8">You are now officially sponsoring this crop. Thank you for supporting sustainable farming.</p>

                            <div className="flex flex-col gap-4 max-w-xs mx-auto">
                                <button
                                    onClick={() => navigate('/investor/dashboard')}
                                    className="bg-green-600 text-white font-bold py-3 rounded hover:bg-green-700"
                                >
                                    Go to My Dashboard
                                </button>
                                <button
                                    onClick={() => navigate('/')}
                                    className="text-gray-500 hover:text-green-600"
                                >
                                    Return Home
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default InvestFlow;
