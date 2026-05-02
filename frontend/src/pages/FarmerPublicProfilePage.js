import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { farmerService } from '../services/farmerService';
import { investmentService } from '../services/investmentService';
import { reviewService } from '../services/reviewService';
import { getMediaUrl } from '../services/api';
import { useAuth } from '../context/AuthContext';
import './FarmerPublicProfilePage.css';

const SERVICE_COLORS = {
    Watering: '#3b82f6', Grafting: '#8b5cf6', Pruning: '#f59e0b',
    Fertilizing: '#10b981', Harvesting: '#ef4444', 'Pest Control': '#f97316',
    Irrigation: '#06b6d4', Planting: '#16a34a', Nurturing: '#ec4899',
};

export default function FarmerPublicProfilePage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAuth();

    const [farmer, setFarmer] = useState(null);
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showContact, setShowContact] = useState(false);

    // Hiring State
    const searchParams = new URLSearchParams(location.search);
    const [userFarms, setUserFarms] = useState([]);
    const [selectedFarmId, setSelectedFarmId] = useState(location.state?.farmId || searchParams.get('farmId') || '');
    const [hiring, setHiring] = useState(false);
    const [hiringSuccess, setHiringSuccess] = useState(false);
    const [hiringError, setHiringError] = useState('');

    useEffect(() => {
        const load = async () => {
            try {
                const res = await farmerService.getPublicFarmerById(id);
                setFarmer(res.data || res);

                try {
                    const reviewRes = await reviewService.getFarmerReviews(id);
                    setReviews(reviewRes.data || reviewRes);
                } catch (err) {
                    console.error('Error fetching reviews:', err);
                    setReviews([]);
                }

                if (user?.role === 'investor') {
                    const invRes = await investmentService.getInvestments();
                    const farms = invRes.filter(inv => inv.type === 'farm_lease' || inv.type === 'plantation_request');

                    const enrichedFarms = await Promise.all(farms.map(async f => {
                        try {
                            const detail = await farmerService.getFarmById(f.id);
                            return { ...f, hiringStatus: detail.hiringStatus, farmerId: detail.farmerId };
                        } catch (_) { return f; }
                    }));

                    setUserFarms(enrichedFarms);
                }
            } catch (_) {
                setFarmer(null);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [id, user]);

    const handleHire = async () => {
        if (!selectedFarmId) {
            setHiringError('Please select a farm to hire for.');
            return;
        }

        setHiring(true);
        setHiringError('');
        try {
            await investmentService.hireFarmer(selectedFarmId, farmer.id);
            setHiringSuccess(true);
            setTimeout(() => {
                setShowContact(false);
                setHiringSuccess(false);
            }, 3000);
        } catch (err) {
            setHiringError(err.response?.data?.message || 'Failed to initiate hiring request.');
        } finally {
            setHiring(false);
        }
    };

    if (loading) {
        return (
            <div className="state-container">
                <span className="modern-loader"></span>
                <p style={{ color: '#64748b', marginTop: 20, fontWeight: 500 }}>Fetching profile details...</p>
            </div>
        );
    }

    if (!farmer) {
        return (
            <div className="state-container animate-up">
                <div className="empty-icon">🏜️</div>
                <h2 style={{ color: '#1e293b', fontSize: 28, fontWeight: 800 }}>Profile Not Found</h2>
                <p style={{ color: '#64748b', fontSize: 16 }}>This expert profile may have been removed or set to private.</p>
                <Link to="/farmers" className="profile-back-link" style={{ marginTop: 24 }}>
                    <i className="fas fa-arrow-left"></i> Back to Directory
                </Link>
            </div>
        );
    }

    const name = farmer.user?.fullName || 'Farmer';
    const avatar = getMediaUrl(farmer.user?.profilePhotoUrl) || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=10b981&color=fff&size=300&bold=true`;
    const services = Array.isArray(farmer.services) ? farmer.services : [];
    const rating = Number(farmer.rating) || 0;
    const stars = '★'.repeat(Math.round(rating)) + '☆'.repeat(5 - Math.round(rating));

    return (
        <div className="farmer-public-page">
            {/* Contact Modal */}
            {showContact && (
                <div className="modern-overlay" onClick={() => setShowContact(false)}>
                    <div className="modern-modal-card" onClick={e => e.stopPropagation()}>
                        {hiringSuccess ? (
                            <div className="success-modal-content">
                                <span className="success-icon-animated">🎉</span>
                                <h2 style={{ color: '#059669', marginBottom: 12 }}>Request Sent!</h2>
                                <p style={{ color: '#475569', fontSize: 16 }}>
                                    Your hiring request for <strong>{name}</strong> has been successfully broadcasted.
                                </p>
                            </div>
                        ) : (
                            <>
                                <div className="modal-title-row">
                                    <h2>Collaborate with {name.split(' ')[0]}</h2>
                                    <p className="modal-sub-text">Choose which of your investments needs expert care.</p>
                                </div>

                                {user?.role === 'investor' ? (
                                    <div className="modern-select-group">
                                        <label className="modern-label">Select Your Farm / Land</label>
                                        <select
                                            className="modern-select"
                                            value={selectedFarmId}
                                            onChange={e => setSelectedFarmId(e.target.value)}
                                        >
                                            <option value="">-- Choose an investment --</option>
                                            {userFarms.map(f => {
                                                const isCurrentFarmer = f.farmerId === farmer.id;
                                                const isRequested = isCurrentFarmer && f.hiringStatus === 'pending';
                                                const isAccepted = isCurrentFarmer && f.hiringStatus === 'accepted';

                                                return (
                                                    <option
                                                        key={f.farmId || f.id}
                                                        value={f.farmId || f.id}
                                                        disabled={isRequested || isAccepted}
                                                    >
                                                        {f.title} ({f.details?.area} {f.details?.unit})
                                                        {isRequested ? ' • [WAITING]' : ''}
                                                        {isAccepted ? ' • [HIRED]' : ''}
                                                    </option>
                                                );
                                            })}
                                        </select>
                                        {hiringError && <p style={{ color: '#ef4444', fontSize: 13, marginTop: 8, fontWeight: 500 }}>
                                            <i className="fas fa-exclamation-circle"></i> {hiringError}
                                        </p>}

                                        <button
                                            className="final-cta-btn"
                                            style={{ width: '100%', marginTop: 24 }}
                                            onClick={handleHire}
                                            disabled={hiring}
                                        >
                                            {hiring ? 'Broadcasting...' : 'Confirm Hiring Request'}
                                        </button>
                                    </div>
                                ) : (
                                    <div style={{ padding: '24px', background: '#fff1f2', borderRadius: '16px', marginBottom: '24px' }}>
                                        <p style={{ color: '#e11d48', margin: 0, fontWeight: 600 }}>
                                            Investors only. Please log in as an investor to hire experts.
                                        </p>
                                    </div>
                                )}

                                <div className="contact-direct-divider">
                                    {farmer.user?.phone ? (
                                        <a href={`tel:${farmer.user.phone}`} className="direct-phone-link">
                                            <i className="fas fa-phone-alt"></i> {farmer.user.phone}
                                        </a>
                                    ) : (
                                        <p style={{ color: '#94a3b8', fontSize: 15 }}>Direct contact unavailable</p>
                                    )}
                                </div>
                                <button className="modal-close-btn" onClick={() => setShowContact(false)}>Maybe Later</button>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* Top Navigation */}
            <div className="profile-back-container animate-up">
                <Link to="/farmers" className="profile-back-link">
                    <i className="fas fa-chevron-left"></i>
                    Back to Experts
                </Link>
            </div>

            {/* Premium Hero Section */}
            <section className="profile-hero-section animate-up" style={{ animationDelay: '0.1s' }}>
                <div className="profile-hero-card">
                    <img src={avatar} alt={name} className="profile-hero-avatar" />
                    <div className="profile-hero-content">
                        <div className="profile-hero-name-row">
                            <h1 className="profile-hero-name">{name}</h1>
                            {farmer.isVerified && (
                                <span className="verified-badge-pill">
                                    <i className="fas fa-check-circle"></i> Verified
                                </span>
                            )}
                        </div>
                        {farmer.location && (
                            <p className="profile-hero-location">
                                <i className="fas fa-map-marker-alt"></i> {farmer.location}
                            </p>
                        )}
                        <div className="profile-hero-stars-row">
                            <span className="stars-large">{stars}</span>
                            <span className="rating-count-pill">{rating.toFixed(1)} Rating • {farmer.totalReviews || 0} reviews</span>
                        </div>
                        {farmer.specialization && (
                            <p className="profile-hero-spec">
                                <i className="fas fa-award"></i> {farmer.specialization}
                            </p>
                        )}
                    </div>
                    <button className="profile-hero-cta" onClick={() => setShowContact(true)}>
                        <i className="fas fa-handshake"></i>
                        Hire Expert
                    </button>
                </div>
            </section>

            {/* Main Content Layout */}
            <main className="profile-main-content">
                {/* Visual Stats Row */}
                <div className="profile-stats-container animate-up" style={{ animationDelay: '0.2s' }}>
                    <Stat 
                        label="Experience" 
                        value={farmer.experienceYears != null ? `${farmer.experienceYears} Years` : '—'} 
                        icon={<i className="fas fa-seedling"></i>} 
                    />
                    <Stat 
                        label="Standard Fee" 
                        value={farmer.chargesPerTask != null ? `Rs. ${Number(farmer.chargesPerTask).toLocaleString()}` : '—'} 
                        icon={<i className="fas fa-tag"></i>} 
                    />
                    <Stat 
                        label="Projects" 
                        value={farmer.farms?.length || 0} 
                        icon={<i className="fas fa-briefcase"></i>} 
                    />
                    {farmer.age && (
                        <Stat 
                            label="Member Age" 
                            value={`${farmer.age} yrs`} 
                            icon={<i className="fas fa-user"></i>} 
                        />
                    )}
                </div>

                {/* Detailed About */}
                {farmer.bio && (
                    <div className="profile-detail-card animate-up" style={{ animationDelay: '0.3s' }}>
                        <h2 className="profile-card-title">
                            <i className="fas fa-info-circle"></i>
                            Professional Summary
                        </h2>
                        <p className="profile-bio-text">{farmer.bio}</p>
                    </div>
                )}

                {/* Skills & Services Grid */}
                {services.length > 0 && (
                    <div className="profile-detail-card animate-up" style={{ animationDelay: '0.4s' }}>
                        <h2 className="profile-card-title">
                            <i className="fas fa-tools"></i>
                            Expert Services
                        </h2>
                        <div className="tags-wrap-premium">
                            {services.map(svc => (
                                <span key={svc} className="service-pill-large" style={{
                                    background: (SERVICE_COLORS[svc] || '#10b981') + '15',
                                    color: SERVICE_COLORS[svc] || '#10b981',
                                    borderColor: (SERVICE_COLORS[svc] || '#10b981') + '40'
                                }}>
                                    {svc}
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                {/* Active Footprint */}
                {farmer.farms && farmer.farms.length > 0 && (
                    <div className="profile-detail-card animate-up" style={{ animationDelay: '0.5s' }}>
                        <h2 className="profile-card-title">
                            <i className="fas fa-mountain"></i>
                            Managed Lands
                        </h2>
                        <div className="farms-grid-mini">
                            {farmer.farms.map(f => (
                                <div key={f.id} className="farm-pill-premium">
                                    <div className="farm-icon">🌿</div>
                                    <span style={{ fontWeight: 700, color: '#1e293b' }}>{f.farmName}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Reviews Section */}
                <div className="profile-detail-card animate-up" style={{ animationDelay: '0.6s' }}>
                    <h2 className="profile-card-title">
                        <i className="fas fa-star text-yellow-500"></i>
                        What Investors Are Saying
                    </h2>
                    
                    {reviews.length > 0 ? (
                        <div className="reviews-list">
                            {reviews.map((rev) => (
                                <div key={rev.id} className="review-item">
                                    <div className="review-header">
                                        <div className="review-user-info">
                                            <img 
                                                src={getMediaUrl(rev.user?.profilePhotoUrl) || `https://ui-avatars.com/api/?name=${encodeURIComponent(rev.user?.fullName || 'I')}&background=random`} 
                                                alt={rev.user?.fullName} 
                                                className="review-user-avatar"
                                            />
                                            <div>
                                                <h4 className="review-user-name">
                                                    {rev.user?.fullName}
                                                    {rev.type === 'harvest' && (
                                                        <span className="verified-harvest-badge">
                                                            Verified Harvest
                                                        </span>
                                                    )}
                                                </h4>
                                                <p className="review-date">
                                                    {new Date(rev.createdAt).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="review-stars">
                                            {'★'.repeat(rev.rating)}{'☆'.repeat(5 - rev.rating)}
                                        </div>
                                    </div>
                                    <p className="review-comment">
                                        "{rev.comment || 'No written feedback provided.'}"
                                    </p>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-10">
                            <p className="text-gray-400 italic">No reviews yet. Be the first to rate this expert!</p>
                        </div>
                    )}
                </div>

                {/* Final Call to Action */}
                <section className="profile-final-cta animate-up" style={{ animationDelay: '0.6s' }}>
                    <h2 className="final-cta-title">Start a Collaboration</h2>
                    <p className="final-cta-sub">
                        Bring {name.split(' ')[0]}'s expertise to your land and watch your investment flourish.
                    </p>
                    <button className="final-cta-btn" onClick={() => setShowContact(true)}>
                        <i className="fas fa-calendar-check"></i> 
                        Send Hiring Request
                    </button>
                </section>
            </main>
        </div>
    );
}

function Stat({ icon, label, value }) {
    return (
        <div className="stat-card-premium">
            <div className="stat-icon-wrapper">{icon}</div>
            <div className="stat-val-text">{value}</div>
            <div className="stat-lbl-text">{label}</div>
        </div>
    );
}
