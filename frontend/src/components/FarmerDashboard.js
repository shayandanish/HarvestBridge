import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMediaUrl } from '../services/api';
import { farmerService } from '../services/farmerService';
import NotificationBell from './NotificationBell';

const FarmerDashboard = () => {
    const navigate = useNavigate();
    const [profile, setProfile] = useState(null);
    const [farms, setFarms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [modal, setModal] = useState({ show: false, message: '', type: 'success' });

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const [farmsRes, profileRes] = await Promise.all([
                    farmerService.getMyFarms(),
                    farmerService.getMyProfile()
                ]);

                const farmsData = farmsRes?.data || farmsRes || [];
                setFarms(Array.isArray(farmsData) ? farmsData : []);

                const profileData = profileRes?.data || profileRes;
                setProfile(profileData);

                setError(null);
            } catch (err) {
                console.error('Error fetching dashboard data:', err);
                setError(err?.response?.data?.message || err.message || 'Error loading dashboard');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const handleAcceptHiring = async (farmId) => {
        try {
            await farmerService.acceptHiring(farmId);
            setFarms(prev => prev.map(f => f.id === farmId ? { ...f, hiringStatus: 'awaiting_payment' } : f));
            alert('Hiring request accepted! Awaiting investor payment.');
        } catch (err) {
            alert('Failed to accept hiring request.');
        }
    };

    const handleRejectHiring = async (farmId) => {
        if (window.confirm('Are you sure you want to reject this hiring request?')) {
            try {
                await farmerService.rejectHiring(farmId);
                setFarms(prev => prev.map(f => f.id === farmId ? { ...f, farmerId: null, hiringStatus: 'rejected' } : f));
                alert('Hiring request rejected.');
            } catch (err) {
                alert('Failed to reject hiring request.');
            }
        }
    };

    const handleDeleteProfile = async () => {
        if (window.confirm('Are you sure you want to delete your farmer profile? This will also delete all your active farms and cannot be undone.')) {
            try {
                await farmerService.deleteProfile();
                setProfile(null);
                setFarms([]);
                alert('Profile deleted successfully');
            } catch (err) {
                alert('Failed to delete profile');
            }
        }
    };

    const handleRequestPayment = async (farmId) => {
        const farm = farms.find(f => f.id === farmId);
        if (farm && farm.paymentRequestSent) {
            setModal({
                show: true,
                message: 'Payment request has already been sent to the investor!',
                type: 'info'
            });
            return;
        }

        try {
            await farmerService.requestPayment(farmId);
            setFarms(prev => prev.map(f => f.id === farmId ? { ...f, paymentRequestSent: true } : f));
            setModal({
                show: true,
                message: 'Payment request sent to investor successfully!',
                type: 'success'
            });
        } catch (err) {
            setModal({
                show: true,
                message: 'Failed to send payment request. Please try again.',
                type: 'error'
            });
        }
    };

    const handleBrowseLands = () => {
        navigate('/lands/browse');
    };

    if (loading) {
        return <div className="text-center py-10">Loading dashboard...</div>;
    }

    return (
        <>
            <div className="container mx-auto px-4 py-8">
            {/* Profile Quick-Access Banner */}
            <div style={{
                background: profile ? 'linear-gradient(135deg, #14532d, #16a34a)' : 'linear-gradient(135deg, #4b5563, #1f2937)',
                borderRadius: 16, padding: '20px 24px', marginBottom: 24,
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                gap: 16, flexWrap: 'wrap',
                boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                position: 'relative', zIndex: 50,
            }}>
                <div className="flex-1 text-center md:text-left mb-6 md:mb-0">
                    <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight mb-2">Farmer Dashboard</h2>
                    <p className="text-green-100/70 font-medium max-w-xl mx-auto md:mx-0">
                        {profile
                            ? 'Manage your public profile and listings for investors.'
                            : 'Create your profile to start listing farms and attracting investors.'}
                    </p>
                </div>
                <div className="flex flex-wrap justify-center md:justify-end gap-3 items-center w-full md:w-auto">
                    <div className="p-2 bg-white/10 backdrop-blur-md rounded-xl border border-white/20">
                        <NotificationBell align="left" />
                    </div>
                    <button
                        onClick={() => navigate('/messages')}
                        className="flex-1 md:flex-none bg-white/20 text-white border border-white/30 rounded-xl px-4 py-3 font-bold text-sm hover:bg-white/30 transition-all shadow-lg whitespace-nowrap"
                    >
                        💬 Messages
                    </button>
                    <button
                        onClick={() => navigate('/farmer/profile')}
                        className={`flex-1 md:flex-none px-6 py-3 rounded-xl font-bold text-sm transition-all shadow-lg whitespace-nowrap ${profile ? 'bg-white text-green-800 hover:bg-green-50' : 'bg-green-600 text-white hover:bg-green-700'
                            }`}
                    >
                        {profile ? 'Edit Profile' : 'Create Profile'}
                    </button>
                    {profile && (
                        <button
                            onClick={() => navigate('/farmer/managed-farms')}
                            className="w-full md:w-auto bg-white text-green-600 border-2 border-green-600 rounded-xl px-6 py-3 font-black text-sm hover:bg-green-50 transition-all shadow-lg whitespace-nowrap"
                        >
                            🚜 Managed Farms (New)
                        </button>
                    )}
                    {profile && (
                        <button
                            onClick={() => navigate('/farmer/earnings')}
                            className="w-full md:w-auto bg-white/20 text-white border border-white/30 rounded-xl px-6 py-3 font-bold text-sm hover:bg-white/30 transition-all shadow-lg whitespace-nowrap"
                        >
                            💰 My Earnings
                        </button>
                    )}
                </div>
                {profile && (
                    <button
                        onClick={handleDeleteProfile}
                        style={{
                            background: '#fee2e2', color: '#dc2626', border: 'none',
                            borderRadius: 10, padding: '10px 22px', fontWeight: 700,
                            fontSize: 14, cursor: 'pointer', whiteSpace: 'nowrap',
                        }}
                        title="Delete Profile"
                    >
                        Delete Profile
                    </button>
                )}
            </div>

            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">My Farms</h2>
                <button
                    onClick={handleBrowseLands}
                    className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded transition duration-200"
                >
                    + Find Land & Start Farm
                </button>
            </div>

            {/* Pending Requests Section */}
            {farms.some(f => f.hiringStatus === 'pending') && (
                <div className="mb-10">
                    <h3 className="text-xl font-bold text-orange-600 mb-4 flex items-center">
                        <span className="mr-2">📩</span> Pending Hiring Requests
                    </h3>
                    <div className="grid md:grid-cols-2 gap-4">
                        {farms.filter(f => f.hiringStatus === 'pending').map(farm => (
                            <div key={farm.id} className="bg-orange-50 border-2 border-orange-200 rounded-xl p-5 flex justify-between items-center">
                                <div>
                                    <h4 className="font-bold text-gray-900 text-lg">{farm.farmName}</h4>
                                    <p className="text-gray-600 text-sm">
                                        Investor: <span className="font-medium">{farm.investor?.fullName || 'Investor'}</span>
                                    </p>
                                    <p className="text-gray-500 font-bold text-sm mb-6 flex items-center gap-2">
                                        {farm.land?.city}, {farm.land?.state}
                                    </p>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleAcceptHiring(farm.id)}
                                        className="bg-green-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-green-700 transition shadow-sm"
                                    >
                                        Accept
                                    </button>
                                    <button
                                        onClick={() => handleRejectHiring(farm.id)}
                                        className="bg-white text-red-600 border border-red-200 px-4 py-2 rounded-lg font-bold hover:bg-red-50 transition"
                                    >
                                        Reject
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}


            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                    {error}
                </div>
            )}

            {farms.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="text-gray-500 mb-6 text-lg">You don't have any active farms yet.</p>
                    <p className="text-gray-400 mb-6">Browse available lands to start your farming journey.</p>
                    <button
                        onClick={handleBrowseLands}
                        className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg transition duration-200 shadow-md"
                    >
                        Browse Available Lands
                    </button>
                </div>
            ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {farms.map((farm) => (
                        <div key={farm.id} className="group bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
                            <div className="relative h-48 bg-gray-200">
                                {farm.photos && farm.photos.length > 0 ? (
                                    <img
                                        src={getMediaUrl(farm.photos.find(p => p.isPrimary)?.photoUrl || farm.photos[0].photoUrl)}
                                        alt={farm.farmName || 'Farm'}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                    />
                                ) : (
                                    <img
                                        src="https://images.unsplash.com/photo-1500382017468-9049fed747ef?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
                                        alt="Farm placeholder"
                                        className="w-full h-full object-cover opacity-70"
                                    />
                                )}
                                <div className="absolute top-4 right-4 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-xs font-bold text-green-700 shadow-sm">
                                    {farm.isDirectPlanting ? '🌳 Plant Tree Project' : '🌾 Lease Land & Crops'}
                                </div>
                                {!farm.isApproved && (
                                    <div className="absolute top-4 left-4 bg-yellow-500/90 backdrop-blur px-3 py-1 rounded-full text-[10px] font-extrabold text-white uppercase tracking-tighter shadow-sm">
                                        Pending Approval
                                    </div>
                                )}
                            </div>

                            <div className="p-6">
                                <div className="flex justify-between items-start mb-4">
                                    <h3 className="text-xl font-bold text-gray-900 group-hover:text-green-600 transition-colors uppercase tracking-tight truncate">
                                        {farm.farmName}
                                    </h3>
                                </div>

                                {farm.hiringStatus && farm.hiringStatus !== 'none' && (
                                    <div className="mb-4">
                                        <span className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-lg ${farm.hiringStatus === 'accepted' ? 'bg-green-50 text-green-600 border border-green-100' :
                                            farm.hiringStatus === 'awaiting_payment' ? 'bg-orange-50 text-orange-600 border border-orange-100' :
                                                farm.hiringStatus === 'pending' ? 'bg-blue-50 text-blue-600 border border-blue-100' :
                                                    'bg-red-50 text-red-600 border border-red-100'
                                            }`}>
                                            Hiring Status: {farm.hiringStatus.replace('_', ' ')}
                                        </span>
                                    </div>
                                )}

                                <div className="space-y-3 mb-6">
                                    <div className="flex items-center text-sm text-gray-500 bg-gray-50/50 p-2 rounded-xl">
                                        <span className="mr-2 opacity-70">📍</span>
                                        <span className="font-medium truncate">{farm.land?.city}, {farm.land?.state}</span>
                                    </div>
                                    <div className="flex items-center text-sm text-gray-500 bg-gray-50/50 p-2 rounded-xl">
                                        <span className="mr-2 opacity-70">📏</span>
                                        <span className="font-medium">{farm.totalArea} {farm.areaUnit || farm.land?.areaUnit}</span>
                                    </div>
                                    <div className="flex items-center text-sm text-gray-500 bg-gray-50/50 p-2 rounded-xl">
                                        <span className="mr-2 opacity-70">👤</span>
                                        <span className="font-medium truncate">Investor: {farm.investor?.fullName || 'Self Managed'}</span>
                                    </div>
                                </div>

                                {/* Plant Inventory Quick View */}
                                <div className="mb-6">
                                    <div className="flex justify-between items-center mb-2">
                                        <h4 className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest">Plants & Trees</h4>
                                        <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                                            {(() => {
                                                const plantCount = farm.plants?.length || 0;
                                                const pendingCount = farm.plantationRequests?.filter(r => r.status === 'pending').reduce((total, req) => 
                                                    total + req.items.reduce((itemTotal, item) => itemTotal + item.quantity, 0), 0) || 0;
                                                return plantCount + pendingCount;
                                            })()} Total
                                        </span>
                                    </div>
                                    <div className="flex flex-wrap gap-1.5 min-h-[24px]">
                                        {farm.plants?.slice(0, 3).map((plant) => (
                                            <span key={plant.id} className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-md font-bold">
                                                {plant.cropType?.name || 'Plant'}
                                            </span>
                                        ))}
                                        {/* Pending Requests Preview */}
                                        {farm.plantationRequests?.filter(r => r.status === 'pending').slice(0, 2).map((request) => (
                                            request.items.map((item, idx) => (
                                                <span key={`${request.id}-${idx}`} className="text-[10px] bg-orange-100 text-orange-600 px-2 py-0.5 rounded-md font-bold">
                                                    {item.tree?.name} (TO BE)
                                                </span>
                                            ))
                                        ))}
                                        {((farm.plants?.length || 0) + (farm.plantationRequests?.filter(r => r.status === 'pending').length || 0)) > 4 && (
                                            <span className="text-[10px] text-gray-400 font-bold">+ more</span>
                                        )}
                                        {(!farm.plants || farm.plants.length === 0) && (!farm.plantationRequests || !farm.plantationRequests.some(r => r.status === 'pending')) && (
                                            <span className="text-[10px] text-gray-300 italic">No plants yet</span>
                                        )}
                                    </div>
                                </div>

                                <div className="flex gap-2">
                                    <button
                                        className="flex-[2] bg-green-600 text-white py-3 rounded-2xl hover:bg-green-700 transition duration-200 font-bold shadow-md shadow-green-100"
                                        onClick={() => navigate(farm.hiringStatus === 'accepted' ? `/farmer/farm/${farm.id}/manage` : `/farms/${farm.id}`)}
                                    >
                                        Manage Farm
                                    </button>
                                    
                                    {farm.hiringStatus === 'awaiting_payment' && (
                                        <button
                                            className="flex-1 bg-orange-600 text-white py-3 rounded-2xl hover:bg-orange-700 transition duration-200 font-bold shadow-sm"
                                            onClick={() => handleRequestPayment(farm.id)}
                                        >
                                            Request Payment
                                        </button>
                                    )}

                                    <button
                                        className="px-4 bg-red-50 text-red-600 py-3 rounded-2xl hover:bg-red-100 transition duration-200"
                                        onClick={async (e) => {
                                            e.stopPropagation();
                                            if (window.confirm('Are you sure you want to delete this farm? This cannot be undone.')) {
                                                try {
                                                    await farmerService.deleteFarm(farm.id);
                                                    setFarms(prev => prev.filter(f => f.id !== farm.id));
                                                } catch (err) {
                                                    alert('Failed to delete farm');
                                                }
                                            }
                                        }}
                                        title="Delete Farm"
                                    >
                                        🗑️
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Success/Information Modal */}
            {modal.show && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 animate-fade-in">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden transform transition-all scale-100">
                        <div className={`h-2 ${modal.type === 'success' ? 'bg-green-500' : modal.type === 'error' ? 'bg-red-500' : 'bg-blue-500'}`} />
                        <div className="p-6 text-center">
                            <div className={`mx-auto w-16 h-16 flex items-center justify-center rounded-full mb-4 ${modal.type === 'success' ? 'bg-green-100 text-green-600' : modal.type === 'error' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                                {modal.type === 'success' ? (
                                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                    </svg>
                                ) : modal.type === 'error' ? (
                                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                ) : (
                                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                )}
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">
                                {modal.type === 'success' ? 'Success!' : modal.type === 'error' ? 'Oops!' : 'Notice'}
                            </h3>
                            <p className="text-gray-600 mb-6">
                                {modal.message}
                            </p>
                            <button
                                onClick={() => setModal({ ...modal, show: false })}
                                className={`w-full py-3 rounded-xl font-bold text-white transition shadow-lg ${modal.type === 'success' ? 'bg-green-600 hover:bg-green-700 shadow-green-200' : modal.type === 'error' ? 'bg-red-600 hover:bg-red-700 shadow-red-200' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-200'}`}
                            >
                                Got it
                            </button>
                        </div>
                    </div>
                </div>
            )}
            </div>
        </>
    );
};

export default FarmerDashboard;
