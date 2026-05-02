import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { marketplaceService, favoritesService } from '../services/api';
import { useAuth } from '../context/AuthContext';

const PlantPublicPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();

    const [plant, setPlant] = useState(null);
    const [similarPlants, setSimilarPlants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [investmentDuration, setInvestmentDuration] = useState(12); // Months
    const [investmentBreakdown, setInvestmentBreakdown] = useState(null);

    useEffect(() => {
        const fetchPlant = async () => {
            setLoading(true);
            try {
                const data = await marketplaceService.getPlantDetails(id);
                setPlant(data.plant);
                setSimilarPlants(data.similarPlants || []);
                calculateInvestment(data.plant, 12);
            } catch (error) {
                console.error('Error fetching plant details:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchPlant();
    }, [id]);

    const calculateInvestment = (plantData, months) => {
        if (!plantData) return;

        const landFee = parseFloat(plantData.landFee) || 0;
        const monthlyFee = parseFloat(plantData.maintenanceFeeMonthly) || 0;
        const totalMonthly = monthlyFee * months;
        const platformFee = (landFee + totalMonthly) * 0.05; // 5% platform fee example
        const total = landFee + totalMonthly + platformFee;

        setInvestmentBreakdown({
            landFee,
            monthlyFee,
            totalMonthly,
            platformFee,
            total,
            duration: months
        });
    };

    const handleDurationChange = (e) => {
        const months = parseInt(e.target.value);
        setInvestmentDuration(months);
        calculateInvestment(plant, months);
    };

    const handleInvest = () => {
        if (!isAuthenticated) {
            navigate('/login', { state: { from: `/invest/${id}` } });
            return;
        }
        navigate(`/invest/${id}`);
    };

    const handleAddToFavorites = async () => {
        if (!isAuthenticated) return navigate('/login');
        try {
            await favoritesService.addFavorite({ plantId: plant.id });
            alert('Added to favorites!');
        } catch (error) {
            console.error('Error adding to favorites:', error);
            alert('Failed to add to favorites (or already added).');
        }
    };

    if (loading) return <div className="text-center py-20">Loading...</div>;
    if (!plant) return <div className="text-center py-20">Plant not found.</div>;

    return (
        <div className="bg-gray-50 min-h-screen py-8">
            <div className="container mx-auto px-4">
                {/* Breadcrumb / Back */}
                <button
                    onClick={() => navigate(-1)}
                    className="mb-6 text-gray-500 hover:text-green-600 flex items-center"
                >
                    ← Back
                </button>

                <div className="grid md:grid-cols-3 gap-8">
                    {/* Left Column: Details */}
                    <div className="md:col-span-2 space-y-6">
                        <div className="bg-white rounded-lg shadow-md p-6">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h1 className="text-3xl font-bold text-gray-800 mb-2">{plant.cropType?.name}</h1>
                                    <p className="text-gray-500">Variety: {plant.cropType?.variety}</p>
                                </div>
                                <span className={`px-3 py-1 rounded-full text-sm font-bold ${plant.status === 'available' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                                    }`}>
                                    {plant.status?.toUpperCase()}
                                </span>
                            </div>

                            <div className="flex items-center space-x-4 mb-6 text-sm text-gray-600">
                                <span className="flex items-center">
                                    🏢 <span className="ml-1 font-medium text-gray-800">{plant.farm?.farmName}</span>
                                </span>
                                <span className="flex items-center">
                                    📍 <span className="ml-1">{plant.farm?.land?.city}, {plant.farm?.land?.state}</span>
                                </span>
                            </div>

                            <div className="border-t border-b border-gray-100 py-6 my-6">
                                <h3 className="font-bold text-gray-800 mb-4">Crop Details</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <span className="block text-gray-500 text-sm">Planted On</span>
                                        <span className="font-medium">{new Date(plant.plantDate).toLocaleDateString()}</span>
                                    </div>
                                    <div>
                                        <span className="block text-gray-500 text-sm">Expected Harvest</span>
                                        <span className="font-medium">{new Date(plant.expectedHarvestDate).toLocaleDateString()}</span>
                                    </div>
                                    <div>
                                        <span className="block text-gray-500 text-sm">Est. Yield</span>
                                        <span className="font-medium">{plant.expectedYield || 'TBD'} {plant.yieldUnit}</span>
                                    </div>
                                    <div>
                                        <span className="block text-gray-500 text-sm">Growth Duration</span>
                                        <span className="font-medium">{plant.cropType?.typicalGrowthDurationDays} days</span>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <h3 className="font-bold text-gray-800 mb-2">Description</h3>
                                <p className="text-gray-600">{plant.cropType?.description || "No description available."}</p>
                            </div>
                        </div>

                        {/* Similar Plants */}
                        {similarPlants.length > 0 && (
                            <div className="bg-white rounded-lg shadow-md p-6">
                                <h3 className="font-bold text-gray-800 mb-4">Similar Opportunities</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    {similarPlants.map(sim => (
                                        <div
                                            key={sim.id}
                                            className="border border-gray-200 rounded p-3 hover:bg-gray-50 cursor-pointer"
                                            onClick={() => navigate(`/marketplace/plants/${sim.id}`)}
                                        >
                                            <div className="font-bold text-gray-800">{sim.cropType?.name}</div>
                                            <div className="text-xs text-gray-500">{sim.farm?.farmName} - {sim.farm?.land?.city}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right Column: Investment Calculator */}
                    <div className="md:col-span-1">
                        <div className="bg-white rounded-lg shadow-lg p-6 sticky top-4">
                            <h3 className="text-xl font-bold text-gray-800 mb-6">Investment Calculator</h3>

                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Investment Duration</label>
                                <select
                                    className="w-full border border-gray-300 rounded p-2 focus:ring-green-500"
                                    value={investmentDuration}
                                    onChange={handleDurationChange}
                                >
                                    <option value="3">3 Months (Trial)</option>
                                    <option value="6">6 Months</option>
                                    <option value="12">1 Year (Standard)</option>
                                    <option value="24">2 Years</option>
                                </select>
                            </div>

                            {investmentBreakdown && (
                                <div className="space-y-3 mb-8 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Land Fee (One-time)</span>
                                        <span className="font-medium text-gray-900">${investmentBreakdown.landFee.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Farmer Fee (${investmentBreakdown.monthlyFee}/mo)</span>
                                        <span className="font-medium text-gray-900">${investmentBreakdown.totalMonthly.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Platform Fee (5%)</span>
                                        <span className="font-medium text-gray-900">${investmentBreakdown.platformFee.toFixed(2)}</span>
                                    </div>
                                    <div className="border-t border-gray-200 pt-3 flex justify-between items-center mt-3">
                                        <span className="font-bold text-gray-800">Total Investment</span>
                                        <span className="text-2xl font-bold text-green-600">${investmentBreakdown.total.toFixed(2)}</span>
                                    </div>
                                </div>
                            )}

                            <div className="space-y-3">
                                <button
                                    onClick={handleInvest}
                                    disabled={plant.status !== 'available'}
                                    className={`w-full font-bold py-3 rounded shadow-lg transition ${plant.status === 'available'
                                            ? 'bg-green-600 text-white hover:bg-green-700'
                                            : 'bg-gray-400 text-gray-200 cursor-not-allowed'
                                        }`}
                                >
                                    {plant.status === 'available' ? 'Invest Now' : `Status: ${plant.status}`}
                                </button>
                                <button
                                    onClick={handleAddToFavorites}
                                    className="w-full border border-green-600 text-green-600 font-bold py-3 rounded hover:bg-green-50 transition"
                                >
                                    Add to Favorites
                                </button>
                            </div>

                            <p className="text-xs text-gray-400 text-center mt-4">
                                * ROI estimates are based on historical data and not guaranteed.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PlantPublicPage;
