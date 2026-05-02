import React, { useState, useEffect } from 'react';
import { adminService } from '../services/adminService';
import { getMediaUrl } from '../services/api';

const PendingLandsList = () => {
    const [lands, setLands] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [processingId, setProcessingId] = useState(null);

    const fetchPendingLands = async () => {
        try {
            setLoading(true);
            const response = await adminService.getPendingLands();
            // The backend successResponse puts data in response.data
            const landsArray = response.data || [];
            setLands(Array.isArray(landsArray) ? landsArray : []);
            setError(null);
        } catch (err) {
            console.error('Error fetching pending lands:', err);
            setError('Failed to load pending lands.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPendingLands();
    }, []);

    const handleApprove = async (id) => {
        if (!window.confirm('Approve this land registration?')) return;
        setProcessingId(id);
        try {
            await adminService.approveLand(id);
            setLands(lands.filter(l => l.id !== id));
        } catch (err) {
            console.error('Error approving land:', err);
            alert('Failed to approve land.');
        } finally {
            setProcessingId(null);
        }
    };

    const handleReject = async (id) => {
        const reason = prompt('Enter rejection reason:');
        if (!reason) return;
        setProcessingId(id);
        try {
            await adminService.rejectLand(id, reason);
            setLands(lands.filter(l => l.id !== id));
        } catch (err) {
            console.error('Error rejecting land:', err);
            alert('Failed to reject land.');
        } finally {
            setProcessingId(null);
        }
    };

    if (loading && (!lands || lands.length === 0)) return <div className="text-center py-4 text-white">Loading pending lands...</div>;

    if (error) return <div className="text-center py-4 text-red-400">{error}</div>;

    return (
        <div className="rounded-xl overflow-hidden mb-8" style={{ background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <div className="px-6 py-4 border-b border-white/10 flex justify-between items-center">
                <h3 className="text-lg font-bold text-white">Pending Land Approvals</h3>
                <span className="bg-yellow-500/20 text-yellow-500 px-3 py-1 rounded-full text-xs font-semibold border border-yellow-500/30">
                    {lands.length} Pending
                </span>
            </div>

            {lands.length === 0 ? (
                <div className="p-6 text-center text-white/50">No pending land approvals.</div>
            ) : (
                <div className="divide-y divide-white/10">
                    {lands.map((land) => {
                        // Parse landPhotos if it's a string
                        let photos = [];
                        try {
                            if (land.landPhotos) {
                                photos = typeof land.landPhotos === 'string'
                                    ? JSON.parse(land.landPhotos)
                                    : land.landPhotos;
                            }
                        } catch (e) {
                            console.error('Error parsing land photos:', e);
                        }

                        return (
                            <div key={land.id} className="p-6 hover:bg-white/5 transition-colors">
                                <div className="flex flex-col md:flex-row justify-between gap-6">
                                    <div className="flex-1">
                                        <h4 className="font-bold text-white text-xl mb-1">
                                            {land.landName || land.specificLocation}
                                        </h4>
                                        <p className="text-sm text-white/60 mb-3">
                                            Owner: <span className="text-white font-medium">{land.landowner?.user?.fullName || 'N/A'}</span> ({land.landowner?.user?.email || 'N/A'})
                                        </p>

                                        <div className="space-y-1 mb-4 text-sm text-white/70">
                                            <p className="flex items-center gap-2">
                                                <span className="text-white/40">📍</span> {land.city}, {land.state}, {land.country}
                                            </p>
                                            <p className="flex items-center gap-2">
                                                <span className="text-white/40">📐</span> Area: {land.totalArea} {land.areaUnit}
                                            </p>
                                        </div>

                                        <div className="flex flex-wrap gap-3 mb-4">
                                            <a
                                                href={getMediaUrl(land.ownershipDocumentUrl) || '#'}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white/80 hover:text-white transition-all text-sm flex items-center gap-2"
                                            >
                                                📄 View Ownership Document
                                            </a>
                                        </div>

                                        {/* Image Gallery */}
                                        {photos.length > 0 && (
                                            <div className="mt-4">
                                                <p className="text-xs font-bold text-white/40 uppercase tracking-widest mb-2">Land Photos</p>
                                                <div className="flex flex-wrap gap-2">
                                                    {photos.map((photo, idx) => {
                                                        const fullUrl = getMediaUrl(photo);
                                                        return (
                                                            <a key={idx} href={fullUrl} target="_blank" rel="noopener noreferrer" className="group relative" title={fullUrl}>
                                                                <img
                                                                    src={fullUrl}
                                                                    alt={`Land ${idx}`}
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
                                            onClick={() => handleApprove(land.id)}
                                            disabled={processingId === land.id}
                                            className="px-8 py-2.5 bg-green-500 hover:bg-green-600 text-black font-bold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(34,197,94,0.3)]"
                                        >
                                            {processingId === land.id ? (
                                                <span className="flex items-center gap-2">
                                                    <span className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                                                    Processing
                                                </span>
                                            ) : 'Approve'}
                                        </button>
                                        <button
                                            onClick={() => handleReject(land.id)}
                                            disabled={processingId === land.id}
                                            className="px-8 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 font-bold rounded-xl border border-red-500/20 transition-all disabled:opacity-50"
                                        >
                                            Reject
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

export default PendingLandsList;
