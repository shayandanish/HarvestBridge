import React, { useState, useEffect } from 'react';
import { adminService } from '../services/adminService';
import { getMediaUrl } from '../services/api';

const PendingFarmsList = () => {
    const [farms, setFarms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [processingId, setProcessingId] = useState(null);

    const fetchPendingFarms = async () => {
        try {
            setLoading(true);
            const response = await adminService.getPendingFarms();
            // The backend successResponse puts data in response.data
            const farmsArray = response.data || [];
            setFarms(Array.isArray(farmsArray) ? farmsArray : []);
            setError(null);
        } catch (err) {
            console.error('Error fetching pending farms:', err);
            setError('Failed to load pending farms.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPendingFarms();
    }, []);

    const handleApprove = async (id) => {
        if (!window.confirm('Approve this farm application?')) return;
        setProcessingId(id);
        try {
            await adminService.approveFarm(id);
            setFarms(farms.filter(f => f.id !== id));
        } catch (err) {
            console.error('Error approving farm:', err);
            alert('Failed to approve farm.');
        } finally {
            setProcessingId(null);
        }
    };

    const handleReject = async (id) => {
        const reason = prompt('Enter rejection reason:');
        if (!reason) return;
        setProcessingId(id);
        try {
            await adminService.rejectFarm(id, reason);
            setFarms(farms.filter(f => f.id !== id));
        } catch (err) {
            console.error('Error rejecting farm:', err);
            alert('Failed to reject farm.');
        } finally {
            setProcessingId(null);
        }
    };

    if (loading && (!farms || farms.length === 0)) return <div className="text-center py-4 text-white">Loading pending farms...</div>;

    if (error) return <div className="text-center py-4 text-red-400">{error}</div>;

    return (
        <div className="rounded-xl overflow-hidden mb-8" style={{ background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <div className="px-6 py-4 border-b border-white/10 flex justify-between items-center">
                <h3 className="text-lg font-bold text-white">Pending Farm Approvals</h3>
                <span className="bg-yellow-500/20 text-yellow-500 px-3 py-1 rounded-full text-xs font-semibold border border-yellow-500/30">
                    {farms.length} Pending
                </span>
            </div>

            {farms.length === 0 ? (
                <div className="p-6 text-center text-white/50">No pending farm approvals.</div>
            ) : (
                <div className="divide-y divide-white/10">
                    {farms.map((farm) => (
                        <div key={farm.id} className="p-6 hover:bg-white/5 transition-colors">
                            <div className="flex flex-col md:flex-row justify-between gap-6">
                                <div className="flex-1">
                                    <h4 className="font-bold text-white text-xl mb-1">
                                        {farm.farmName}
                                    </h4>
                                    <p className="text-sm text-white/60 mb-3">
                                        Farmer: <span className="text-white font-medium">{farm.farmer?.user?.fullName || 'N/A'}</span> ({farm.farmer?.user?.email || 'N/A'})
                                    </p>

                                    <div className="space-y-1 mb-4 text-sm text-white/70">
                                        <p className="flex items-center gap-2">
                                            <span className="text-white/40">📍</span> On Land: <span className="text-white font-medium">{farm.land?.landName || farm.land?.specificLocation || `Land #${farm.land?.id}`}</span> ({farm.land?.city})
                                        </p>
                                        <p className="flex items-center gap-2">
                                            <span className="text-white/40">📐</span> Allocated Area: {farm.totalArea} {farm.areaUnit}
                                        </p>
                                    </div>

                                    <div className="bg-white/5 rounded-xl p-4 border border-white/5 italic text-sm text-white/60 mb-4">
                                        "{farm.description}"
                                    </div>

                                    {/* Farm Photos */}
                                    {farm.photos && farm.photos.length > 0 && (
                                        <div className="mt-4">
                                            <p className="text-xs font-bold text-white/40 uppercase tracking-widest mb-2">Farm Photos</p>
                                            <div className="flex flex-wrap gap-2">
                                                {farm.photos.map((photo, idx) => {
                                                    const fullUrl = getMediaUrl(photo.photoUrl);
                                                    return (
                                                        <a key={photo.id} href={fullUrl} target="_blank" rel="noopener noreferrer" className="group relative" title={fullUrl}>
                                                            <img
                                                                src={fullUrl}
                                                                alt={`Farm ${idx}`}
                                                                className="w-20 h-20 object-cover rounded-lg border border-white/10 hover:border-green-500/50 transition-all shadow-lg"
                                                            />
                                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center text-[10px] text-white font-bold">VIEW</div>
                                                        </a>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="flex md:flex-col gap-3 justify-center md:justify-start">
                                    <button
                                        onClick={() => handleApprove(farm.id)}
                                        disabled={processingId === farm.id}
                                        className="px-8 py-2.5 bg-green-500 hover:bg-green-600 text-black font-bold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(34,197,94,0.3)]"
                                    >
                                        {processingId === farm.id ? (
                                            <span className="flex items-center gap-2">
                                                <span className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                                                Processing
                                            </span>
                                        ) : 'Approve'}
                                    </button>
                                    <button
                                        onClick={() => handleReject(farm.id)}
                                        disabled={processingId === farm.id}
                                        className="px-8 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 font-bold rounded-xl border border-red-500/20 transition-all disabled:opacity-50"
                                    >
                                        Reject
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default PendingFarmsList;
