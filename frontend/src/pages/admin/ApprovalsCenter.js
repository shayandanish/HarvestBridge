import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { adminService } from '../../services/adminService';
import { getMediaUrl } from '../../services/api';
import './ApprovalsCenter.css';

const ApprovalsCenter = () => {
    const [activeTab, setActiveTab] = useState('lands');
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [counts, setCounts] = useState({ lands: 0, farms: 0, kyc: 0, farmers: 0 });

    useEffect(() => {
        fetchCounts();
        fetchTabContent();
    }, [activeTab]);

    const fetchCounts = async () => {
        try {
            // approvals/pending endpoint is handled by adminController.getPendingApprovalsSummary
            const response = await api.get('/admin/approvals/pending');
            setCounts(response.data.data);
        } catch (err) {
            console.error('Failed to fetch approval counts');
        }
    };

    const fetchTabContent = async () => {
        setLoading(true);
        setError('');
        try {
            let response;
            if (activeTab === 'lands') response = await adminService.getPendingLands();
            else if (activeTab === 'farms') response = await adminService.getPendingFarms();
            else if (activeTab === 'kyc') {
                // api instance handles token automatically
                const res = await api.get('/admin/users/kyc/pending');
                response = res.data;
            }
            else if (activeTab === 'farmers') response = await adminService.getPendingFarmerProfiles();

            // Normalize data mapping
            setData(response.data || []);
        } catch (err) {
            setError(`Failed to fetch pending ${activeTab}`);
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (id, action, rejectionReason = null) => {
        try {
            if (activeTab === 'lands') {
                if (action === 'approve') await adminService.approveLand(id);
                else await adminService.rejectLand(id, rejectionReason);
            }
            else if (activeTab === 'farms') {
                if (action === 'approve') await adminService.approveFarm(id);
                else await adminService.rejectFarm(id, rejectionReason);
            }
            else if (activeTab === 'kyc') {
                const endpoint = `/admin/users/${id}/kyc-${action}`;
                const payload = action === 'reject' ? { rejectionReason } : {};
                await api.put(endpoint, payload);
            }
            else if (activeTab === 'farmers') {
                if (action === 'approve') await adminService.approveFarmerProfile(id);
                else await adminService.rejectFarmerProfile(id, rejectionReason);
            }

            alert(`${activeTab.slice(0, -1).toUpperCase()} ${action === 'approve' ? 'approved' : 'rejected'} successfully`);
            fetchTabContent();
            fetchCounts();
        } catch (err) {
            alert('Action failed: ' + (err.response?.data?.message || err.message));
        }
    };

    const promptReject = (id) => {
        const reason = window.prompt('Please provide a reason for rejection:');
        if (reason) handleAction(id, 'reject', reason);
    };

    return (
        <div className="approvals-center">
            <div className="section-header">
                <h2>Approvals Center</h2>
                <p>Consolidated verification queue</p>
            </div>

            <div className="tabs-nav">
                <button
                    className={activeTab === 'lands' ? 'tab-btn active' : 'tab-btn'}
                    onClick={() => setActiveTab('lands')}
                >
                    Land Verification <span className="count">{counts.lands}</span>
                </button>
                <button
                    className={activeTab === 'farms' ? 'tab-btn active' : 'tab-btn'}
                    onClick={() => setActiveTab('farms')}
                >
                    Farm Listings <span className="count">{counts.farms}</span>
                </button>
                <button
                    className={activeTab === 'kyc' ? 'tab-btn active' : 'tab-btn'}
                    onClick={() => setActiveTab('kyc')}
                >
                    KYC Documents <span className="count">{counts.kyc}</span>
                </button>
                <button
                    className={activeTab === 'farmers' ? 'tab-btn active' : 'tab-btn'}
                    onClick={() => setActiveTab('farmers')}
                >
                    Farmer Profiles <span className="count">{counts.farmers}</span>
                </button>
            </div>

            {error && <div className="error-msg">{error}</div>}

            <div className="approvals-content">
                {loading ? (
                    <div className="loading-state">Syncing verification queue...</div>
                ) : data.length > 0 ? (
                    <div className="data-grid">
                        {data.map(item => (
                            <div key={item.id} className="approval-item-card">
                                <div className="card-header">
                                    <div className="requester-info">
                                        <h4>{activeTab === 'kyc' ? item.fullName : (activeTab === 'farmers' ? item.user?.fullName : (item.landName || item.farmName))}</h4>
                                        <span>BY: {activeTab === 'kyc' ? item.email : (activeTab === 'farmers' ? item.user?.email : (item.landowner?.user?.fullName || item.farmer?.user?.fullName))}</span>
                                    </div>
                                    <span className="date-tag">{new Date(item.createdAt).toLocaleDateString()}</span>
                                </div>
                                <div className="card-body">
                                    {activeTab === 'lands' && (
                                        <div className="details">
                                            <p><i className="fas fa-map-marker-alt"></i> {item.address}, {item.city}</p>
                                            <p><i className="fas fa-expand-arrows-alt"></i> {item.totalArea} {item.areaUnit}</p>
                                        </div>
                                    )}
                                    {activeTab === 'farms' && (
                                        <div className="details">
                                            <p><i className="fas fa-leaf"></i> {item.isOrganic ? 'Certified Organic' : 'Standard Farming'}</p>
                                            <p><i className="fas fa-info-circle"></i> {item.description?.substring(0, 80)}...</p>
                                        </div>
                                    )}
                                    {activeTab === 'kyc' && (
                                        <div className="details">
                                            <p><i className="fas fa-id-card"></i> Profile ID: {item.id.substring(0, 8)}</p>
                                            <p><i className="fas fa-user-tag"></i> Role: {item.role}</p>
                                        </div>
                                    )}
                                    {activeTab === 'farmers' && (
                                        <div className="details">
                                            <p><i className="fas fa-user-tie"></i> Exp: {item.experienceYears} Years</p>
                                            <p><i className="fas fa-briefcase"></i> {item.specialization}</p>
                                            <p><i className="fas fa-map-marker-alt"></i> {item.location}</p>
                                            <p className="bio-preview">"{item.bio?.substring(0, 100)}..."</p>
                                        </div>
                                    )}
                                    {activeTab !== 'farmers' && (
                                        <div className="document-preview">
                                            <a 
                                                href={getMediaUrl(activeTab === 'kyc' ? item.profile?.kycDocumentUrl : (item.ownershipDocumentUrl || item.photos?.[0]?.photoUrl))} 
                                                target="_blank" 
                                                rel="noreferrer"
                                            >
                                                <i className="fas fa-file-pdf"></i> View Documents
                                            </a>
                                        </div>
                                    )}
                                </div>
                                <div className="card-footer">
                                    <button className="reject-btn" onClick={() => promptReject(item.id)}>Reject</button>
                                    <button className="approve-btn" onClick={() => handleAction(item.id, 'approve')}>Approve</button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="empty-state">
                        <i className="fas fa-check-double"></i>
                        <h3>All caught up!</h3>
                        <p>No pending {activeTab} in the verification queue.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ApprovalsCenter;

