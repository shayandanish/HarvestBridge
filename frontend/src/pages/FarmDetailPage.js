import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { farmerService } from '../services/farmerService';
import { marketplaceService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import AddPlantModal from '../components/AddPlantModal';

const FarmDetailPage = () => {
    const { farmId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [farm, setFarm] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isAddPlantModalOpen, setIsAddPlantModalOpen] = useState(false);

    const getPhotoUrl = (url) => {
        if (!url) return null;
        if (url.startsWith('http')) return url;
        const baseUrl = process.env.REACT_APP_API_URL?.replace('/api/v1', '') || 'http://localhost:5000';
        return `${baseUrl}${encodeURI(url)}`;
    };

    const fetchFarmDetails = async () => {
        try {
            setLoading(true);
            const data = user?.role === 'farmer' 
                ? await farmerService.getFarmById(farmId)
                : await marketplaceService.getFarmDetails(farmId);
            setFarm(data);
            setError(null);
        } catch (err) {
            console.error('Error fetching farm details:', err);
            setError('Failed to load farm details.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (farmId) {
            fetchFarmDetails();
        }
    }, [farmId]);

    if (loading) return <div className="text-center py-10">Loading farm details...</div>;
    if (error) return <div className="text-center py-10 text-red-600">{error}</div>;
    if (!farm) return <div className="text-center py-10">Farm not found.</div>;

    return (
        <div className="container mx-auto px-4 py-8">
            <button
                onClick={() => navigate(user?.role === 'investor' ? '/investor/investments' : '/dashboard')}
                className="mb-6 text-green-600 hover:underline flex items-center"
            >
                ← {user?.role === 'investor' ? 'Back to Investments' : 'Back to Dashboard'}
            </button>

            {/* Investor Trees Section - Only for Direct Planting */}
            {farm?.isDirectPlanting && farm?.plantationRequests && farm?.plantationRequests.length > 0 && (
                <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6 border border-gray-200">
                    <div className="bg-gradient-to-r from-green-600 to-green-700 text-white p-4">
                        <h2 className="text-xl font-bold flex items-center">
                            <span className="mr-2">🌳</span>
                            Investor Selected Trees
                        </h2>
                        <p className="text-green-100 text-sm mt-1">
                            Trees selected and paid for by investors
                        </p>
                    </div>
                    <div className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {farm.plantationRequests.map((request, reqIndex) => (
                                <div key={request.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                                    <div className="flex items-center justify-between mb-3">
                                        <span className={`px-2 py-1 rounded text-xs font-bold ${
                                            request.status === 'approved' ? 'bg-green-100 text-green-800' :
                                            request.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                            request.status === 'planted' ? 'bg-blue-100 text-blue-800' :
                                            'bg-gray-100 text-gray-800'
                                        }`}>
                                            {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                                        </span>
                                        <span className="text-sm text-gray-500">
                                            {new Date(request.createdAt).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <div className="space-y-2">
                                        {request.items.map((item, itemIndex) => (
                                            <div key={item.id} className="flex items-center justify-between bg-white rounded p-3 border border-gray-300">
                                                <div className="flex items-center">
                                                    <span className="text-2xl mr-3">🌱</span>
                                                    <div>
                                                        <h4 className="font-semibold text-gray-900">{item.tree.name}</h4>
                                                        <p className="text-sm text-gray-500">Quantity: {item.quantity}</p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-bold text-green-600">${item.pricePerTree}</p>
                                                    <p className="text-xs text-gray-500">per tree</p>
                                                </div>
                                            </div>
                                        ))}
                                        <div className="pt-2 border-t border-gray-200">
                                            <div className="flex justify-between items-center">
                                                <span className="text-sm text-gray-600">Total Investment:</span>
                                                <span className="font-bold text-lg text-green-600">
                                                    ${request.totalPrice}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8 border border-gray-200">
                <div className="p-8">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 mb-2">{farm.farmName}</h1>
                            <p className="text-gray-600 flex items-center">
                                {farm.land?.city}, {farm.land?.state}, {farm.land?.country}
                            </p>
                        </div>
                        {user?.role === 'investor' && !farm.farmerId && (
                            <button
                                onClick={() => navigate(`/farmers?farmId=${farm.id}`)}
                                className="bg-blue-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-100"
                            >
                                🤝 Hire Farmer for Project
                            </button>
                        )}
                        {user?.role === 'farmer' && (farm?.farmerId === user?.id || farm?.farmer?.userId === user?.id) && (
                            <button
                                onClick={() => navigate(`/farmer/farm/${farm.id}/manage`)}
                                className="bg-emerald-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100"
                            >
                                🚜 Manage This Farm
                            </button>
                        )}
                    </div>

                    <p className="text-gray-700 mb-6 leading-relaxed">
                        {farm.description}
                    </p>

                    <div className={`grid grid-cols-1 md:grid-cols-3 gap-6 border-t border-gray-100 pt-6`}>
                        <div>
                            <span className="block text-sm text-gray-500 mb-1">Status</span>
                            <span className="text-lg font-semibold text-gray-900">{farm.status || 'Active'}</span>
                        </div>
                        <div>
                            <span className="block text-sm text-gray-500 mb-1">Type</span>
                            <span className="text-lg font-semibold text-gray-900">{farm.isOrganic ? 'Organic' : 'Conventional'}</span>
                        </div>
                        <div>
                            <span className="block text-sm text-gray-500 mb-1">Crops Planted</span>
                            <span className="text-lg font-semibold text-gray-900">
                                {(() => {
                                    const plantCount = farm.plants?.length || 0;
                                    const pendingCount = farm.plantationRequests?.filter(r => r.status === 'pending').reduce((total, req) => 
                                        total + req.items.reduce((itemTotal, item) => itemTotal + item.quantity, 0), 0) || 0;
                                    return plantCount + pendingCount;
                                })()}
                                {farm.plantationRequests?.some(r => r.status === 'pending') && (
                                    <span className="text-sm text-orange-500 ml-2">
                                        (+{farm.plantationRequests.filter(r => r.status === 'pending').reduce((total, req) => 
                                            total + req.items.reduce((itemTotal, item) => itemTotal + item.quantity, 0), 0)} New)
                                    </span>
                                )}
                                {farm.plantationRequests?.some(r => r.status === 'approved') && (
                                    <span className="text-sm text-green-500 ml-2">
                                        (+{farm.plantationRequests.filter(r => r.status === 'approved').reduce((total, req) => 
                                            total + req.items.reduce((itemTotal, item) => itemTotal + item.quantity, 0), 0)} Work)
                                    </span>
                                )}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* My Plants Section */}
            <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200 mb-8">
                <div className="mb-6">
                    <h2 className="text-2xl font-bold text-gray-800">🌱 My Plants</h2>
                    <p className="text-sm text-gray-500 mt-1">Plants from investor investments</p>
                </div>

                {!farm.isApproved && (
                    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
                        <p className="text-yellow-700">
                            Your farm is pending approval. Plants will be visible once approved.
                        </p>
                    </div>
                )}

                {!farm.plants || farm.plants.length === 0 ? (
                    <div className="text-center py-10 bg-gray-50 rounded-lg">
                        <div className="text-6xl mb-4">🌱</div>
                        <p className="text-gray-500 mb-2">No plants available yet.</p>
                        <p className="text-sm text-gray-400">Plants will appear here after investor investments are processed.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {farm.plants.map((plant) => (
                            <div key={plant.id} className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
                                {/* Plant Status Header */}
                                <div className={`p-4 text-white ${
                                    plant.status === 'harvested' ? 'bg-blue-600' :
                                    plant.status === 'ready_for_harvest' ? 'bg-orange-500' :
                                    plant.status === 'growing' ? 'bg-green-600' :
                                    plant.status === 'planted' ? 'bg-emerald-600' :
                                    'bg-gray-600'
                                }`}>
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h3 className="text-lg font-bold">{plant.cropType?.name}</h3>
                                            <p className="text-sm opacity-90">{plant.cropType?.variety || 'Standard'}</p>
                                        </div>
                                        <div className="text-right">
                                            <div className={`px-2 py-1 rounded-full text-xs font-bold ${
                                                plant.status === 'harvested' ? 'bg-white text-blue-600' :
                                                plant.status === 'ready_for_harvest' ? 'bg-white text-orange-500' :
                                                plant.status === 'growing' ? 'bg-white text-green-600' :
                                                plant.status === 'planted' ? 'bg-white text-emerald-600' :
                                                'bg-white text-gray-600'
                                            }`}>
                                                {plant.status === 'harvested' ? '🌾 Harvested' :
                                                 plant.status === 'ready_for_harvest' ? '🟡 Ready' :
                                                 plant.status === 'growing' ? '🌿 Growing' :
                                                 plant.status === 'planted' ? '🌱 Planted' :
                                                 ''}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Plant Image */}
                                {(() => {
                                    const photoUrl = (plant.photos && plant.photos.length > 0) 
                                        ? plant.photos[0].photoUrl 
                                        : (farm.trackingPhotos && farm.trackingPhotos.length > 0) 
                                            ? farm.trackingPhotos[0].photoUrl 
                                            : null;

                                    if (photoUrl) {
                                        return (
                                            <div className="overflow-hidden h-64 border-b border-gray-100">
                                                <img 
                                                    src={getPhotoUrl(photoUrl)} 
                                                    alt={plant.cropType?.name}
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                        );
                                    }

                                    return (
                                        <div className="bg-gray-100 h-48 flex items-center justify-center text-gray-300 border-b border-gray-100">
                                            <span className="text-5xl">🌱</span>
                                        </div>
                                    );
                                })()}

                                {/* Plant Details */}
                                <div className="p-4 bg-gray-50">
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-gray-500">Planted On:</span>
                                            <span className="text-sm font-medium">{new Date(plant.plantDate).toLocaleDateString()}</span>
                                        </div>

                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-gray-500">Location:</span>
                                            <span className="text-sm font-medium">{plant.locationInFarm || 'Not specified'}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Farm Timeline Section */}
            <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200 mb-8">
                <div className="mb-6 flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800">📈 Farm Timeline</h2>
                        <p className="text-sm text-gray-500 mt-1">Recent activities and growth updates</p>
                    </div>
                </div>

                {(!farm.trackingActivities || farm.trackingActivities.length === 0) && (!farm.trackingPhotos || farm.trackingPhotos.length === 0) ? (
                    <div className="text-center py-10 bg-gray-50 rounded-lg">
                        <div className="text-6xl mb-4">📅</div>
                        <p className="text-gray-500">No updates logged yet.</p>
                    </div>
                ) : (
                    <div className="relative">
                        {/* Vertical line for the timeline */}
                        <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gray-100"></div>

                        <div className="space-y-8 relative">
                            {[...(farm.trackingActivities || []), ...(farm.trackingPhotos || [])]
                                .sort((a, b) => new Date(b.activityDate || b.takenDate) - new Date(a.activityDate || a.takenDate))
                                .map((item, index) => {
                                    const isPhoto = !!item.photoUrl;
                                    const date = new Date(item.activityDate || item.takenDate);

                                    return (
                                        <div key={item.id || index} className="flex flex-col md:flex-row gap-4">
                                            {/* Date/Time column */}
                                            <div className="flex items-center gap-4 md:w-48 flex-shrink-0">
                                                <div className="w-16 h-16 rounded-full bg-emerald-50 border-4 border-white shadow-sm flex items-center justify-center z-10">
                                                    {isPhoto ? '📷' : (item.activityType === 'watering' ? '💧' : '🌱')}
                                                </div>
                                                <div className="md:text-right">
                                                    <p className="font-bold text-gray-900">{date.toLocaleDateString()}</p>
                                                    <p className="text-xs text-gray-500">{date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                                </div>
                                            </div>

                                            {/* Content column */}
                                            <div className="flex-1 bg-gray-50 rounded-2xl p-4 border border-gray-100">
                                                <h4 className="font-bold text-gray-900 mb-1">
                                                    {item.activityType ? item.activityType.charAt(0).toUpperCase() + item.activityType.slice(1) : 'Photo Update'}
                                                </h4>
                                                <p className="text-gray-700 mb-3">{item.description || item.caption || item.notes}</p>
                                                
                                                {isPhoto && (
                                                    <div className="rounded-xl overflow-hidden max-w-md border border-gray-200">
                                                        <img 
                                                            src={getPhotoUrl(item.photoUrl)} 
                                                            alt={item.caption || 'Growth update'} 
                                                            className="w-full h-auto"
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                        </div>
                    </div>
                )}
            </div>

            <AddPlantModal
                isOpen={isAddPlantModalOpen}
                onClose={() => setIsAddPlantModalOpen(false)}
                farmId={farmId}
                onPlantAdded={fetchFarmDetails}
                // Showing all crop types for consistency
                cultivablePlants={[]}
            />
        </div>
    );
};

export default FarmDetailPage;
