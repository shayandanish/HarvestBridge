import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { marketplaceService, favoritesService } from '../services/api';
import { useAuth } from '../context/AuthContext';

const FarmPublicPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();

    const [farm, setFarm] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');

    useEffect(() => {
        const fetchFarm = async () => {
            setLoading(true);
            try {
                const data = await marketplaceService.getFarmDetails(id);
                setFarm(data);
            } catch (error) {
                console.error('Error fetching farm details:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchFarm();
    }, [id]);

    const handleAddToFavorites = async () => {
        if (!isAuthenticated) return navigate('/login');
        try {
            await favoritesService.addFavorite({ farmId: farm.id });
            alert('Added to favorites!');
        } catch (error) {
            console.error('Error adding to favorites:', error);
            alert('Failed to add to favorites (or already added).');
        }
    };

    if (loading) return <div className="text-center py-20">Loading...</div>;
    if (!farm) return <div className="text-center py-20">Farm not found.</div>;

    return (
        <div className="bg-gray-50 min-h-screen pb-12">
            {/* Header/Cover */}
            <div className="relative h-64 md:h-80 bg-gray-800">
                {farm.photos && farm.photos.length > 0 ? (
                    <img
                        src={farm.photos[0].photoUrl}
                        alt={farm.farmName}
                        className="w-full h-full object-cover opacity-70"
                    />
                ) : null}
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center text-white px-4">
                        <h1 className="text-4xl md:text-5xl font-bold mb-2 shadow-sm">{farm.farmName}</h1>
                        <p className="text-xl flex items-center justify-center shadow-sm">
                            <span className="mr-2">📍</span> {farm.land?.city}, {farm.land?.state}, {farm.land?.country}
                        </p>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 -mt-10 relative z-10">
                <div className="bg-white rounded-lg shadow-lg p-6 md:p-8">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
                        <div className="flex space-x-4 mb-4 md:mb-0">
                            <button
                                onClick={() => setActiveTab('overview')}
                                className={`px-4 py-2 font-medium rounded-full transition ${activeTab === 'overview' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                            >
                                Overview
                            </button>
                            <button
                                onClick={() => setActiveTab('plants')}
                                className={`px-4 py-2 font-medium rounded-full transition ${activeTab === 'plants' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                            >
                                Available Plants ({farm.plants ? farm.plants.length : 0})
                            </button>
                            <button
                                onClick={() => setActiveTab('visit')}
                                className={`px-4 py-2 font-medium rounded-full transition ${activeTab === 'visit' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                            >
                                Plan Your Visit
                            </button>
                        </div>
                        <div className="flex space-x-3">
                            <button
                                onClick={handleAddToFavorites}
                                className="border border-gray-300 text-gray-700 px-4 py-2 rounded-full hover:bg-gray-50 flex items-center"
                            >
                                ❤️ Save
                            </button>
                            <button
                                onClick={() => navigate(`/farms/${farm.id}/book`)}
                                className="bg-green-600 text-white px-6 py-2 rounded-full hover:bg-green-700 shadow-md font-medium"
                            >
                                Book a Visit
                            </button>
                            <button className="bg-blue-600 text-white px-6 py-2 rounded-full hover:bg-blue-700 shadow-md">
                                Contact Farmer
                            </button>
                        </div>
                    </div>

                    {activeTab === 'overview' && (
                        <div className="grid md:grid-cols-3 gap-8">
                            <div className="md:col-span-2">
                                <h3 className="text-2xl font-bold text-gray-800 mb-4">About the Farm</h3>
                                <p className="text-gray-600 leading-relaxed mb-6">
                                    {farm.description || "No description provided."}
                                </p>

                                <div className={`grid grid-cols-2 md:grid-cols-${!farm.isDirectPlanting ? '4' : '3'} gap-6 border-t border-gray-100 pt-6 mb-8`}>
                                    {!farm.isDirectPlanting && (
                                        <div className="bg-green-50/50 p-4 rounded-2xl border border-green-100 text-center">
                                            <span className="block text-[10px] uppercase font-bold text-green-700 mb-1">Total Area</span>
                                            <span className="text-lg font-black text-green-900">{farm.totalArea} {farm.areaUnit}</span>
                                        </div>
                                    )}
                                    <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100 text-center">
                                        <span className="block text-[10px] uppercase font-bold text-blue-700 mb-1">Organic</span>
                                        <span className="text-lg font-black text-blue-900">{farm.isOrganic ? 'Yes' : 'No'}</span>
                                    </div>
                                    <div className="bg-orange-50/50 p-4 rounded-2xl border border-orange-100 text-center">
                                        <span className="block text-[10px] uppercase font-bold text-orange-700 mb-1">Plants</span>
                                        <span className="text-lg font-black text-orange-900">{farm.plants ? farm.plants.length : 0}</span>
                                    </div>
                                    <div className="bg-purple-50/50 p-4 rounded-2xl border border-purple-100 text-center">
                                        <span className="block text-[10px] uppercase font-bold text-purple-700 mb-1">Rating</span>
                                        <span className="text-lg font-black text-purple-900">{farm.farmer?.rating ? `${farm.farmer.rating}/5` : 'New'}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-gray-50 p-6 rounded-lg h-fit">
                                <h4 className="font-bold text-gray-800 mb-4">Farmer Profile</h4>
                                <div className="flex items-center mb-4">
                                    <div className="h-12 w-12 rounded-full bg-gray-300 flex items-center justify-center text-xl font-bold text-gray-600 mr-3">
                                        {farm.farmer?.user?.fullName?.charAt(0)}
                                    </div>
                                    <div>
                                        <p className="font-bold text-gray-900">{farm.farmer?.user?.fullName}</p>
                                        <p className="text-sm text-gray-500">Joined {new Date(farm.farmer?.user?.createdAt).getFullYear()}</p>
                                    </div>
                                </div>
                                <div className="mb-4">
                                    <p className="text-sm text-gray-600 mb-1">Rating</p>
                                    <div className="flex text-yellow-500">
                                        {'⭐'.repeat(Math.round(farm.farmer?.rating || 5))}
                                        <span className="ml-2 text-gray-500 text-sm">({farm.farmer?.totalReviews || 0} reviews)</span>
                                    </div>
                                </div>
                                <div className="mb-4">
                                    <h5 className="text-sm font-semibold text-gray-700 mb-1">Specialization</h5>
                                    <p className="text-sm text-gray-600">{farm.farmer?.specialization || "General Farming"}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'visit' && (
                        <div className="grid md:grid-cols-2 gap-8">
                            <div>
                                <h3 className="text-2xl font-bold text-gray-800 mb-6">Availability Schedule</h3>
                                <div className="space-y-4">
                                    {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map(day => {
                                        const daySlots = farm.availability?.filter(a => a.dayOfWeek === day && a.isActive);
                                        return (
                                            <div key={day} className="flex justify-between items-center border-b border-gray-100 pb-2">
                                                <span className="capitalize font-medium text-gray-700">{day}</span>
                                                <span className="text-gray-600">
                                                    {daySlots?.length > 0
                                                        ? daySlots.map(s => `${s.startTime} - ${s.endTime}`).join(', ')
                                                        : 'Closed'}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>

                                {farm.blackoutDates?.length > 0 && (
                                    <div className="mt-8">
                                        <h4 className="font-bold text-red-600 mb-3 text-lg">Blackout Dates</h4>
                                        <ul className="list-disc list-inside text-gray-600 space-y-1">
                                            {farm.blackoutDates.map((b, idx) => (
                                                <li key={idx}>
                                                    {new Date(b.blackoutDate).toLocaleDateString()}: {b.reason}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>

                            <div>
                                <h3 className="text-2xl font-bold text-gray-800 mb-6">Additional Activities</h3>
                                <div className="space-y-4">
                                    {farm.activities?.length > 0 ? (
                                        farm.activities.map(activity => (
                                            <div key={activity.id} className="bg-gray-50 p-4 rounded-lg transform hover:scale-[1.02] transition">
                                                <div className="flex justify-between font-bold mb-1">
                                                    <span className="text-gray-800">{activity.activityName}</span>
                                                    <span className="text-green-600">${activity.pricePerPerson}/person</span>
                                                </div>
                                                <p className="text-sm text-gray-600">{activity.description}</p>
                                                <div className="mt-2 text-xs text-gray-400">
                                                    Duration: {activity.durationMinutes} mins | Capacity: {activity.maxParticipants} max
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-gray-500 italic">No specific activities listed yet. Just a peaceful farm walk!</p>
                                    )}
                                </div>

                                <div className="mt-8 bg-green-50 p-6 rounded-lg text-center">
                                    <h4 className="font-bold text-green-800 mb-2">Ready to visit?</h4>
                                    <p className="text-green-700 text-sm mb-4">Book your slot now to experience farm life firsthand.</p>
                                    <button
                                        onClick={() => navigate(`/farms/${farm.id}/book`)}
                                        className="bg-green-600 text-white px-8 py-3 rounded-full hover:bg-green-700 shadow-md font-bold transition"
                                    >
                                        Book Now
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'plants' && (
                        <div>
                            <h3 className="text-2xl font-bold text-gray-800 mb-6">Invest in Crops</h3>
                            {farm.plants && farm.plants.length > 0 ? (
                                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {farm.plants.map(plant => (
                                        <div key={plant.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-lg transition">
                                            <div className="flex justify-between items-start mb-2">
                                                <h4 className="font-bold text-lg text-gray-800">{plant.cropType?.name}</h4>
                                                <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">Available</span>
                                            </div>
                                            <p className="text-sm text-gray-500 mb-4">Variety: {plant.cropType?.variety}</p>

                                            <div className="space-y-2 mb-4">
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-gray-600">Expected Harvest</span>
                                                    <span className="font-medium">{new Date(plant.expectedHarvestDate).toLocaleDateString()}</span>
                                                </div>
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-gray-600">Monthly Fee</span>
                                                    <span className="font-medium text-green-700">${plant.maintenanceFeeMonthly || 'N/A'}</span>
                                                </div>
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-gray-600">Est. Yield</span>
                                                    <span className="font-medium">{plant.expectedYield || 'TBD'} {plant.yieldUnit}</span>
                                                </div>
                                            </div>

                                            <button className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 font-semibold">
                                                Invest Now
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-gray-500 italic">No plants currently available for investment on this farm.</p>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default FarmPublicPage;
