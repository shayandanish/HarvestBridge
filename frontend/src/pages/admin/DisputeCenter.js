import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
import './DisputeCenter.css';

const DisputeCenter = () => {
    const [disputes, setDisputes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedDispute, setSelectedDispute] = useState(null);
    const [resolutionText, setResolutionText] = useState('');

    useEffect(() => {
        fetchDisputes();
    }, []);

    const fetchDisputes = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(
                `${process.env.REACT_APP_API_URL || 'http://localhost:5000/api/v1'}/admin/disputes`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setDisputes(response.data.data.disputes);
        } catch (err) {
            setError('Failed to fetch disputes');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStatus = async (id, status) => {
        try {
            const token = localStorage.getItem('token');
            await axios.put(
                `${process.env.REACT_APP_API_URL || 'http://localhost:5000/api/v1'}/admin/disputes/${id}/status`,
                { status },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            fetchDisputes();
            if (selectedDispute && selectedDispute.id === id) {
                setSelectedDispute({ ...selectedDispute, status });
            }
        } catch (err) {
            alert('Update failed');
        }
    };

    const handleResolve = async (id) => {
        if (!resolutionText) return alert('Please provide resolution notes');
        try {
            const token = localStorage.getItem('token');
            await axios.post(
                `${process.env.REACT_APP_API_URL || 'http://localhost:5000/api/v1'}/admin/disputes/${id}/resolve`,
                { resolution: resolutionText },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            alert('Dispute resolved');
            setResolutionText('');
            setSelectedDispute(null);
            fetchDisputes();
        } catch (err) {
            alert('Resolution failed');
        }
    };

    return (
        <div className="dispute-center">
            <div className="section-header">
                <h2>Dispute Resolution Center</h2>
                <div className="stats-badges">
                    <span className="badge open">{disputes.filter(d => d.status === 'open').length} Open</span>
                    <span className="badge review">{disputes.filter(d => d.status === 'under_review').length} Under Review</span>
                </div>
            </div>

            <div className="dispute-layout">
                <div className="dispute-list-panel">
                    <div className="table-container">
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Type</th>
                                    <th>Raised By</th>
                                    <th>Status</th>
                                    <th>Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan="5">Loading...</td></tr>
                                ) : disputes.map(dispute => (
                                    <tr
                                        key={dispute.id}
                                        onClick={() => setSelectedDispute(dispute)}
                                        className={selectedDispute?.id === dispute.id ? 'selected' : ''}
                                    >
                                        <td>#{dispute.id.substring(0, 6)}</td>
                                        <td><span className={`dispute-type ${dispute.disputeType}`}>{dispute.disputeType}</span></td>
                                        <td>{dispute.raisedBy.fullName}</td>
                                        <td><span className={`status-pill ${dispute.status}`}>{dispute.status.replace('_', ' ')}</span></td>
                                        <td>{format(new Date(dispute.createdAt), 'MMM dd')}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="dispute-detail-panel">
                    {selectedDispute ? (
                        <div className="detail-view">
                            <div className="detail-header">
                                <h3>Dispute Details</h3>
                                <div className="status-selector">
                                    <select
                                        value={selectedDispute.status}
                                        onChange={(e) => handleUpdateStatus(selectedDispute.id, e.target.value)}
                                        disabled={selectedDispute.status === 'resolved'}
                                    >
                                        <option value="open">Open</option>
                                        <option value="under_review">Under Review</option>
                                        <option value="resolved">Resolved</option>
                                        <option value="closed">Closed</option>
                                    </select>
                                </div>
                            </div>

                            <div className="detail-section">
                                <label>Subject Investment</label>
                                <p><strong>{selectedDispute.investment.plant.farm.farmName}</strong></p>
                                <p>Plant ID: {selectedDispute.investment.plant.uniqueIdentifier}</p>
                            </div>

                            <div className="detail-section">
                                <label>Issue Description</label>
                                <div className="description-box">{selectedDispute.description}</div>
                            </div>

                            <div className="detail-section">
                                <label>Evidence / Attachments</label>
                                {selectedDispute.attachments?.length > 0 ? (
                                    <div className="attachments">
                                        {selectedDispute.attachments.map((url, i) => (
                                            <a key={i} href={url} target="_blank" rel="noreferrer"><i className="fas fa-paperclip"></i> File {i + 1}</a>
                                        ))}
                                    </div>
                                ) : <p className="no-data">No attachments provided</p>}
                            </div>

                            {selectedDispute.status !== 'resolved' ? (
                                <div className="resolution-action">
                                    <label>Formal Resolution</label>
                                    <textarea
                                        placeholder="Enter final resolution notes..."
                                        value={resolutionText}
                                        onChange={(e) => setResolutionText(e.target.value)}
                                    ></textarea>
                                    <button className="resolve-btn" onClick={() => handleResolve(selectedDispute.id)}>
                                        Finalize Resolution
                                    </button>
                                </div>
                            ) : (
                                <div className="resolution-info">
                                    <h4>Final Resolution</h4>
                                    <p>{selectedDispute.resolution}</p>
                                    <span>Resolved on: {format(new Date(selectedDispute.resolvedAt), 'MMM dd, yyyy HH:mm')}</span>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="select-prompt">
                            <i className="fas fa-hand-pointer"></i>
                            <p>Select a dispute from the list to view details and take action</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DisputeCenter;
