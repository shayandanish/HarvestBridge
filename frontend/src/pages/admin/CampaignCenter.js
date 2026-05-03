import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
import './CampaignCenter.css';

const CampaignCenter = () => {
    const [campaigns, setCampaigns] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [newCampaign, setNewCampaign] = useState({ name: '', subject: '', body: '', roleFilter: 'all' });

    useEffect(() => {
        fetchCampaigns();
    }, []);

    const fetchCampaigns = async () => {
        try {
            const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
            const response = await axios.get(
                `${process.env.REACT_APP_API_URL || 'http://localhost:5000/api/v1'}/admin/campaigns`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setCampaigns(response.data.data);
        } catch (err) {
            console.error('Failed to fetch campaigns');
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
            const payload = {
                ...newCampaign,
                recipientFilter: newCampaign.roleFilter === 'all' ? {} : { role: newCampaign.roleFilter }
            };
            await axios.post(
                `${process.env.REACT_APP_API_URL || 'http://localhost:5000/api/v1'}/admin/campaigns`,
                payload,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setShowModal(false);
            fetchCampaigns();
        } catch (err) {
            alert('Creation failed');
        }
    };

    const handleSend = async (id) => {
        if (!window.confirm('Send this campaign to all matching users now?')) return;
        try {
            const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
            await axios.post(
                `${process.env.REACT_APP_API_URL || 'http://localhost:5000/api/v1'}/admin/campaigns/${id}/send`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );
            alert('Campaign propagation started');
            fetchCampaigns();
        } catch (err) {
            alert('Send failed');
        }
    };

    return (
        <div className="campaign-center">
            <div className="section-header">
                <h2>Email Campaigns</h2>
                <button className="create-btn" onClick={() => setShowModal(true)}>
                    <i className="fas fa-plus"></i> New Campaign
                </button>
            </div>

            <div className="campaigns-grid">
                {campaigns.map(camp => (
                    <div key={camp.id} className="campaign-card">
                        <div className="card-top">
                            <span className={`status-pill ${camp.status}`}>{camp.status}</span>
                            <h3>{camp.name}</h3>
                            <p className="subject">Subj: {camp.subject}</p>
                        </div>
                        <div className="card-stats">
                            <div className="stat">
                                <span>{camp.sentCount || 0}</span>
                                <label>Sent</label>
                            </div>
                            <div className="stat">
                                <span>{camp.recipientFilter.role || 'All'}</span>
                                <label>Target</label>
                            </div>
                        </div>
                        <div className="card-actions">
                            {camp.status === 'draft' && (
                                <button className="send-btn" onClick={() => handleSend(camp.id)}>
                                    <i className="fas fa-paper-plane"></i> Send Now
                                </button>
                            )}
                            <button className="preview-btn">View Body</button>
                        </div>
                    </div>
                ))}
            </div>

            {showModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h3>Build New Campaign</h3>
                        <form onSubmit={handleCreate}>
                            <input
                                type="text"
                                placeholder="Campaign Name (Internal)"
                                required
                                onChange={e => setNewCampaign({ ...newCampaign, name: e.target.value })}
                            />
                            <input
                                type="text"
                                placeholder="Email Subject line"
                                required
                                onChange={e => setNewCampaign({ ...newCampaign, subject: e.target.value })}
                            />
                            <select onChange={e => setNewCampaign({ ...newCampaign, roleFilter: e.target.value })}>
                                <option value="all">All Users</option>
                                <option value="investor">Investors Only</option>
                                <option value="farmer">Farmers Only</option>
                                <option value="landowner">Landowners Only</option>
                            </select>
                            <textarea
                                placeholder="Email Body (HTML supported)"
                                required
                                onChange={e => setNewCampaign({ ...newCampaign, body: e.target.value })}
                            ></textarea>
                            <div className="modal-footer">
                                <button type="button" onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="save-btn">Create Draft</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CampaignCenter;
