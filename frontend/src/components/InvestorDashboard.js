import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { favoritesService, marketplaceService, investorDashboardService, plantationService, getMediaUrl } from '../services/api';
import PlantTreeModal from './PlantTreeModal';
import NotificationBell from './NotificationBell';

const InvestorDashboard = () => {
    const navigate = useNavigate();
    const [favorites, setFavorites] = useState([]);
    const [recommendations, setRecommendations] = useState([]);
    const [stats, setStats] = useState({ totalInvested: 0, activePlants: 0, upcomingHarvests: 0 });
    const [leasedFarms, setLeasedFarms] = useState([]);
    const [availableLands, setAvailableLands] = useState([]);
    const [plantationRequests, setPlantationRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isPlantModalOpen, setIsPlantModalOpen] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const [favData, recData, statsData, requestsData] = await Promise.all([
                    favoritesService.getFavorites(),
                    marketplaceService.getRecommendations(),
                    investorDashboardService.getStats(),
                    plantationService.getMyRequests().catch(() => ({ data: [] }))
                ]);
                setFavorites(favData);
                setRecommendations(recData);
                setStats(statsData);
                setLeasedFarms(statsData.leasedFarms || []);
                setAvailableLands(statsData.availableLands || []);
                setPlantationRequests(requestsData?.data || []);
            } catch (error) {
                console.error('Error fetching dashboard data:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const handleRemoveFavorite = async (id) => {
        try {
            await favoritesService.removeFavorite(id);
            setFavorites(favorites.filter(f => f.id !== id));
        } catch (error) {
            console.error('Error removing favorite:', error);
        }
    };

    const handleDeleteRequest = async (id) => {
        if (!window.confirm('Are you sure you want to cancel and delete this plantation request?')) return;
        try {
            await plantationService.deleteRequest(id);
            setPlantationRequests(prev => prev.filter(r => r.id !== id));
            alert('Request deleted successfully');
        } catch (error) {
            console.error('Error deleting request:', error);
            alert('Failed to delete request');
        }
    };


    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-green-600 border-t-transparent"></div>
        </div>
    );

    return (
        <>
            <div className="min-h-screen bg-gray-50 pb-20 font-sans">
            {/* Header / Stats Section */}
            <div className="bg-gradient-to-br from-green-800 to-emerald-900 pt-12 pb-16 px-4 shadow-2xl">
                <div className="container mx-auto">
                    <div className="flex flex-col lg:flex-row justify-between items-center gap-8">
                        <div className="flex items-center gap-6 text-center lg:text-left flex-col lg:flex-row">
                            <button
                                onClick={() => navigate(-1)}
                                className="group w-14 h-14 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl flex items-center justify-center text-white hover:bg-white/20 transition-all shadow-xl"
                            >
                                <span className="text-2xl group-hover:-translate-x-1 transition-transform">←</span>
                            </button>
                            <div>
                                <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight mb-2">Investor Dashboard</h2>
                                <p className="text-green-100/70 font-medium max-w-md mx-auto lg:mx-0">Empowering your agricultural portfolio with data-driven growth.</p>
                            </div>
                        </div>
                        <div className="flex flex-wrap justify-center gap-3 md:gap-4 items-center w-full lg:w-auto">
                            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md p-2 rounded-2xl border border-white/20">
                                <NotificationBell />
                            </div>
                            <button
                                onClick={() => navigate('/messages')}
                                className="flex-1 md:flex-none bg-white/10 backdrop-blur-md border border-white/20 text-white px-4 md:px-6 py-3 md:py-4 rounded-2xl font-black uppercase text-[10px] md:text-xs tracking-widest hover:bg-white/20 transition-all shadow-xl whitespace-nowrap"
                            >
                                💬 Messages
                            </button>
                            <button
                                onClick={() => navigate('/marketplace?tab=lands')}
                                className="flex-1 md:flex-none bg-white/10 backdrop-blur-md border border-white/20 text-white px-4 md:px-6 py-3 md:py-4 rounded-2xl font-black uppercase text-[10px] md:text-xs tracking-widest hover:bg-white/20 transition-all shadow-xl whitespace-nowrap"
                            >
                                🏞️ Land
                            </button>
                            <button
                                onClick={() => navigate('/marketplace?tab=farms')}
                                className="flex-1 md:flex-none bg-white/10 backdrop-blur-md border border-white/20 text-white px-4 md:px-6 py-3 md:py-4 rounded-2xl font-black uppercase text-[10px] md:text-xs tracking-widest hover:bg-white/20 transition-all shadow-xl whitespace-nowrap"
                            >
                                🚜 Farms
                            </button>
                            <button
                                onClick={() => setIsPlantModalOpen(true)}
                                className="w-full md:w-auto bg-white text-green-800 px-6 md:px-8 py-3 md:py-4 rounded-2xl font-black uppercase text-[10px] md:text-xs tracking-widest hover:bg-green-50 transition-all shadow-xl whitespace-nowrap"
                            >
                                🌳 Plant Tree
                            </button>
                            <button
                                onClick={() => navigate('/marketplace')}
                                className="w-full md:w-auto bg-white/10 backdrop-blur-md border border-white/20 text-white px-6 md:px-8 py-3 md:py-4 rounded-2xl font-black uppercase text-[10px] md:text-xs tracking-widest hover:bg-white/20 transition-all shadow-xl"
                            >
                                Marketplace →
                            </button>
                        </div>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        <div className="bg-white/10 backdrop-blur-xl p-8 rounded-[2rem] border border-white/10 text-white shadow-lg group hover:bg-white/15 transition-all">
                            <h3 className="text-[10px] uppercase tracking-widest font-black text-green-300/80 mb-3">Total Invested</h3>
                            <p className="text-4xl font-black tracking-tighter">Rs. {stats.totalInvested.toLocaleString()}</p>
                        </div>
                        <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-xl group hover:-translate-y-1 transition-all">
                            <h3 className="text-[10px] uppercase tracking-widest font-black text-gray-400 mb-3">Active Plants</h3>
                            <p className="text-4xl font-black text-gray-900 tracking-tighter">{stats.activePlants}</p>
                        </div>
                        <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-xl group hover:-translate-y-1 transition-all">
                            <h3 className="text-[10px] uppercase tracking-widest font-black text-gray-400 mb-3">Harvest Warnings</h3>
                            <p className="text-4xl font-black text-emerald-600 tracking-tighter">{stats.upcomingHarvests}</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 mt-16">
                {/* Managed Farms Section */}
                {leasedFarms.length > 0 && (
                    <div className="mb-16">
                        <div className="bg-white rounded-[2.5rem] p-8 md:p-12 shadow-sm border border-gray-100">
                            <div className="flex items-center gap-3 mb-8">
                                <span className="text-3xl">🏞️</span>
                                <h3 className="text-2xl font-black text-gray-900 tracking-tight">My Managed Farms</h3>
                                <span className="ml-auto bg-green-50 text-green-700 px-3 py-1 rounded-lg text-xs font-black uppercase tracking-widest border border-green-100">
                                    {leasedFarms.length} {leasedFarms.length === 1 ? 'Farm' : 'Farms'}
                                </span>
                            </div>
                            <div className="grid md:grid-cols-2 lg:grid-cols-2 gap-8">
                            {leasedFarms.map(farm => (
                                <div key={farm.id} className="bg-gray-50 rounded-[2.5rem] shadow-xl overflow-hidden border border-gray-200 hover:shadow-2xl transition-all group flex flex-col md:flex-row">
                                    <div className="md:w-1/3 h-48 md:h-auto relative overflow-hidden bg-gray-100">
                                        {farm.land?.landPhotos && JSON.parse(farm.land.landPhotos).length > 0 ? (
                                            <img
                                                src={getMediaUrl(JSON.parse(farm.land.landPhotos)[0])}
                                                alt={farm.farmName}
                                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-4xl bg-green-50">🌾</div>
                                        )}
                                        <div className="absolute top-4 left-4">
                                            <span className="bg-white/90 backdrop-blur px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest text-green-600 shadow-sm border border-green-100">Leased</span>
                                        </div>
                                    </div>
                                    <div className="md:w-2/3 p-8 flex flex-col bg-white">
                                        <div className="mb-6 flex justify-between items-start">
                                            <div>
                                                <h4 className="text-xl font-black text-gray-900 group-hover:text-green-600 transition-colors tracking-tight mb-1">{farm.land?.landName || farm.farmName}</h4>
                                                <p className="text-xs text-gray-400 font-bold uppercase tracking-tight flex items-center gap-1">
                                                    <span className="text-blue-500">📍</span> {farm.land?.city}, {farm.land?.state}
                                                </p>
                                            </div>
                                            <button
                                                onClick={() => navigate(`/farms/${farm.id}`)}
                                                className="p-3 bg-gray-50 rounded-xl hover:bg-green-600 hover:text-white transition-all text-xs font-black shadow-sm"
                                            >
                                                Details
                                            </button>
                                        </div>

                                        <div className="grid grid-cols-3 gap-3 mb-6">
                                            <div className="bg-white p-3 rounded-2xl border border-gray-200 text-center shadow-sm">
                                                <span className="text-[8px] uppercase font-black text-gray-400 block mb-1 tracking-tighter">Soil</span>
                                                <span className="text-sm font-black text-gray-900">{farm.land?.soilQuality || '4'}/5</span>
                                            </div>
                                            <div className="bg-white p-3 rounded-2xl border border-gray-200 text-center shadow-sm">
                                                <span className="text-[8px] uppercase font-black text-gray-400 block mb-1 tracking-tighter">Water</span>
                                                <span className="text-sm font-black text-gray-900">{farm.land?.waterAvailability || '5'}/5</span>
                                            </div>
                                            <div className="bg-white p-3 rounded-2xl border border-gray-200 text-center shadow-sm">
                                                <span className="text-[8px] uppercase font-black text-gray-400 block mb-1 tracking-tighter">Sun</span>
                                                <span className="text-sm font-black text-gray-900">{farm.land?.sunlightExposure || '4'}/5</span>
                                            </div>
                                            {farm.hasManualLease && (
                                                <div className="bg-green-50 p-3 rounded-2xl border border-green-200 text-center shadow-sm">
                                                    <span className="text-[8px] uppercase font-black text-green-700 block mb-1 tracking-tighter italic">Leased Area</span>
                                                    <span className="text-sm font-black text-green-800">{Number(farm.totalArea || 0).toFixed(1)} {farm.areaUnit || farm.land?.areaUnit || 'Marla'}</span>
                                                </div>
                                            )}
                                        </div>

                                        <div className="mt-auto">
                                            <p className="text-[9px] uppercase font-black text-gray-400 mb-3 tracking-widest">Growth Recommendations</p>
                                            <div className="flex flex-wrap gap-2">
                                                {farm.land?.cultivablePlants ? (
                                                    JSON.parse(farm.land.cultivablePlants).map((p, idx) => (
                                                        <span key={idx} className="bg-green-50 text-green-700 px-3 py-1 rounded-lg text-[10px] font-black border border-green-100">
                                                            {p}
                                                        </span>
                                                    ))
                                                ) : (
                                                    <span className="text-[10px] text-gray-400 italic">No recommendations yet</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
                )}

                {/* Available for Investment Section */}
                {availableLands.length > 0 && (
                    <div className="mb-16">
                        <div className="flex items-center gap-3 mb-8">
                            <span className="text-3xl">✨</span>
                            <h3 className="text-2xl font-black text-gray-900 tracking-tight">Available Land for Partnership</h3>
                        </div>
                        <div className="grid md:grid-cols-3 lg:grid-cols-3 gap-6">
                            {availableLands.map(land => (
                                <div key={land.id} className="bg-white rounded-3xl p-6 border border-gray-100 shadow-md hover:shadow-xl transition-all group flex flex-col">
                                    <div className="h-40 bg-gray-50 rounded-2xl mb-4 overflow-hidden relative">
                                        {land.landPhotos && JSON.parse(land.landPhotos).length > 0 ? (
                                            <img
                                                src={getMediaUrl(JSON.parse(land.landPhotos)[0])}
                                                alt={land.landName}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-3xl">🏞️</div>
                                        )}
                                        <div className="absolute top-3 right-3">
                                            <span className="bg-primary-600 text-white text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-lg shadow-lg">New</span>
                                        </div>
                                    </div>
                                    <h4 className="font-black text-gray-900 group-hover:text-primary-600 transition-colors mb-1">{land.landName}</h4>
                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-4">📍 {land.city}, {land.state}</p>

                                    <div className="mt-auto pt-4 border-t border-gray-50 flex justify-between items-center">
                                        <div className="flex flex-col">
                                            <span className="text-lg font-black text-gray-900">{land.remainingArea.toFixed(1)}</span>
                                            <span className="text-[8px] uppercase font-black text-gray-400 tracking-tighter">Available {land.areaUnit}</span>
                                        </div>
                                        <button
                                            onClick={() => navigate(`/investor/lease/${land.id}`)}
                                            className="px-4 py-2 bg-gray-900 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-primary-600 transition-all"
                                        >
                                            Partner Now
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Plantation Requests Section */}
                {plantationRequests.length > 0 && (
                    <div className="mb-16">
                        <div className="flex items-center gap-3 mb-8">
                            <span className="text-3xl">🌳</span>
                            <h3 className="text-2xl font-black text-gray-900 tracking-tight">My Plantation Requests</h3>
                        </div>
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {plantationRequests.map(request => (
                                <div key={request.id} className="bg-white rounded-3xl p-6 border border-gray-100 shadow-md flex flex-col hover:shadow-xl transition-shadow">
                                    <div className="flex justify-between items-center mb-4">
                                        <div className="flex flex-col">
                                            <span className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">
                                                {new Date(request.createdAt).toLocaleDateString()}
                                            </span>
                                            {request.farm && (
                                                <span className="text-xs font-bold text-green-700 bg-green-50 px-2 py-1 rounded w-fit uppercase tracking-tighter">
                                                    📍 {request.farm.land?.landName || request.farm.farmName}
                                                </span>
                                            )}
                                        </div>
                                        <span className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-full 
                                            ${request.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                                                request.status === 'approved' ? 'bg-blue-100 text-blue-700' :
                                                    request.status === 'planted' ? 'bg-green-100 text-green-700' :
                                                        'bg-red-100 text-red-700'}`}
                                        >
                                            {request.status}
                                        </span>
                                    </div>
                                    <div className="space-y-4 flex-1">
                                        {request.items.map(item => (
                                            <div key={item.id} className="flex justify-between items-center bg-gray-50 p-3 rounded-2xl">
                                                <div className="flex items-center gap-3">
                                                    <span className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-sm shadow-sm">
                                                        🪴
                                                    </span>
                                                    <div>
                                                        <h5 className="text-sm font-bold text-gray-900">{item.tree?.name}</h5>
                                                        <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Qty: {item.quantity}</p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <span className="text-sm font-black text-green-700">Rs. {Number(item.totalPrice || 0).toLocaleString()}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="mt-6 pt-4 border-t border-gray-100 flex flex-col gap-2">
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Total Amount</span>
                                            <span className="text-xl font-black text-gray-900">Rs. {Number(request.totalPrice || 0).toLocaleString()}</span>
                                        </div>
                                        {request.status === 'pending' && (
                                            <div className="mt-3 flex flex-col gap-2">
                                                <div className="flex justify-between items-center bg-amber-50/50 p-3 rounded-2xl border border-amber-100/50">
                                                    <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest">Payment Status</span>
                                                    <span className="text-[10px] font-black text-amber-700 uppercase tracking-widest">Pending</span>
                                                </div>
                                                <button
                                                    onClick={() => navigate(`/investor/checkout/lease/${request.farmId || request.farm?.id}`)}
                                                    className="w-full py-4 bg-gray-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-green-600 transition-all shadow-lg shadow-gray-200 flex items-center justify-center gap-2 group"
                                                >
                                                    <span>💳</span> Pay Now
                                                    <span className="group-hover:translate-x-1 transition-transform">→</span>
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteRequest(request.id)}
                                                    className="w-full py-3 bg-red-50 text-red-600 border border-red-100 rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all flex items-center justify-center gap-2"
                                                >
                                                    <span>🗑️</span> Delete Request
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div className="grid lg:grid-cols-12 gap-12 mt-12 mb-20">
                    {/* Recommendations Side */}
                    <div className="lg:col-span-8">
                        <div className="flex items-center justify-between mb-8 px-2">
                            <h3 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                                <span className="text-2xl">💡</span> Smart Recommendations
                            </h3>
                            <button onClick={() => navigate('/marketplace')} className="text-xs font-black text-green-600 hover:text-green-700 uppercase tracking-widest transition-colors">Browse Marketplace</button>
                        </div>
                        <div className="grid md:grid-cols-2 gap-6">
                            {recommendations.slice(0, 4).map(plant => (
                                <div key={plant.id} className="bg-white border border-black/5 rounded-[2rem] p-6 hover:shadow-xl transition-all cursor-pointer group shadow-md" onClick={() => navigate(`/marketplace/plants/${plant.id}`)}>
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="w-12 h-12 bg-green-50 rounded-2xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">🌱</div>
                                        <span className="text-[9px] font-black bg-gray-900 text-white px-3 py-1 rounded-full uppercase tracking-widest">{plant.cropType?.category}</span>
                                    </div>
                                    <h4 className="font-black text-gray-900 text-lg mb-1 group-hover:text-green-600 transition-colors uppercase tracking-tight">{plant.cropType?.name}</h4>
                                    <p className="text-xs text-gray-400 font-bold mb-4 uppercase tracking-tighter">{plant.farm?.farmName}</p>
                                    <div className="flex justify-between items-center py-4 border-t border-gray-50">
                                        <span className="text-lg font-black text-green-700">Rs {plant.maintenanceFeeMonthly?.toLocaleString()} <span className="text-[10px] text-gray-400">/mo</span></span>
                                        <button className="p-2 bg-gray-50 rounded-lg group-hover:bg-green-600 group-hover:text-white transition-all">→</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Favorites Side */}
                    <div className="lg:col-span-4">
                        <h3 className="text-2xl font-black text-gray-900 tracking-tight mb-8 flex items-center gap-3">
                            <span className="text-2xl">⭐</span> My Favorites
                        </h3>
                        <div className="space-y-4">
                            {favorites.length === 0 ? (
                                <div className="bg-white rounded-[2rem] p-10 text-center border border-dashed border-gray-200">
                                    <p className="text-gray-400 text-sm font-bold uppercase tracking-widest mb-6">Your list is empty</p>
                                    <button onClick={() => navigate('/marketplace')} className="w-full py-4 bg-green-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-green-700 shadow-xl shadow-green-600/20 transition-all">Explore</button>
                                </div>
                            ) : (
                                favorites.map(fav => (
                                    <div key={fav.id} className="bg-white rounded-2xl shadow-sm hover:shadow-lg transition-all border border-black/5 overflow-hidden flex items-center p-3 relative group">
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleRemoveFavorite(fav.id); }}
                                            className="absolute -top-1 -right-1 bg-white border border-gray-100 shadow-sm rounded-full w-8 h-8 flex items-center justify-center text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all scale-75 group-hover:scale-100 z-10"
                                        >✕</button>
                                        <div className="w-16 h-16 rounded-xl bg-gray-50 overflow-hidden shrink-0">
                                            {fav.farm?.photos?.[0] ? <img src={getMediaUrl(fav.farm.photos[0].photoUrl)} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-xl">🚜</div>}
                                        </div>
                                        <div className="ml-4 flex-1 pr-6" onClick={() => navigate(fav.farm ? `/marketplace/farms/${fav.farm.id}` : `/marketplace/plants/${fav.plant.id}`)}>
                                            <h5 className="text-sm font-black text-gray-900 truncate">{fav.farm?.farmName || fav.plant?.cropType?.name}</h5>
                                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{fav.farm ? 'Farm' : 'Plant'}</p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Modals */}
            <PlantTreeModal
                isOpen={isPlantModalOpen}
                onClose={() => setIsPlantModalOpen(false)}
                leasedFarms={leasedFarms}
                availableLands={availableLands}
                onSuccess={() => {
                    // Refresh data
                    plantationService.getMyRequests().then(res => setPlantationRequests(res.data || []));
                }}
            />
            </div>
        </>
    );
};

export default InvestorDashboard;
