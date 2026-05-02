import React, { useState, useEffect } from 'react';
import { adminService } from '../services/adminService';
import { getMediaUrl } from '../services/api';

const PendingFarmersList = () => {
    const [farmers, setFarmers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState({});

    useEffect(() => {
        loadPendingFarmers();
    }, []);

    const loadPendingFarmers = async () => {
        try {
            setLoading(true);
            const response = await adminService.getPendingFarmerProfiles();
            setFarmers(response.data || []);
        } catch (error) {
            console.error('Error loading pending farmers:', error);
            setFarmers([]);
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (farmerId) => {
        try {
            setProcessing(prev => ({ ...prev, [farmerId]: 'approving' }));
            await adminService.approveFarmerProfile(farmerId);
            await loadPendingFarmers(); // Refresh list
        } catch (error) {
            console.error('Error approving farmer:', error);
            alert('Failed to approve farmer profile');
        } finally {
            setProcessing(prev => ({ ...prev, [farmerId]: null }));
        }
    };

    const handleReject = async (farmerId) => {
        const rejectionReason = prompt('Please provide rejection reason:');
        if (!rejectionReason) return;

        try {
            setProcessing(prev => ({ ...prev, [farmerId]: 'rejecting' }));
            await adminService.rejectFarmerProfile(farmerId, { rejectionReason });
            await loadPendingFarmers(); // Refresh list
        } catch (error) {
            console.error('Error rejecting farmer:', error);
            alert('Failed to reject farmer profile');
        } finally {
            setProcessing(prev => ({ ...prev, [farmerId]: null }));
        }
    };

    const handleDelete = async (farmerId) => {
        if (!window.confirm('Are you sure you want to permanently delete this farmer profile?')) return;

        try {
            setProcessing(prev => ({ ...prev, [farmerId]: 'deleting' }));
            await adminService.deleteFarmerProfile(farmerId);
            await loadPendingFarmers(); // Refresh list
        } catch (error) {
            console.error('Error deleting farmer:', error);
            alert('Failed to delete farmer profile. ' + (error.response?.data?.message || ''));
        } finally {
            setProcessing(prev => ({ ...prev, [farmerId]: null }));
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
            </div>
        );
    }

    return (
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
            <h3 className="text-2xl font-bold text-white mb-6">Pending Farmer Profiles</h3>

            {farmers.length === 0 ? (
                <div className="text-center py-12">
                    <p className="text-white/60">No pending farmer profiles to review</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {farmers.map((farmer) => (
                        <div key={farmer.id} className="bg-white/5 border border-white/10 rounded-lg p-4">
                            <div className="flex items-start gap-4">
                                {/* Profile Photo */}
                                <img
                                    src={getMediaUrl(farmer.user.profilePhotoUrl) || `https://ui-avatars.com/api/?name=${encodeURIComponent(farmer.user.fullName)}&background=16a34a&color=fff&size=64`}
                                    alt={farmer.user.fullName}
                                    className="w-16 h-16 rounded-full object-cover border-2 border-white/20"
                                />

                                {/* Farmer Info */}
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <h4 className="text-lg font-semibold text-white">{farmer.user.fullName}</h4>
                                        <span className="px-2 py-1 bg-yellow-500/20 text-yellow-300 text-xs rounded-full">
                                            Pending Verification
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-white/70 mb-3">
                                        <div>📧 {farmer.user.email}</div>
                                        <div>📱 {farmer.user.phone}</div>
                                        <div>🎂 Age: {farmer.age || 'Not specified'}</div>
                                        <div>📍 Location: {farmer.location || 'Not specified'}</div>
                                        <div>🌾 Specialization: {farmer.specialization || 'Not specified'}</div>
                                        <div>💰 Charges/Task: {farmer.chargesPerTask || 'Not specified'}</div>
                                        <div>📅 Experience: {farmer.experienceYears ? `${farmer.experienceYears} years` : 'Not specified'}</div>
                                        <div>👥 Profile Public: {farmer.isProfilePublic ? 'Yes' : 'No'}</div>
                                    </div>

                                    {farmer.bio && (
                                        <div className="mb-3">
                                            <p className="text-sm text-white/60">Bio:</p>
                                            <p className="text-sm text-white/80">{farmer.bio}</p>
                                        </div>
                                    )}

                                    {farmer.services && Array.isArray(farmer.services) && farmer.services.length > 0 && (
                                        <div className="mb-3">
                                            <p className="text-sm text-white/60 mb-1">Services:</p>
                                            <div className="flex flex-wrap gap-1">
                                                {farmer.services.map((service, index) => (
                                                    <span key={index} className="px-2 py-1 bg-green-500/20 text-green-300 text-xs rounded">
                                                        {service}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Action Buttons */}
                                <div className="flex flex-col gap-2">
                                    <button
                                        onClick={() => handleApprove(farmer.id)}
                                        disabled={processing[farmer.id] === 'approving'}
                                        className="px-4 py-2 bg-green-500 hover:bg-green-600 disabled:bg-green-500/50 text-white rounded-lg font-medium transition-colors"
                                    >
                                        {processing[farmer.id] === 'approving' ? 'Approving...' : 'Approve'}
                                    </button>
                                    <button
                                        onClick={() => handleReject(farmer.id)}
                                        disabled={processing[farmer.id] === 'rejecting' || processing[farmer.id] === 'deleting'}
                                        className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 disabled:bg-yellow-500/50 text-white rounded-lg font-medium transition-colors"
                                    >
                                        {processing[farmer.id] === 'rejecting' ? 'Rejecting...' : 'Reject'}
                                    </button>
                                    <button
                                        onClick={() => handleDelete(farmer.id)}
                                        disabled={processing[farmer.id] === 'deleting'}
                                        className="px-4 py-2 bg-red-500 hover:bg-red-600 disabled:bg-red-500/50 text-white rounded-lg font-medium transition-colors"
                                    >
                                        {processing[farmer.id] === 'deleting' ? 'Deleting...' : 'Delete'}
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

export default PendingFarmersList;
