import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { farmerService } from '../services/farmerService';
import './BrowseLandsPage.css';

const BrowseLandsPage = () => {
    const navigate = useNavigate();
    const [lands, setLands] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({ city: '', minArea: '', maxArea: '' });

    const fetchLands = async () => {
        setLoading(true);
        try {
            const data = await farmerService.getAvailableLands(filters);
            setLands(data.lands || []);
        } catch (error) {
            console.error('Error fetching available lands:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLands();
    }, []);

    const handleFilterChange = (e) => {
        setFilters({ ...filters, [e.target.name]: e.target.value });
    };

    const handleSearch = (e) => {
        e.preventDefault();
        fetchLands();
    };

    return (
        <div className="browse-lands-container">
            {/* Hero Section */}
            <div className="browse-hero text-white py-24 mb-12">
                <div className="container mx-auto px-6 text-center">
                    <h1 className="text-5xl md:text-6xl font-black mb-6 tracking-tighter animate-fade-up">
                        Find Your <span className="text-emerald-400">Perfect</span> Legacy
                    </h1>
                    <p className="text-xl md:text-2xl opacity-80 max-w-2xl mx-auto font-medium animate-fade-up" style={{ animationDelay: '0.1s' }}>
                        Discover verified, premium lands for high-yield farming and sustainable investments.
                    </p>
                </div>
            </div>

            <div className="container mx-auto px-6">
                {/* Glassmorphism Filters */}
                <div className="glass-filters p-8 mb-16 animate-fade-up" style={{ animationDelay: '0.2s' }}>
                    <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
                        <div className="filter-input-group">
                            <label className="block text-[10px] font-black text-emerald-800 uppercase tracking-widest mb-2 ml-1">Location</label>
                            <span className="filter-icon">📍</span>
                            <input
                                type="text"
                                name="city"
                                placeholder="e.g. Hunza"
                                value={filters.city}
                                onChange={handleFilterChange}
                                className="premium-input"
                            />
                        </div>
                        <div className="filter-input-group">
                            <label className="block text-[10px] font-black text-emerald-800 uppercase tracking-widest mb-2 ml-1">Min Area</label>
                            <span className="filter-icon">📉</span>
                            <input
                                type="number"
                                name="minArea"
                                placeholder="Min Area"
                                value={filters.minArea}
                                onChange={handleFilterChange}
                                className="premium-input"
                            />
                        </div>
                        <div className="filter-input-group">
                            <label className="block text-[10px] font-black text-emerald-800 uppercase tracking-widest mb-2 ml-1">Max Area</label>
                            <span className="filter-icon">📈</span>
                            <input
                                type="number"
                                name="maxArea"
                                placeholder="Max Area"
                                value={filters.maxArea}
                                onChange={handleFilterChange}
                                className="premium-input"
                            />
                        </div>
                        <button type="submit" className="premium-search-btn">
                            <span>Search Land</span>
                            <span className="text-xl">➔</span>
                        </button>
                    </form>
                </div>

                {/* Content Grid */}
                {loading ? (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-10">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-[500px] rounded-[2rem] bg-gray-100 animate-pulse"></div>
                        ))}
                    </div>
                ) : lands.length === 0 ? (
                    <div className="text-center py-32 bg-white rounded-[3rem] border border-dashed border-gray-200 mt-8">
                        <div className="text-6xl mb-6 grayscale opacity-20">🚜</div>
                        <h3 className="text-2xl font-black text-gray-900 mb-2">No Land Opportunities Found</h3>
                        <p className="text-gray-500 font-medium">Try adjusting your filters to find hidden gems.</p>
                    </div>
                ) : (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-10 mb-24">
                        {lands.map((land, idx) => (
                            <div 
                                key={land.id} 
                                className="land-card animate-fade-up"
                                style={{ animationDelay: `${idx * 0.1}s` }}
                            >
                                <div className="land-image-container">
                                    {land.photos && land.photos.length > 0 ? (
                                        <img src={land.photos[0]} alt="Land" className="land-image" />
                                    ) : (
                                        <div className="w-full h-full bg-slate-100 flex flex-col items-center justify-center text-slate-400">
                                            <span className="text-4xl mb-2">🏞️</span>
                                            <span className="text-[10px] font-black uppercase tracking-widest">No Image</span>
                                        </div>
                                    )}
                                    <div className="verified-badge">
                                        <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                                        Verified
                                    </div>
                                    <div className="area-tag">
                                        {land.totalArea} {land.areaUnit}
                                    </div>
                                </div>

                                <div className="p-8 flex-1 flex flex-col">
                                    <h3 className="text-2xl font-black text-gray-900 mb-1 leading-tight">
                                        {land.locationName || `Prime Land in ${land.city}`}
                                    </h3>
                                    <p className="text-gray-500 font-bold text-sm mb-6 flex items-center gap-2">
                                        {land.city}, {land.state}
                                    </p>

                                    <div className="grid grid-cols-2 gap-4 mb-8 pt-6 border-t border-gray-50">
                                        <div className="bg-slate-50 p-4 rounded-2xl text-center">
                                            <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Status</span>
                                            <span className={`text-sm font-black ${land.farms?.length > 0 ? 'text-blue-600' : 'text-emerald-600'}`}>
                                                {land.farms?.length > 0 ? 'Project Active' : 'Pure Available'}
                                            </span>
                                        </div>
                                        <div className="bg-slate-50 p-4 rounded-2xl text-center">
                                            <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Price Type</span>
                                            <span className="text-sm font-black text-gray-900">Premium Lease</span>
                                        </div>
                                    </div>

                                    {land.farms?.length > 0 && land.farms[0].farmer && (
                                        <div className="farmer-micro-profile">
                                            <div className="farmer-avatar-mini">
                                                {land.farms[0].farmer.user?.fullName?.charAt(0)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest">Managed By</p>
                                                <p className="text-sm font-black text-gray-900 truncate">{land.farms[0].farmer.user?.fullName}</p>
                                            </div>
                                            <button 
                                                onClick={() => navigate(`/farmers/${land.farms[0].farmer.user.id}`)}
                                                className="text-[10px] font-black text-emerald-600 hover:text-emerald-700 underline tracking-widest uppercase"
                                            >
                                                Details
                                            </button>
                                        </div>
                                    )}

                                    <button
                                        onClick={() => navigate(`/farms/create?landId=${land.id}`)}
                                        className="land-btn-premium"
                                    >
                                        Start Your Investment
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

export default BrowseLandsPage;
