import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { farmerService, getMediaUrl } from '../../services/api';

const FarmerFarmsDashboard = () => {
    const [farms, setFarms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchFarms = async () => {
            try {
                const response = await farmerService.getManagedFarms();
                setFarms(response.data || []);
            } catch (err) {
                console.error('Error fetching managed farms:', err);
                setError('Failed to load managed farms');
            } finally {
                setLoading(false);
            }
        };

        fetchFarms();
    }, []);

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-100 shadow-sm">
                    {error}
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
                    <div className="flex-1">
                        <h1 className="text-4xl lg:text-5xl font-black text-gray-900 tracking-tight leading-tight">
                            Manage Managed Farms
                        </h1>
                        <p className="mt-3 text-lg lg:text-xl text-gray-500 font-medium">
                            Overview of farms and plants assigned to you by investors.
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={() => navigate(-1)}
                            className="bg-white text-gray-700 font-extrabold py-3 px-8 rounded-2xl border-2 border-gray-100 hover:border-gray-200 hover:bg-gray-50 transition-all shadow-sm flex items-center gap-2"
                        >
                            <span>←</span> Back
                        </button>
                    </div>
                </div>

                {farms.length === 0 ? (
                    <div className="bg-white rounded-3xl shadow-xl p-12 text-center border border-gray-100">
                        <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
                            <span className="text-4xl">🚜</span>
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-2">No Managed Farms Found</h3>
                        <p className="text-gray-500 max-w-md mx-auto">
                            You haven't been assigned to manage any investor farms yet.
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {farms.map((farm) => (
                            <div 
                                key={farm.id} 
                                className="group bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2"
                            >
                                <div className="relative h-48 bg-gray-200">
                                    <img 
                                        src={(() => {
                                            const farmPhoto = farm.photos?.find(p => p.isPrimary)?.photoUrl || farm.photos?.[0]?.photoUrl;
                                            if (farmPhoto) return getMediaUrl(farmPhoto);
                                            
                                            if (farm.land?.landPhotos) {
                                                try {
                                                    const lp = JSON.parse(farm.land.landPhotos);
                                                    if (lp && lp.length > 0) return getMediaUrl(lp[0]);
                                                } catch(e) {}
                                            }
                                            
                                            return 'https://images.unsplash.com/photo-1500382017468-9049fee74a62?auto=format&fit=crop&w=800&q=80';
                                        })()} 
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                        alt={farm.farmName}
                                    />
                                    <div className="absolute top-4 right-4 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-[10px] font-bold text-green-700 shadow-sm">
                                        {farm.isDirectPlanting ? '🌳 Plant Tree' : '🌾 Lease Land'}
                                    </div>
                                    <div className="absolute top-4 left-4 bg-green-600/90 backdrop-blur px-3 py-1 rounded-full text-[10px] font-bold text-white shadow-sm">
                                        Active Management
                                    </div>
                                </div>
                                <div className="p-8">
                                    <div className="flex justify-between items-start mb-4">
                                        <h2 className="text-2xl font-bold text-gray-900 group-hover:text-green-600 transition-colors uppercase tracking-wide">
                                            {farm.farmName}
                                        </h2>
                                    </div>
                                    
                                    <div className="space-y-4 mb-8">
                                        <div className="flex items-center text-gray-600 bg-gray-50 p-3 rounded-2xl">
                                            <span className="text-xl mr-3">👤</span>
                                            <div>
                                                <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Investor</p>
                                                <p className="font-bold text-gray-800">{farm.investor?.fullName || 'N/A'}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center text-gray-600 bg-gray-50 p-3 rounded-2xl">
                                            <div>
                                                <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Location</p>
                                                <p className="font-bold text-gray-800">{farm.land?.city || 'N/A'}, {farm.land?.state || ''}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center text-gray-600 bg-gray-50 p-3 rounded-2xl">
                                            <span className="text-xl mr-3">🌳</span>
                                            <div>
                                                <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Plants</p>
                                                <p className="font-bold text-gray-800">
                                                    {(() => {
                                                        const plantCount = farm.plants?.length || 0;
                                                        const pendingCount = farm.plantationRequests?.filter(r => r.status === 'pending').reduce((total, req) => 
                                                            total + req.items.reduce((itemTotal, item) => itemTotal + item.quantity, 0), 0) || 0;
                                                        return plantCount + pendingCount;
                                                    })()} Trees Assigned
                                                </p>
                                                {farm.plantationRequests?.some(r => r.status === 'pending') && (
                                                    <p className="text-[10px] text-orange-500 font-bold flex items-center mt-1">
                                                        <span className="mr-1">⏳</span> {farm.plantationRequests.filter(r => r.status === 'pending').reduce((total, req) => 
                                                            total + req.items.reduce((itemTotal, item) => itemTotal + item.quantity, 0), 0)} New Request(s)
                                                    </p>
                                                )}
                                                {farm.plantationRequests?.some(r => r.status === 'approved') && (
                                                    <p className="text-[10px] text-green-500 font-bold flex items-center mt-1">
                                                        <span className="mr-1">✅</span> {farm.plantationRequests.filter(r => r.status === 'approved').reduce((total, req) => 
                                                            total + req.items.reduce((itemTotal, item) => itemTotal + item.quantity, 0), 0)} Approved (To Plant)
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <h4 className="text-sm font-bold text-gray-400 uppercase tracking-widest px-1">Plant Inventory</h4>
                                        <div className="space-y-2">
                                            {/* Actual Plants */}
                                            {farm.plants?.slice(0, 3).map((plant) => (
                                                <div 
                                                    key={plant.id} 
                                                    onClick={() => navigate(`/farmer/manage/plant/${plant.id}`)}
                                                    className="flex justify-between items-center p-3 rounded-xl hover:bg-green-50 cursor-pointer border border-transparent hover:border-green-100 transition-all group/item"
                                                >
                                                    <span className="text-sm font-semibold text-gray-700">{plant.cropType?.name}</span>
                                                    <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-full ${
                                                        plant.growthStatus === 'to_be_planted' ? 'bg-orange-100 text-orange-600' : 
                                                        plant.growthStatus === 'healthy' ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'
                                                    }`}>
                                                        {plant.growthStatus?.replace('_', ' ') || 'Growing'}
                                                    </span>
                                                </div>
                                            ))}
                                            {/* Pending Plantation Requests */}
                                            {farm.plantationRequests?.filter(r => r.status === 'pending').map((request) => (
                                                request.items.map((item, idx) => (
                                                    <div 
                                                        key={`${request.id}-${idx}`}
                                                        className="flex justify-between items-center p-3 rounded-xl bg-orange-50/50 border border-orange-100"
                                                    >
                                                        <span className="text-sm font-semibold text-gray-700">{item.tree?.name}</span>
                                                        <span className="text-[10px] font-black uppercase px-2 py-1 rounded-full bg-orange-100 text-orange-600">
                                                            TO BE PLANTED
                                                        </span>
                                                    </div>
                                                ))
                                            ))}
                                            {(farm.plants?.length || 0) + (farm.plantationRequests?.filter(r => r.status === 'pending').length || 0) > 3 && (
                                                <p className="text-xs text-center text-gray-400 font-bold py-1">More items assigned</p>
                                            )}
                                        </div>
                                    </div>

                                    <button 
                                        onClick={() => navigate(`/farmer/farm/${farm.id}/manage`)}
                                        className="mt-8 w-full bg-green-600 text-white font-bold py-4 rounded-2xl hover:bg-green-700 transition-all shadow-lg shadow-green-100 flex items-center justify-center group-hover:scale-[1.02]"
                                    >
                                        Manage All Plants
                                        <span className="ml-2 group-hover:translate-x-1 transition-transform">→</span>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default FarmerFarmsDashboard;
