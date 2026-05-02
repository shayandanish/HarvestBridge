import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { farmerService } from '../../services/farmerService';
import harvestService from '../../services/harvestService';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api/v1';

const FarmerHarvestManagement = () => {
    const navigate = useNavigate();
    const [farms, setFarms] = useState([]);
    const [selectedFarmId, setSelectedFarmId] = useState('');
    const [plants, setPlants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showHarvestModal, setShowHarvestModal] = useState(false);
    const [selectedPlant, setSelectedPlant] = useState(null);
    const [harvestData, setHarvestData] = useState({
        actualYield: '',
        yieldUnit: 'kg',
        qualityGrade: 'standard',
        farmerNotes: '',
        harvestDate: new Date().toISOString().split('T')[0],
        collectionDeadline: '',
        photos: []
    });

    const token = JSON.parse(localStorage.getItem('user'))?.token;

    useEffect(() => {
        fetchFarms();
    }, []);

    useEffect(() => {
        if (selectedFarmId) {
            fetchPlants();
        }
    }, [selectedFarmId]);

    const fetchFarms = async () => {
        try {
            const data = await farmerService.getFarms();
            setFarms(data);
            if (data.length > 0) {
                setSelectedFarmId(data[0].id);
            }
        } catch (err) {
            console.error('Error fetching farms:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchPlants = async () => {
        setLoading(true);
        try {
            // Fetch sponsored and growing plants that are ready or near ready
            const response = await axios.get(`${API_URL}/plants/farms/${selectedFarmId}/plants`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            // Filter for plants that are sponsored or growing
            const sponsorPlants = response.data.data.filter(p => p.status === 'sponsored' || p.status === 'growing');
            setPlants(sponsorPlants);
        } catch (err) {
            console.error('Error fetching plants:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleHarvestClick = (plant) => {
        setSelectedPlant(plant);
        setShowHarvestModal(true);
        // Set default deadline to 7 days from now
        const deadline = new Date();
        deadline.setDate(deadline.getDate() + 7);
        setHarvestData({
            ...harvestData,
            collectionDeadline: deadline.toISOString().split('T')[0]
        });
    };

    const handlePhotoChange = (e) => {
        setHarvestData({
            ...harvestData,
            photos: Array.from(e.target.files)
        });
    };

    const handleSubmitHarvest = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await harvestService.recordHarvest(selectedPlant.id, harvestData);
            alert('Harvest recorded successfully! Investor has been notified.');
            setShowHarvestModal(false);
            fetchPlants(); // Refresh list
        } catch (err) {
            alert('Failed to record harvest: ' + (err.response?.data?.message || err.message));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
                <div className="flex-1">
                    <h1 className="text-4xl lg:text-5xl font-black text-gray-900 tracking-tight leading-tight">
                        Harvest Management
                    </h1>
                    <p className="mt-3 text-lg lg:text-xl text-gray-500 font-medium">
                        Track crop maturity and record successful harvests.
                    </p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => navigate(-1)}
                        className="bg-white text-gray-700 font-extrabold py-3 px-8 rounded-2xl border-2 border-gray-100 hover:border-gray-200 hover:bg-gray-50 transition-all shadow-sm flex items-center gap-2"
                    >
                        <span>←</span> Back
                    </button>
                    <select
                        className="bg-white p-4 border-2 border-gray-100 rounded-2xl font-bold text-gray-900 shadow-sm focus:border-green-500 transition"
                        value={selectedFarmId}
                        onChange={(e) => setSelectedFarmId(e.target.value)}
                    >
                        {farms.map(farm => (
                            <option key={farm.id} value={farm.id}>{farm.farmName}</option>
                        ))}
                    </select>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center my-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
                </div>
            ) : plants.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-100">
                    <p className="text-gray-500 text-lg">No sponsored plants ready for harvest in this farm.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {plants.map(plant => (
                        <div key={plant.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
                            <div className="p-5">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h3 className="font-bold text-lg text-gray-900">{plant.cropType.name}</h3>
                                        <p className="text-sm text-gray-500">ID: {plant.uniqueIdentifier}</p>
                                    </div>
                                    <span className={`px-2 py-1 rounded text-xs font-semibold ${plant.status === 'sponsored' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                                        }`}>
                                        {plant.status.toUpperCase()}
                                    </span>
                                </div>
                                <div className="space-y-2 mb-6">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500">Planted:</span>
                                        <span className="text-gray-900 font-medium">{new Date(plant.plantDate).toLocaleDateString()}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500">Expected Harvest:</span>
                                        <span className="text-gray-900 font-medium">{new Date(plant.expectedHarvestDate).toLocaleDateString()}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500">Location:</span>
                                        <span className="text-gray-900 font-medium">{plant.locationInFarm || 'N/A'}</span>
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleHarvestClick(plant)}
                                    className="w-full py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-colors"
                                >
                                    Record Harvest
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Harvest Modal */}
            {showHarvestModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-xl font-bold text-gray-900">Record Harvest - {selectedPlant?.cropType.name}</h2>
                                <button onClick={() => setShowHarvestModal(false)} className="text-gray-400 hover:text-gray-600">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                                </button>
                            </div>

                            <form onSubmit={handleSubmitHarvest} className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Actual Yield</label>
                                        <input
                                            type="number"
                                            required
                                            className="w-full p-2 border rounded-lg"
                                            value={harvestData.actualYield}
                                            onChange={(e) => setHarvestData({ ...harvestData, actualYield: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
                                        <input
                                            type="text"
                                            required
                                            className="w-full p-2 border rounded-lg"
                                            value={harvestData.yieldUnit}
                                            onChange={(e) => setHarvestData({ ...harvestData, yieldUnit: e.target.value })}
                                            placeholder="kg, lbs, units..."
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Quality Grade</label>
                                    <select
                                        className="w-full p-2 border rounded-lg"
                                        value={harvestData.qualityGrade}
                                        onChange={(e) => setHarvestData({ ...harvestData, qualityGrade: e.target.value })}
                                    >
                                        <option value="premium">Premium</option>
                                        <option value="standard">Standard</option>
                                        <option value="below_standard">Below Standard</option>
                                    </select>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Harvest Date</label>
                                        <input
                                            type="date"
                                            required
                                            className="w-full p-2 border rounded-lg"
                                            value={harvestData.harvestDate}
                                            onChange={(e) => setHarvestData({ ...harvestData, harvestDate: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Collection Deadline</label>
                                        <input
                                            type="date"
                                            required
                                            className="w-full p-2 border rounded-lg"
                                            value={harvestData.collectionDeadline}
                                            onChange={(e) => setHarvestData({ ...harvestData, collectionDeadline: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Farmer Notes</label>
                                    <textarea
                                        className="w-full p-2 border rounded-lg h-24"
                                        value={harvestData.farmerNotes}
                                        onChange={(e) => setHarvestData({ ...harvestData, farmerNotes: e.target.value })}
                                        placeholder="Add any specific observations or instructions..."
                                    ></textarea>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Photos</label>
                                    <input
                                        type="file"
                                        multiple
                                        accept="image/*"
                                        onChange={handlePhotoChange}
                                        className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
                                    />
                                </div>

                                <div className="pt-4">
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold transition-colors disabled:bg-gray-400"
                                    >
                                        {loading ? 'Processing...' : 'Notify Investor & Finalize Harvest'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FarmerHarvestManagement;
