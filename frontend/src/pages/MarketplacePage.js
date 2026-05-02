import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { marketplaceService, favoritesService, getMediaUrl } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { convertArea } from '../utils/unitConverter';

const MarketplacePage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { isAuthenticated, user } = useAuth();

    const [farms, setFarms] = useState([]);
    const [lands, setLands] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('farms');
    const [filters, setFilters] = useState({
        city: '',
        minPrice: '',
        maxPrice: '',
        sortBy: 'newest'
    });
    const [searchQuery, setSearchQuery] = useState('');
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(false);
    const [fetchingMore, setFetchingMore] = useState(false);

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const tab = params.get('tab');
        if (tab === 'lands' || tab === 'farms') {
            setActiveTab(tab);
            setPage(1);
            setFarms([]);
            setLands([]);
        }
    }, [location.search]);

    useEffect(() => {
        fetchData(1, false);
    }, [filters, activeTab]);

    const fetchData = async (pageNum = 1, append = false) => {
        if (!append) setLoading(true);
        else setFetchingMore(true);

        try {
            const currentFilters = { ...filters, page: pageNum, limit: 10 };
            if (activeTab === 'farms') {
                const data = await marketplaceService.getFarms(currentFilters);
                const newFarms = data.farms || [];
                setFarms(prev => append ? [...prev, ...newFarms] : newFarms);
                setHasMore(data.pagination ? pageNum < data.pagination.pages : false);
            } else {
                const data = await marketplaceService.getVerifiedLands(currentFilters);
                const newLands = data.lands || [];
                setLands(prev => append ? [...prev, ...newLands] : newLands);
                setHasMore(data.pagination ? pageNum < data.pagination.pages : false);
            }
            setPage(pageNum);
        } catch (error) {
            console.error('Error fetching marketplace data:', error);
        } finally {
            setLoading(false);
            setFetchingMore(false);
        }
    };

    const handleLoadMore = () => {
        if (!fetchingMore && hasMore) {
            fetchData(page + 1, true);
        }
    };

    const handleSearch = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const data = await marketplaceService.search(searchQuery);
            if (activeTab === 'farms') {
                setFarms(data.farms || []);
            } else {
                setLands(data.lands || []);
            }
            // Search currently returns a fixed set, so we disable Load More
            setHasMore(false);
            setPage(1);
        } catch (error) {
            console.error('Search error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-12">
            {/* Hero Section */}
            <div className="bg-green-700 text-white py-16 px-4 relative overflow-hidden">
                <div className="absolute top-4 left-4 z-30">
                    <Link
                        to={isAuthenticated ? "/dashboard" : "/"}
                        className="flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 text-white px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-white/20 transition-all shadow-xl"
                    >
                        ← {isAuthenticated ? 'Dashboard' : 'Home'}
                    </Link>
                </div>
                <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
                    <div className="grid grid-cols-8 gap-4 rotate-12 scale-150">
                        {[...Array(24)].map((_, i) => (
                            <div key={i} className="text-4xl">🌱</div>
                        ))}
                    </div>
                </div>
                <div className="container mx-auto text-center max-w-3xl relative z-10">
                    <h1 className="text-4xl md:text-6xl font-black mb-6 tracking-tight">Agro Marketplace</h1>
                    <p className="text-xl mb-8 text-green-100 font-medium">Discover verified farms and premium land listings ready for growth.</p>

                    <form onSubmit={handleSearch} className="relative max-w-xl mx-auto">
                        <input
                            type="text"
                            placeholder={`Search ${activeTab === 'farms' ? 'farms' : 'lands'}, locations...`}
                            className="w-full px-8 py-5 rounded-2xl text-gray-800 shadow-2xl focus:outline-none focus:ring-4 focus:ring-green-400 font-medium transition-all"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        <button
                            type="submit"
                            className="absolute right-3 top-3 bg-green-600 text-white px-8 py-3 rounded-xl hover:bg-green-500 font-bold transition-all shadow-lg"
                        >
                            Search
                        </button>
                    </form>
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="container mx-auto px-4 -mt-8 relative z-20">
                <div className="flex flex-wrap justify-center bg-white rounded-2xl shadow-xl p-2 w-full md:w-max mx-auto border border-gray-100 gap-2">
                    <button
                        onClick={() => { setActiveTab('farms'); setPage(1); }}
                        className={`flex-1 md:flex-none px-6 md:px-8 py-3 md:py-4 rounded-xl font-black transition-all flex items-center justify-center gap-2 ${activeTab === 'farms' ? 'bg-green-600 text-white shadow-lg' : 'text-gray-500 hover:text-green-600'
                            }`}
                    >
                        <span className="text-lg md:text-xl">🚜</span> FARMS
                    </button>
                    <button
                        onClick={() => { setActiveTab('lands'); setPage(1); }}
                        className={`flex-1 md:flex-none px-6 md:px-8 py-3 md:py-4 rounded-xl font-black transition-all flex items-center justify-center gap-2 ${activeTab === 'lands' ? 'bg-green-600 text-white shadow-lg' : 'text-gray-500 hover:text-green-600'
                            }`}
                    >
                        <span className="text-lg md:text-xl">🏞️</span> LANDS
                    </button>
                </div>
            </div>

            <div className="container mx-auto px-4 py-12 flex flex-col md:flex-row gap-8">
                {/* Filters Sidebar */}
                <div className="w-full md:w-80">
                    <div className="bg-white rounded-3xl shadow-xl p-8 sticky top-24 border border-gray-100 overflow-hidden">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-green-50 rounded-full -mr-12 -mt-12 opacity-50"></div>
                        <div className="flex justify-between items-center mb-8 relative z-10">
                            <h3 className="font-black text-xl text-gray-900 tracking-tight">Filters</h3>
                            <button
                                onClick={() => {
                                    setFilters({ city: '', minPrice: '', maxPrice: '', sortBy: 'newest' });
                                    setPage(1);
                                }}
                                className="text-xs font-black uppercase tracking-widest text-green-600 hover:text-green-700 transition-colors"
                            >
                                Reset
                            </button>
                        </div>

                        <div className="space-y-8 relative z-10">
                            <div>
                                <label className="block text-xs font-black uppercase tracking-widest text-gray-400 mb-2">Location</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-3 text-gray-400"></span>
                                    <input
                                        type="text"
                                        name="city"
                                        placeholder="City, State..."
                                        className="w-full pl-10 pr-4 py-3 bg-gray-50 rounded-xl focus:bg-white focus:ring-2 focus:ring-green-400 outline-none transition-all font-medium border-transparent focus:border-green-400"
                                        value={filters.city}
                                        onChange={handleFilterChange}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-black uppercase tracking-widest text-gray-400 mb-2">Budget (PKR)</label>
                                <div className="flex gap-2">
                                    <input
                                        type="number"
                                        name="minPrice"
                                        placeholder="Min"
                                        className="w-full p-3 bg-gray-50 rounded-xl focus:bg-white outline-none font-medium border border-transparent focus:border-green-400 transition-all"
                                        value={filters.minPrice}
                                        onChange={handleFilterChange}
                                    />
                                    <input
                                        type="number"
                                        name="maxPrice"
                                        placeholder="Max"
                                        className="w-full p-3 bg-gray-50 rounded-xl focus:bg-white outline-none font-medium border border-transparent focus:border-green-400 transition-all"
                                        value={filters.maxPrice}
                                        onChange={handleFilterChange}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-black uppercase tracking-widest text-gray-400 mb-2">Order By</label>
                                <select
                                    name="sortBy"
                                    className="w-full p-3 bg-gray-50 rounded-xl focus:bg-white outline-none font-bold text-gray-900 border border-transparent focus:border-green-400 transition-all"
                                    value={filters.sortBy}
                                    onChange={handleFilterChange}
                                >
                                    <option value="newest">Latest Posts</option>
                                    <option value="price_asc">Cheapest First</option>
                                    <option value="rating">Top Rated</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Results Grid */}
                <div className="flex-1">
                    <div className="mb-8 flex justify-between items-center px-2">
                        <h2 className="text-2xl font-black text-gray-900 tracking-tight">
                            Showing {activeTab === 'farms' ? `${farms.length} Farms` : `${lands.length} Lands`}
                        </h2>
                        <div className="text-sm font-medium text-gray-500 bg-white px-4 py-2 rounded-full shadow-sm border border-gray-100">
                            Verified Listings Only ✓
                        </div>
                    </div>

                    {loading ? (
                        <div className="text-center py-32 bg-white rounded-3xl border border-gray-50 shadow-sm">
                            <div className="animate-spin rounded-full h-16 w-16 border-4 border-green-600 border-t-transparent mx-auto mb-6"></div>
                            <p className="text-gray-400 font-bold uppercase tracking-widest text-sm">Searching the earth...</p>
                        </div>
                    ) : (activeTab === 'farms' ? farms : lands).length > 0 ? (
                        <div className="grid md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-8">
                            {activeTab === 'farms' ? (
                                farms.map(farm => <FarmCard key={farm.id} farm={farm} navigate={navigate} />)
                            ) : (
                                lands.map(land => <LandCard key={land.id} land={land} navigate={navigate} isAuthenticated={isAuthenticated} />)
                            )}
                        </div>
                    ) : (
                        <div className="text-center py-32 bg-white rounded-3xl border border-dashed border-gray-200">
                            <div className="text-6xl mb-6 opacity-30">🏜️</div>
                            <h3 className="text-xl font-black text-gray-400 uppercase tracking-widest">Nothing Found</h3>
                            <button
                                onClick={() => {
                                    setFilters({ city: '', minPrice: '', maxPrice: '', sortBy: 'newest' });
                                    setPage(1);
                                }}
                                className="mt-6 px-8 py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition-all"
                            >
                                Clear All Filters
                            </button>
                        </div>
                    )}

                    {/* Pagination - Load More */}
                    {hasMore && (
                        <div className="mt-16 text-center">
                            <button
                                onClick={handleLoadMore}
                                disabled={fetchingMore}
                                className="group relative px-12 py-5 bg-white border-2 border-green-600 text-green-600 rounded-2xl font-black uppercase tracking-widest hover:bg-green-600 hover:text-white transition-all shadow-xl hover:shadow-green-600/20 disabled:opacity-50 disabled:cursor-not-allowed group overflow-hidden"
                            >
                                <span className="relative z-10">
                                    {fetchingMore ? 'Loading More...' : 'Explore More Results'}
                                </span>
                                {fetchingMore && (
                                    <div className="absolute inset-x-0 bottom-0 h-1 bg-green-100 animate-pulse"></div>
                                )}
                            </button>
                            <p className="mt-4 text-xs font-bold text-gray-400 uppercase tracking-widest">
                                Showing {activeTab === 'farms' ? farms.length : lands.length} listings
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const FarmCard = ({ farm, navigate }) => {
    return (
        <div className="group bg-white rounded-[2rem] shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-500 border border-black/5 flex flex-col transform hover:-translate-y-1">
            <div className="h-60 relative overflow-hidden">
                {farm.photos && farm.photos.length > 0 ? (
                    <img
                        src={getMediaUrl(farm.photos[0].photoUrl)}
                        alt={farm.farmName}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                ) : (
                    <div className="w-full h-full bg-green-50 flex items-center justify-center text-green-200">
                        <span className="text-5xl">🚜</span>
                    </div>
                )}
                <div className="absolute top-4 right-4">
                    <span className="px-4 py-2 bg-white/90 backdrop-blur-md text-green-600 text-[10px] font-black uppercase tracking-widest rounded-xl shadow-lg border border-green-100">Verified</span>
                </div>
            </div>
            <div className="p-8 flex-1 flex flex-col">
                <h3 className="text-2xl font-black text-gray-900 mb-2 group-hover:text-green-600 transition-all tracking-tight">{farm.farmName}</h3>
                    {farm.land?.city || 'Punjab'}, {farm.land?.state || 'Pakistan'}

                <div className="mt-auto flex flex-col gap-6">
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
                        <div className="flex flex-col">
                            <span className="text-[10px] uppercase tracking-widest font-black text-gray-400">Manager</span>
                            <span className="text-sm font-black text-gray-900 truncate w-24">
                                {farm.farmer?.user?.fullName || 'Pro Farmer'}
                            </span>
                        </div>
                        <div className="w-10 h-10 rounded-xl bg-green-600 flex items-center justify-center text-white text-xs font-black">
                            {typeof farm.farmer?.rating === 'number' ? farm.farmer.rating.toFixed(1) : '5.0'}
                        </div>
                    </div>
                    <button
                        onClick={() => navigate(`/marketplace/farms/${farm.id}`)}
                        className="w-full py-4 bg-gray-900 text-white text-sm font-black rounded-2xl hover:bg-green-600 transition-all shadow-xl shadow-gray-900/10 uppercase tracking-widest"
                    >
                        Explore Project
                    </button>
                </div>
            </div>
        </div>
    );
};

const LandCard = ({ land, navigate, isAuthenticated }) => {
    let photos = [];
    try {
        if (land.landPhotos) {
            photos = typeof land.landPhotos === 'string'
                ? JSON.parse(land.landPhotos)
                : land.landPhotos;
        }
    } catch (e) { }

    const primaryPhoto = photos.length > 0 ? getMediaUrl(photos[0]) : null;

    // Calculate Available Area in land's base unit
    const leasedArea = land.farms?.filter(f => f.isActive !== false && !f.isDirectPlanting).reduce((sum, f) => {
        const areaInBaseUnit = convertArea(f.totalArea, f.areaUnit || land.areaUnit, land.areaUnit);
        return sum + Number(areaInBaseUnit || 0);
    }, 0) || 0;
    const availableArea = Math.max(0, Number(land.totalArea) - leasedArea);
    const isSoldOut = availableArea <= 0.01;

    return (
        <div className={`group bg-white rounded-[2rem] shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-500 border border-black/5 flex flex-col transform hover:-translate-y-1 ${isSoldOut ? 'grayscale-[0.5]' : ''}`}>
            <div className="h-60 relative overflow-hidden">
                {primaryPhoto ? (
                    <img
                        src={primaryPhoto}
                        alt={land.landName}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                ) : (
                    <div className="w-full h-full bg-blue-50 flex items-center justify-center text-blue-200">
                        <span className="text-5xl">🏞️</span>
                    </div>
                )}
                <div className="absolute top-4 right-4 flex flex-col gap-2 items-end">
                    <span className="px-4 py-2 bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-lg">Premium Land</span>
                    {isSoldOut && (
                        <span className="px-4 py-2 bg-red-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-lg animate-pulse">Sold Out</span>
                    )}
                </div>
            </div>
            <div className="p-8 flex-1 flex flex-col">
                <h3 className="text-2xl font-black text-gray-900 mb-2 group-hover:text-green-600 transition-all tracking-tight">
                    {land.landName || land.specificLocation}
                </h3>
                <p className="text-sm text-gray-400 font-bold mb-6 flex items-center gap-1 uppercase tracking-tight">
                    {land.city}, {land.state}
                </p>

                <div className="mt-auto flex flex-col gap-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                            <span className="text-[10px] uppercase tracking-widest font-black text-gray-400 block mb-1">
                                {isSoldOut ? 'Total Area' : 'Available Area'}
                            </span>
                            <span className={`text-lg font-black ${isSoldOut ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
                                {isSoldOut ? land.totalArea : availableArea.toFixed(2)} <span className="text-xs">{land.areaUnit}</span>
                            </span>
                        </div>
                        <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                            <span className="text-[10px] uppercase tracking-widest font-black text-gray-400 block mb-1">Watering</span>
                            <span className="text-sm font-black text-gray-900">{land.waterSource || 'Tube Well'}</span>
                        </div>
                    </div>
                    {isSoldOut ? (
                        <button
                            disabled
                            className="w-full py-4 bg-gray-200 text-gray-400 text-sm font-black rounded-2xl cursor-not-allowed uppercase tracking-widest border border-gray-300"
                        >
                            Not Available
                        </button>
                    ) : (
                        <Link
                            to={isAuthenticated ? `/investor/lease/${land.id}` : "/register"}
                            className="w-full py-4 bg-gray-900 text-white text-sm font-black rounded-2xl hover:bg-green-600 transition-all shadow-xl shadow-gray-900/10 text-center uppercase tracking-widest"
                        >
                            Lease Land
                        </Link>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MarketplacePage;
