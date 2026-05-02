import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { landService } from '../services/landService';
import { getMediaUrl } from '../services/api';

const LandownerDashboard = () => {
    const navigate = useNavigate();
    const [lands, setLands] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchLands = async () => {
        try {
            setLoading(true);
            const data = await landService.getMyLands();
            setLands(data.data || data || []);
            setError(null);
        } catch (err) {
            console.error('Error fetching lands:', err);
            setError('Failed to load lands. Please try again later.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchLands(); }, []);

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this land? This action cannot be undone.')) {
            try {
                await landService.deleteLand(id);
                setLands(lands.filter(land => land.id !== id));
            } catch (err) {
                alert('Failed to delete land. It might have active farms.');
            }
        }
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center py-20 px-4">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-green-600 border-t-transparent mb-4"></div>
            <p className="text-gray-500 font-medium animate-pulse">Gathering your property data...</p>
        </div>
    );

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            {/* Header Section */}
            <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-green-900/5 p-8 mb-12 border border-green-50 flex flex-col md:flex-row justify-between items-center gap-6">
                <div className="text-center md:text-left">
                    <h2 className="text-4xl font-black text-gray-900 tracking-tight leading-tight mb-2">My Property Portfolio</h2>
                    <p className="text-green-600 font-semibold tracking-wide uppercase text-xs">Manage and monitor your registered land</p>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-4">
                    <button 
                        onClick={() => navigate('/landowner/my-lands')}
                        className="px-6 py-3 bg-gray-50 text-gray-700 font-bold rounded-2xl hover:bg-gray-100 transition-all border border-gray-200 shadow-sm"
                    >
                        Detailed View
                    </button>
                    <button 
                        onClick={() => navigate('/landowner/add-land')}
                        className="px-8 py-3 bg-green-600 text-white font-black rounded-2xl hover:bg-green-700 hover:scale-105 active:scale-95 transition-all shadow-xl shadow-green-600/20 flex items-center gap-2"
                    >
                        <span className="text-xl">+</span> Add New Land
                    </button>
                </div>
            </div>

            {error && (
                <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-6 rounded-2xl mb-8 shadow-sm flex items-center gap-4">
                    <span className="text-2xl">⚠️</span>
                    <p className="font-semibold">{error}</p>
                </div>
            )}

            {lands.length === 0 ? (
                <div className="text-center py-24 bg-white rounded-[3rem] shadow-xl shadow-gray-200/50 border border-gray-100 px-8">
                    <div className="text-8xl mb-6">🏜️</div>
                    <h3 className="text-3xl font-black text-gray-900 mb-3 tracking-tight">No Land Registered</h3>
                    <p className="text-gray-500 max-w-md mx-auto mb-10 text-lg font-medium">Ready to start earning? Register your first plot of land and connect with thousands of eager investors.</p>
                    <button 
                        onClick={() => navigate('/landowner/add-land')}
                        className="px-10 py-4 bg-green-600 text-white font-black rounded-2xl hover:bg-green-700 transition-all shadow-2xl shadow-green-600/30 transform hover:-translate-y-1"
                    >
                        Get Started Now
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                    {lands.map((land) => {
                        let photoUrl = null;
                        try {
                            const photos = typeof land.landPhotos === 'string' ? JSON.parse(land.landPhotos) : land.landPhotos;
                            if (photos && photos.length > 0) {
                                photoUrl = getMediaUrl(photos[0]);
                            }
                        } catch (e) {
                            console.error('Error parsing photos:', e);
                        }

                        return (
                            <div key={land.id} className="group bg-white rounded-[2rem] shadow-xl overflow-hidden border border-gray-100 hover:shadow-2xl hover:shadow-green-900/10 transition-all duration-500 transform hover:-translate-y-2 flex flex-col">
                                {/* Image Container */}
                                <div className="h-64 relative overflow-hidden bg-green-50">
                                    {photoUrl ? (
                                        <img 
                                            src={photoUrl} 
                                            alt={land.landName} 
                                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-8xl grayscale opacity-30 group-hover:scale-110 transition-transform duration-700">
                                            🌾
                                        </div>
                                    )}
                                    <div className="absolute top-5 right-5">
                                        <span className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl shadow-xl backdrop-blur-md border ${
                                            land.isVerified 
                                            ? 'bg-green-600/90 text-white border-green-400' 
                                            : 'bg-amber-500/90 text-white border-amber-300'
                                        }`}>
                                            {land.isVerified ? '✅ Verified' : '⏳ Pending'}
                                        </span>
                                    </div>
                                    <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/60 to-transparent">
                                        <p className="text-white font-black text-xl tracking-tight truncate">{land.landName}</p>
                                        <p className="text-green-200 text-xs font-bold flex items-center gap-1">
                                            <span>📍</span> {land.city}, {land.state}
                                        </p>
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="p-8 flex-1 flex flex-col">
                                    <div className="grid grid-cols-2 gap-4 mb-8">
                                        <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Size</p>
                                            <p className="text-lg font-black text-gray-900">{land.totalArea} <span className="text-xs">{land.areaUnit}</span></p>
                                        </div>
                                        <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Monthly Earn</p>
                                            <p className="text-lg font-black text-green-600">
                                                {land.rentalFeeMonthly ? `₨ ${parseFloat(land.rentalFeeMonthly).toLocaleString()}` : 'N/A'}
                                            </p>
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center justify-between mb-8 px-2">
                                        <div className="flex items-center gap-1">
                                            <span className="text-amber-400 text-lg">⭐</span>
                                            <span className="font-black text-gray-900">{parseFloat(land.overallRating || 0).toFixed(1)}</span>
                                            <span className="text-gray-400 text-sm font-medium">/ 5.0</span>
                                        </div>
                                        <div className="text-xs font-bold text-gray-400">
                                            {land.minimumRentalPeriod ? `Min: ${land.minimumRentalPeriod} Months` : ''}
                                        </div>
                                    </div>

                                    <div className="flex gap-4 mt-auto">
                                        <button 
                                            onClick={() => navigate('/landowner/my-lands')}
                                            className="flex-1 py-4 bg-gray-900 text-white text-xs font-black rounded-2xl hover:bg-green-600 transition-all shadow-xl shadow-gray-900/10 uppercase tracking-widest"
                                        >
                                            Manage Property
                                        </button>
                                        <button 
                                            onClick={() => handleDelete(land.id)}
                                            className="p-4 bg-red-50 text-red-500 rounded-2xl hover:bg-red-500 hover:text-white transition-all border border-red-100 active:scale-95"
                                            title="Delete Property"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default LandownerDashboard;
