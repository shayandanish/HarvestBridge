import React, { useState, useEffect } from 'react';
import harvestService from '../services/harvestService';
import { Link } from 'react-router-dom';

const InvestorHarvestDashboard = () => {
    const [harvests, setHarvests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCollectionModal, setShowCollectionModal] = useState(false);
    const [selectedHarvest, setSelectedHarvest] = useState(null);
    const [collectionStep, setCollectionStep] = useState(1); // 1: Select Method, 2: Address (if delivery)
    const [deliveryData, setDeliveryData] = useState({
        deliveryAddress: '',
        deliveryCity: '',
        deliveryState: '',
        deliveryPostalCode: '',
        deliveryPhone: '',
        deliveryInstructions: ''
    });

    useEffect(() => {
        fetchHarvests();
    }, []);

    const fetchHarvests = async () => {
        setLoading(true);
        try {
            const data = await harvestService.getInvestorHarvests();
            setHarvests(data.data);
        } catch (err) {
            console.error('Error fetching harvests:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleMethodSelect = async (method) => {
        if (method === 'home_delivery') {
            setCollectionStep(2);
            return;
        }

        try {
            await harvestService.updateCollectionMethod(selectedHarvest.id, method);
            alert(`Selected method: ${method.replace('_', ' ')}. Check your dashboard for updates.`);
            setShowCollectionModal(false);
            fetchHarvests();
        } catch (err) {
            alert('Error updating collection method: ' + err.message);
        }
    };

    const handleSubmitDelivery = async (e) => {
        e.preventDefault();
        try {
            await harvestService.updateCollectionMethod(selectedHarvest.id, 'home_delivery');
            await harvestService.createDeliveryRequest(selectedHarvest.id, deliveryData);
            alert('Delivery request created! Tracking will be available soon.');
            setShowCollectionModal(false);
            fetchHarvests();
        } catch (err) {
            alert('Error creating delivery request: ' + err.message);
        }
    };

    return (
        <div className="max-w-6xl mx-auto p-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-8">My Harvests</h1>

            {loading ? (
                <div className="flex justify-center my-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
                </div>
            ) : harvests.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-2xl shadow-sm border border-gray-100">
                    <div className="text-5xl mb-4">🧺</div>
                    <h2 className="text-xl font-semibold text-gray-800 mb-2">No harvests yet</h2>
                    <p className="text-gray-500">When your sponsored plants are harvested, they will appear here.</p>
                </div>
            ) : (
                <div className="space-y-6">
                    {harvests.map(harvest => (
                        <div key={harvest.id} className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden">
                            <div className="flex flex-col md:flex-row">
                                <div className="md:w-1/3 bg-gray-100 h-48 md:h-auto relative">
                                    {harvest.photoUrls && harvest.photoUrls.length > 0 ? (
                                        <img src={harvest.photoUrls[0]} alt="Harvest" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                                            <span className="text-4xl">📸 No Photos</span>
                                        </div>
                                    )}
                                    <div className="absolute top-4 left-4">
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold shadow-sm ${harvest.collectionStatus === 'ready' ? 'bg-yellow-100 text-yellow-800' :
                                                harvest.collectionStatus === 'delivered' || harvest.collectionStatus === 'collected' ? 'bg-green-100 text-green-800' :
                                                    'bg-gray-100 text-gray-800'
                                            }`}>
                                            {harvest.collectionStatus.toUpperCase()}
                                        </span>
                                    </div>
                                </div>
                                <div className="p-6 md:w-2/3 flex flex-col justify-between">
                                    <div>
                                        <div className="flex justify-between items-start mb-2">
                                            <h2 className="text-xl font-bold text-gray-900">{harvest.plant.cropType.name}</h2>
                                            <span className="text-sm text-gray-500 font-medium">Harvested: {new Date(harvest.harvestDate).toLocaleDateString()}</span>
                                        </div>
                                        <p className="text-gray-600 mb-4">{harvest.plant.farm.farmName} • {harvest.plant.uniqueIdentifier}</p>

                                        <div className="grid grid-cols-2 gap-4 mb-4">
                                            <div className="bg-green-50 p-3 rounded-xl">
                                                <p className="text-xs text-green-600 font-bold uppercase tracking-wider mb-1">Actual Yield</p>
                                                <p className="text-lg font-bold text-green-900">{harvest.actualYield} {harvest.yieldUnit}</p>
                                            </div>
                                            <div className="bg-blue-50 p-3 rounded-xl">
                                                <p className="text-xs text-blue-600 font-bold uppercase tracking-wider mb-1">Quality</p>
                                                <p className="text-lg font-bold text-blue-900 capitalize">{harvest.qualityGrade}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-col sm:flex-row gap-3 mt-4">
                                        {harvest.collectionStatus === 'ready' && !harvest.collectionMethod && (
                                            <button
                                                onClick={() => {
                                                    setSelectedHarvest(harvest);
                                                    setShowCollectionModal(true);
                                                    setCollectionStep(1);
                                                }}
                                                className="flex-1 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-green-200"
                                            >
                                                Select Collection Method
                                            </button>
                                        )}
                                        {harvest.collectionMethod === 'home_delivery' && (
                                            <div className="flex-1 flex flex-col justify-center">
                                                <p className="text-sm font-bold text-blue-700 mb-1">Home Delivery Requested</p>
                                                <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                                                    <div className="bg-blue-600 h-full" style={{ width: '25%' }}></div>
                                                </div>
                                                <p className="text-xs text-gray-500 mt-1">Status: Pending Pickup</p>
                                            </div>
                                        )}
                                        {harvest.collectionMethod === 'self_collect' && (
                                            <div className="flex-1">
                                                <p className="text-sm font-bold text-orange-700">Self Collection Selected</p>
                                                <p className="text-xs text-gray-500">Pick up your produce by {new Date(harvest.collectionDeadline).toLocaleDateString()}</p>
                                            </div>
                                        )}
                                        {harvest.collectionStatus === 'delivered' && (
                                            <Link
                                                to={`/harvests/${harvest.id}/review`}
                                                className="flex-1 py-3 bg-white border-2 border-green-600 text-green-600 hover:bg-green-50 rounded-xl font-bold text-center transition-all"
                                            >
                                                Share Your Experience / Review
                                            </Link>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Collection Modal */}
            {showCollectionModal && (
                <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl animate-scale-up">
                        <div className="p-8">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-2xl font-bold text-gray-900">
                                    {collectionStep === 1 ? 'Choose Your Option' : 'Delivery Details'}
                                </h2>
                                <button onClick={() => setShowCollectionModal(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"></path></svg>
                                </button>
                            </div>

                            {collectionStep === 1 ? (
                                <div className="space-y-4">
                                    <button
                                        onClick={() => handleMethodSelect('home_delivery')}
                                        className="w-full flex items-center p-5 border-2 border-gray-100 rounded-2xl hover:border-blue-500 hover:bg-blue-50 transition-all group"
                                    >
                                        <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-2xl mr-4 group-hover:scale-110 transition-transform">🚚</div>
                                        <div className="text-left">
                                            <p className="font-bold text-gray-900">Home Delivery</p>
                                            <p className="text-sm text-gray-500">Fresh produce delivered to your door (Cost: $25)</p>
                                        </div>
                                    </button>
                                    <button
                                        onClick={() => handleMethodSelect('self_collect')}
                                        className="w-full flex items-center p-5 border-2 border-gray-100 rounded-2xl hover:border-orange-500 hover:bg-orange-50 transition-all group"
                                    >
                                        <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center text-2xl mr-4 group-hover:scale-110 transition-transform">🏪</div>
                                        <div className="text-left">
                                            <p className="font-bold text-gray-900">Self Collection</p>
                                            <p className="text-sm text-gray-500">Pick up directly from the farm</p>
                                        </div>
                                    </button>
                                    <button
                                        onClick={() => handleMethodSelect('donate')}
                                        className="w-full flex items-center p-5 border-2 border-gray-100 rounded-2xl hover:border-pink-500 hover:bg-pink-50 transition-all group"
                                    >
                                        <div className="w-12 h-12 bg-pink-100 rounded-xl flex items-center justify-center text-2xl mr-4 group-hover:scale-110 transition-transform">❤️</div>
                                        <div className="text-left">
                                            <p className="font-bold text-gray-900">Donate to Charity</p>
                                            <p className="text-sm text-gray-500">Share your harvest with those in need</p>
                                        </div>
                                    </button>
                                    <button
                                        onClick={() => handleMethodSelect('farmer_keeps')}
                                        className="w-full flex items-center p-5 border-2 border-gray-100 rounded-2xl hover:border-green-500 hover:bg-green-50 transition-all group"
                                    >
                                        <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center text-2xl mr-4 group-hover:scale-110 transition-transform">👩‍🌾</div>
                                        <div className="text-left">
                                            <p className="font-bold text-gray-900">Leave for Farmer</p>
                                            <p className="text-sm text-gray-500">Donate the produce back to the farmer</p>
                                        </div>
                                    </button>
                                </div>
                            ) : (
                                <form onSubmit={handleSubmitDelivery} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Street Address</label>
                                        <input
                                            type="text" required
                                            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all"
                                            value={deliveryData.deliveryAddress}
                                            onChange={(e) => setDeliveryData({ ...deliveryData, deliveryAddress: e.target.value })}
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-2">City</label>
                                            <input
                                                type="text" required
                                                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl"
                                                value={deliveryData.deliveryCity}
                                                onChange={(e) => setDeliveryData({ ...deliveryData, deliveryCity: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-2">Postal Code</label>
                                            <input
                                                type="text" required
                                                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl"
                                                value={deliveryData.deliveryPostalCode}
                                                onChange={(e) => setDeliveryData({ ...deliveryData, deliveryPostalCode: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Phone Number</label>
                                        <input
                                            type="tel" required
                                            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl"
                                            value={deliveryData.deliveryPhone}
                                            onChange={(e) => setDeliveryData({ ...deliveryData, deliveryPhone: e.target.value })}
                                        />
                                    </div>
                                    <div className="flex gap-4 pt-4">
                                        <button
                                            type="button"
                                            onClick={() => setCollectionStep(1)}
                                            className="flex-1 py-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-2xl font-bold transition-all"
                                        >
                                            Back
                                        </button>
                                        <button
                                            type="submit"
                                            className="flex-1 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold transition-all shadow-lg shadow-blue-200"
                                        >
                                            Confirm & Pay $25
                                        </button>
                                    </div>
                                </form>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default InvestorHarvestDashboard;
