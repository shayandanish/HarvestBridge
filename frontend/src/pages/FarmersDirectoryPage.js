import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { farmerService } from '../services/farmerService';
import { getMediaUrl } from '../services/api';
import { useAuth } from '../context/AuthContext';
import './FarmersDirectoryPage.css';

const SERVICES = [
    'Watering', 'Grafting', 'Pruning', 'Fertilizing',
    'Harvesting', 'Pest Control', 'Irrigation', 'Planting', 'Nurturing',
];

const SERVICE_COLORS = {
    Watering: '#3b82f6', Grafting: '#8b5cf6', Pruning: '#f59e0b',
    Fertilizing: '#10b981', Harvesting: '#ef4444', 'Pest Control': '#f97316',
    Irrigation: '#06b6d4', Planting: '#16a34a', Nurturing: '#ec4899',
};

export default function FarmersDirectoryPage() {
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();
    const location = useLocation();
    const searchParams = new URLSearchParams(location.search);
    const farmId = searchParams.get('farmId');
    const [farmers, setFarmers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [activeService, setActiveService] = useState('');

    const load = async (filters = {}) => {
        setLoading(true);
        try {
            const res = await farmerService.getPublicFarmers(filters);
            const data = res.data || res;
            setFarmers(data.farmers || []);
        } catch (_) {
            setFarmers([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, []);

    const handleSearch = (e) => {
        e.preventDefault();
        load({ location: search });
    };

    const handleServiceFilter = (svc) => {
        const next = svc === activeService ? '' : svc;
        setActiveService(next);
        load(next ? { service: next } : {});
    };

    const stars = (rating) => {
        const r = Math.round(Number(rating) || 0);
        return '★'.repeat(r) + '☆'.repeat(5 - r);
    };

    return (
        <div className="farmers-page">
            {/* Float Back Button */}
            <div className="back-btn-float">
                <Link to={isAuthenticated ? '/dashboard' : '/'} className="back-link">
                    <i className="fas fa-chevron-left"></i>
                    {isAuthenticated ? 'Dashboard' : 'Home'}
                </Link>
            </div>

            {/* Hero Section */}
            <header className="farmers-hero">
                <div className="farmers-hero-content animate-up">
                    <h1 className="farmers-hero-title">Meet Our Experts</h1>
                    <p className="farmers-hero-sub">
                        Connect with highly skilled farmers to nurture your trees and maximize your investment yields.
                    </p>

                    {/* Search Bar */}
                    <form className="search-container" onSubmit={handleSearch}>
                        <div className="search-input-wrapper">
                            <i className="fas fa-search"></i>
                            <input
                                className="search-input"
                                placeholder="Search by city or location..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                            />
                        </div>
                        {search && (
                            <button type="button" className="clear-search-btn"
                                onClick={() => { setSearch(''); load(); }}>
                                <i className="fas fa-times"></i>
                            </button>
                        )}
                        <button type="submit" className="search-btn">Find Farmers</button>
                    </form>
                </div>
            </header>

            {/* Filter Section */}
            <section className="filter-section animate-up" style={{ animationDelay: '0.1s' }}>
                <div className="filter-card">
                    <div className="filter-header">
                        <i className="fas fa-sliders-h"></i>
                        <span>Filter Expertise</span>
                    </div>
                    <div className="chips-container">
                        {SERVICES.map(svc => (
                            <button
                                key={svc}
                                className={`service-chip ${svc === activeService ? 'active' : ''}`}
                                onClick={() => handleServiceFilter(svc)}
                            >
                                {svc}
                            </button>
                        ))}
                    </div>
                </div>
            </section>

            {/* Main Content Container */}
            <main className="farmers-container">
                {loading ? (
                    <div className="state-container">
                        <span className="modern-loader"></span>
                        <p style={{ color: '#64748b', marginTop: 20, fontWeight: 500 }}>Scanning for local experts...</p>
                    </div>
                ) : farmers.length === 0 ? (
                    <div className="state-container animate-up">
                        <div className="empty-icon">🏜️</div>
                        <h3 style={{ color: '#1e293b', fontSize: 24, marginBottom: 12 }}>No Experts Found</h3>
                        <p style={{ color: '#64748b', fontSize: 16 }}>Try searching in a different area or removing filters.</p>
                        <button 
                            className="search-btn" 
                            style={{ marginTop: 24, padding: '12px 24px' }}
                            onClick={() => { setSearch(''); setActiveService(''); load(); }}
                        >
                            Reset All Filters
                        </button>
                    </div>
                ) : (
                    <div className="farmers-grid">
                        {farmers.map((farmer, index) => (
                            <FarmerCard 
                                key={farmer.id} 
                                farmer={farmer} 
                                navigate={navigate} 
                                stars={stars} 
                                index={index}
                                farmId={farmId}
                            />
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}

function FarmerCard({ farmer, navigate, stars, index, farmId }) {
    const name = farmer.user?.fullName || 'Farmer';
    const avatar = getMediaUrl(farmer.user?.profilePhotoUrl) || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=10b981&color=fff&size=200&bold=true`;
    const services = Array.isArray(farmer.services) ? farmer.services : [];

    return (
        <div className="farmer-card-modern animate-up" style={{ animationDelay: `${0.1 + (index * 0.05)}s` }}>
            {/* Profile Header */}
            <div className="farmer-header-main">
                <div className="avatar-container">
                    <img
                        src={avatar}
                        alt={name}
                        className="farmer-avatar-new"
                        onError={(e) => {
                            e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=10b981&color=fff&size=200&bold=true`;
                        }}
                    />
                    {farmer.isVerified && (
                        <div className="verified-badge-float" title="Verified Expert">
                            <i className="fas fa-check"></i>
                        </div>
                    )}
                </div>
                <div className="farmer-info-primary">
                    <h3 className="farmer-name-new">{name}</h3>
                    {farmer.location && (
                        <p className="farmer-location-new">
                            <i className="fas fa-map-marker-alt"></i>
                            {farmer.location}
                        </p>
                    )}
                    <div className="rating-container">
                        <span className="rating-stars">{stars(farmer.rating)}</span>
                        <span className="rating-text">{farmer.totalReviews || 0} reviews</span>
                    </div>
                </div>
            </div>

            {/* About Bio */}
            <p className="farmer-bio-new">
                {farmer.bio || "This expert hasn't provided a summary yet, but they are ready to help you with your trees."}
            </p>

            {/* Quick Stats Grid */}
            <div className="farmer-stats-grid">
                <div className="stat-item-new">
                    <span className="stat-label">Experience</span>
                    <span className="stat-value">{farmer.experienceYears || 0} Years</span>
                </div>
                <div className="stat-item-new">
                    <span className="stat-label">Service Fee</span>
                    <span className="stat-value">Rs. {Number(farmer.chargesPerTask || 0).toLocaleString()}</span>
                </div>
            </div>

            {/* Service Chips */}
            {services.length > 0 && (
                <div className="services-wrap-new">
                    {services.slice(0, 3).map(svc => (
                        <span 
                            key={svc} 
                            className="service-tag-small"
                            style={{
                                background: (SERVICE_COLORS[svc] || '#10b981') + '15',
                                color: SERVICE_COLORS[svc] || '#10b981'
                            }}
                        >
                            {svc}
                        </span>
                    ))}
                    {services.length > 3 && (
                        <span className="more-services-tag">+{services.length - 3} more</span>
                    )}
                </div>
            )}

            {/* Action Button */}
            <button className="card-cta-new" onClick={() => navigate(`/farmers/${farmer.id}${farmId ? `?farmId=${farmId}` : ''}`)}>
                Show Profile
                <i className="fas fa-arrow-right"></i>
            </button>
        </div>
    );
}
