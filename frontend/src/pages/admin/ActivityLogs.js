import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
import './ActivityLogs.css';

const ActivityLogs = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [filters, setFilters] = useState({ action: '', entityType: '', startDate: '', endDate: '' });
    const [page, setPage] = useState(1);

    useEffect(() => {
        fetchLogs();
    }, [filters, page]);

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(
                `${process.env.REACT_APP_API_URL || 'http://localhost:5000/api/v1'}/admin/activity-logs`,
                {
                    params: { ...filters, page, limit: 50 },
                    headers: { Authorization: `Bearer ${token}` }
                }
            );
            setLogs(response.data.data.logs);
        } catch (err) {
            setError('Failed to fetch activity logs');
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (e) => {
        setFilters({ ...filters, [e.target.name]: e.target.value });
        setPage(1);
    };

    return (
        <div className="activity-logs">
            <div className="section-header">
                <h2>System Activity Logs</h2>
                <p>Immutable audit trail of administrative and platform actions</p>
            </div>

            <div className="filters-bar">
                <select name="action" onChange={handleFilterChange}>
                    <option value="">All Actions</option>
                    <option value="user_suspended">User Suspension</option>
                    <option value="land_approved">Land Approval</option>
                    <option value="dispute_resolved">Dispute Resolution</option>
                    <option value="campaign_sent">Campaigns</option>
                </select>
                <div className="date-filters">
                    <input type="date" name="startDate" onChange={handleFilterChange} />
                    <span>to</span>
                    <input type="date" name="endDate" onChange={handleFilterChange} />
                </div>
            </div>

            <div className="logs-container">
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>Timestamp</th>
                            <th>User</th>
                            <th>Action</th>
                            <th>Entity</th>
                            <th>IP Address</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? <tr><td colSpan="5">Loading logs...</td></tr> :
                            logs.map(log => (
                                <tr key={log.id}>
                                    <td>{format(new Date(log.createdAt), 'MMM dd, HH:mm:ss')}</td>
                                    <td>{log.user.fullName}</td>
                                    <td><span className="action-tag">{log.action.replace(/_/g, ' ')}</span></td>
                                    <td>{log.entityType} ({log.entityId?.substring(0, 8)})</td>
                                    <td>{log.ipAddress}</td>
                                </tr>
                            ))}
                    </tbody>
                </table>
            </div>

            <div className="pagination">
                <button disabled={page === 1} onClick={() => setPage(page - 1)}>Prev</button>
                <span>Page {page}</span>
                <button disabled={logs.length < 50} onClick={() => setPage(page + 1)}>Next</button>
            </div>
        </div>
    );
};

export default ActivityLogs;
