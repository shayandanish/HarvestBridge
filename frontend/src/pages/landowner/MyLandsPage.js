import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { landService } from '../../services/landService';
import { getMediaUrl } from '../../services/api';

const STATUS_CONFIG = {
    true: { label: 'Verified', color: '#22c55e', bg: 'rgba(34,197,94,0.15)', icon: '✅' },
    false: { label: 'Pending', color: '#f59e0b', bg: 'rgba(245,158,11,0.15)', icon: '⏳' },
};

function StarDisplay({ value }) {
    if (!value) return <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>Not rated</span>;
    const rounded = Math.round(parseFloat(value));
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            {[1, 2, 3, 4, 5].map(s => (
                <span key={s} style={{ fontSize: 14, filter: s <= rounded ? 'none' : 'grayscale(1) opacity(0.3)' }}>⭐</span>
            ))}
            <span style={{ color: '#22c55e', fontWeight: 700, fontSize: 13, marginLeft: 4 }}>{parseFloat(value).toFixed(1)}</span>
        </div>
    );
}

export default function MyLandsPage() {
    const navigate = useNavigate();
    const [lands, setLands] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchLands();
    }, []);

    const fetchLands = async () => {
        try {
            const data = await landService.getMyLands();
            setLands(data.data || []);
        } catch (err) {
            setError('Failed to load your lands. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id, e) => {
        e.stopPropagation();
        if (!window.confirm('Are you sure you want to remove this land listing?')) return;
        try {
            await landService.deleteLand(id);
            setLands(prev => prev.filter(l => l.id !== id));
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to delete land');
        }
    };

    return (
        <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0f2027 0%, #203a43 50%, #2c5364 100%)', fontFamily: "'Inter', sans-serif", padding: '40px 20px' }}>
            <div style={{ maxWidth: 1000, margin: '0 auto', position: 'relative' }}>
                {/* Back Button */}
                <button onClick={() => navigate('/dashboard')}
                    style={{
                        position: 'absolute', top: -10, left: 0,
                        background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(10px)',
                        border: '1px solid rgba(255,255,255,0.1)', color: '#fff',
                        borderRadius: '50%', width: 44, height: 44,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer', transition: 'all 0.3s ease', fontSize: 20,
                        zIndex: 10,
                    }}
                    onMouseEnter={e => {
                        e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
                        e.currentTarget.style.transform = 'translateX(-4px)';
                    }}
                    onMouseLeave={e => {
                        e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                        e.currentTarget.style.transform = 'none';
                    }}>
                    ←
                </button>

                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 40, flexWrap: 'wrap', gap: 16, paddingTop: 40 }}>
                    <div>
                        <div style={{ fontSize: 48, marginBottom: 8 }}>🌾</div>
                        <h1 style={{ color: '#fff', fontSize: 28, fontWeight: 800, margin: 0 }}>My Land Listings</h1>
                        <p style={{ color: 'rgba(255,255,255,0.5)', marginTop: 6 }}>Manage your registered lands on PlantTree</p>
                    </div>
                    <button onClick={() => navigate('/landowner/add-land')}
                        style={{ padding: '14px 28px', background: 'linear-gradient(135deg, #22c55e, #16a34a)', color: '#fff', border: 'none', borderRadius: 12, fontWeight: 700, fontSize: 15, cursor: 'pointer', boxShadow: '0 4px 20px rgba(34,197,94,0.3)', display: 'flex', alignItems: 'center', gap: 8 }}>
                        + Register New Land
                    </button>
                </div>

                {/* Stats */}
                {!loading && lands.length > 0 && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 32 }}>
                        {[
                            { label: 'Total Lands', value: lands.length, icon: '🗺️' },
                            { label: 'Verified', value: lands.filter(l => l.isVerified).length, icon: '✅' },
                            { label: 'Pending Review', value: lands.filter(l => !l.isVerified).length, icon: '⏳' },
                        ].map(stat => (
                            <div key={stat.label} style={{ background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(10px)', borderRadius: 16, border: '1px solid rgba(255,255,255,0.1)', padding: '20px 24px' }}>
                                <div style={{ fontSize: 28, marginBottom: 8 }}>{stat.icon}</div>
                                <p style={{ color: '#fff', fontSize: 28, fontWeight: 800, margin: 0 }}>{stat.value}</p>
                                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, margin: '4px 0 0' }}>{stat.label}</p>
                            </div>
                        ))}
                    </div>
                )}

                {/* Content */}
                {loading ? (
                    <div style={{ textAlign: 'center', padding: 80 }}>
                        <div style={{ fontSize: 48, marginBottom: 16 }}>⏳</div>
                        <p style={{ color: 'rgba(255,255,255,0.5)' }}>Loading your lands...</p>
                    </div>
                ) : error ? (
                    <div style={{ textAlign: 'center', padding: 80 }}>
                        <div style={{ fontSize: 48 }}>❌</div>
                        <p style={{ color: '#ef4444', marginTop: 16 }}>{error}</p>
                    </div>
                ) : lands.length === 0 ? (
                    <div style={{ textAlign: 'center', background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(10px)', borderRadius: 24, border: '1px solid rgba(255,255,255,0.1)', padding: '80px 40px' }}>
                        <div style={{ fontSize: 72, marginBottom: 20 }}>🌱</div>
                        <h2 style={{ color: '#fff', fontSize: 24, fontWeight: 700, margin: '0 0 12px' }}>No lands registered yet</h2>
                        <p style={{ color: 'rgba(255,255,255,0.5)', marginBottom: 32 }}>Register your first land to connect with investors and farmers</p>
                        <button onClick={() => navigate('/landowner/add-land')}
                            style={{ padding: '14px 36px', background: 'linear-gradient(135deg, #22c55e, #16a34a)', color: '#fff', border: 'none', borderRadius: 12, fontWeight: 700, fontSize: 16, cursor: 'pointer', boxShadow: '0 4px 20px rgba(34,197,94,0.3)' }}>
                            + Register Your First Land
                        </button>
                    </div>
                ) : (
                    <div style={{ display: 'grid', gap: 20 }}>
                        {lands.map(land => {
                            const statusCfg = STATUS_CONFIG[String(land.isVerified)] || STATUS_CONFIG['false'];
                            const plants = (() => { try { return JSON.parse(land.cultivablePlants || '[]'); } catch { return []; } })();
                            const photos = (() => { try { return JSON.parse(land.landPhotos || '[]'); } catch { return []; } })();

                            return (
                                <div key={land.id} onClick={() => navigate(`/landowner/land/${land.id}`)}
                                    style={{ background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(10px)', borderRadius: 20, border: '1px solid rgba(255,255,255,0.1)', padding: 28, cursor: 'pointer', transition: 'all 0.3s', position: 'relative', overflow: 'hidden' }}
                                    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 12px 40px rgba(0,0,0,0.3)'; }}
                                    onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}>

                                    {/* Top row */}
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
                                        <div>
                                            <h3 style={{ color: '#fff', fontSize: 20, fontWeight: 700, margin: '0 0 6px' }}>{land.landName}</h3>
                                            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, margin: 0 }}>
                                                📍 {[land.specificLocation, land.city, land.state].filter(Boolean).join(', ')}
                                            </p>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                            <span style={{ background: statusCfg.bg, color: statusCfg.color, border: `1px solid ${statusCfg.color}30`, borderRadius: 20, padding: '5px 14px', fontSize: 13, fontWeight: 600 }}>
                                                {statusCfg.icon} {statusCfg.label}
                                            </span>
                                            {!land.isVerified && (
                                                <button onClick={(e) => handleDelete(land.id, e)}
                                                    style={{ padding: '5px 14px', background: 'rgba(239,68,68,0.15)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 20, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                                                    🗑 Remove
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    {/* Info grid */}
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14, marginBottom: 16 }}>
                                        <InfoChip icon="📐" label="Area" value={`${land.totalArea} ${land.areaUnit}`} />
                                        <InfoChip icon="⭐" label="Rating" value={<StarDisplay value={land.overallRating} />} />
                                        <InfoChip icon="₨" label="Monthly Rent" value={land.rentalFeeMonthly ? `₨ ${parseFloat(land.rentalFeeMonthly).toLocaleString()}` : '—'} />
                                        <InfoChip icon="📅" label="Min. Period" value={land.minimumRentalPeriod ? `${land.minimumRentalPeriod} months` : '—'} />
                                    </div>

                                    {/* Cultivable plants */}
                                    {plants.length > 0 && (
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
                                            {plants.slice(0, 6).map(p => (
                                                <span key={p} style={{ background: 'rgba(34,197,94,0.1)', color: '#86efac', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 20, padding: '3px 10px', fontSize: 12 }}>
                                                    🌱 {p}
                                                </span>
                                            ))}
                                            {plants.length > 6 && (
                                                <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, padding: '3px 0' }}>+{plants.length - 6} more</span>
                                            )}
                                        </div>
                                    )}

                                    {/* Photos strip */}
                                    {photos.length > 0 && (
                                        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                                            {photos.slice(0, 4).map((url, i) => (
                                                <img 
                                                    key={i} 
                                                    src={getMediaUrl(url)} 
                                                    alt={`Land photo ${i + 1}`} 
                                                    style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)' }} 
                                                />
                                            ))}
                                            {photos.length > 4 && (
                                                <div style={{ width: 60, height: 60, background: 'rgba(255,255,255,0.1)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.6)', fontSize: 12, fontWeight: 700 }}>
                                                    +{photos.length - 4}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Active farms */}
                                    {land.farms && land.farms.length > 0 && (
                                        <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>
                                            🏡 {land.farms.length} active farm{land.farms.length > 1 ? 's' : ''} on this land
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
                * { box-sizing: border-box; }
            `}</style>
        </div>
    );
}

function InfoChip({ icon, label, value }) {
    return (
        <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: '10px 14px' }}>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', margin: '0 0 4px' }}>{icon} {label}</p>
            <div style={{ color: '#fff', fontWeight: 600, fontSize: 14 }}>{value}</div>
        </div>
    );
}
