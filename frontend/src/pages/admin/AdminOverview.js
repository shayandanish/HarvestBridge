import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
    LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, BarChart, Bar, Cell, PieChart, Pie
} from 'recharts';
import { format } from 'date-fns';
import './AdminOverview.css';

const AdminOverview = () => {
    const navigate = useNavigate();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
            const response = await axios.get(
                `${process.env.REACT_APP_API_URL || 'http://localhost:5000/api/v1'}/admin/dashboard/stats`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setStats(response.data.data);
        } catch (err) {
            setError('Failed to fetch dashboard statistics.');
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="admin-loading">Loading Dashboard Data...</div>;
    if (error) return <div className="admin-error">{error}</div>;

    // Prepare chart data
    const userRoleData = stats.users.byRole.map(item => ({
        name: item.role.charAt(0).toUpperCase() + item.role.slice(1),
        value: item._count
    }));

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

    return (
        <div className="admin-overview">
            <div className="overview-header">
                <h1>Platform Overview</h1>
                <p>Real-time metrics and system health</p>
            </div>

            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-icon users-icon"><i className="fas fa-users"></i></div>
                    <div className="stat-info">
                        <h3>Total Users</h3>
                        <p className="stat-value">{stats.users.total}</p>
                        <p className="stat-trend positive">
                            <i className="fas fa-arrow-up"></i> {stats.users.newThisMonth} new this month
                        </p>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon money-icon"><i className="fas fa-hand-holding-usd"></i></div>
                    <div className="stat-info">
                        <h3>Investments</h3>
                        <p className="stat-value">${stats.investments.totalValue.toLocaleString()}</p>
                        <p className="stat-desc">
                            {stats.investments.totalCount} contracts | Vol: ${(stats.revenue.totalVolume || 0).toLocaleString()}
                        </p>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon revenue-icon"><i className="fas fa-chart-line"></i></div>
                    <div className="stat-info">
                        <h3>Net Revenue</h3>
                        <p className="stat-value">${stats.revenue.total.toLocaleString()}</p>
                        <p className="stat-trend positive">
                            <i className="fas fa-calendar"></i> ${stats.revenue.thisMonth.toLocaleString()} this month
                        </p>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon alert-icon"><i className="fas fa-tasks"></i></div>
                    <div className="stat-info">
                        <h3>Pending Actions</h3>
                        <p className="stat-value">{stats.approvals.pendingLands + stats.approvals.pendingFarms + stats.approvals.pendingFarmerProfiles}</p>
                        <p className="stat-desc">Approvals & Profiles needed</p>
                    </div>
                </div>
            </div>

            <div className="charts-container">
                <div className="chart-card">
                    <h3>User Distribution by Role</h3>
                    <div className="chart-wrapper">
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={userRoleData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {userRoleData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="chart-legend">
                            {userRoleData.map((item, idx) => (
                                <div key={idx} className="legend-item">
                                    <span className="dot" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></span>
                                    <span>{item.name}: {item.value}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="chart-card">
                    <h3>Recent Platform Activity</h3>
                    <div className="activity-list">
                        {stats.recentActivities.length > 0 ? (
                            stats.recentActivities.map((log, idx) => (
                                <div key={idx} className="activity-item">
                                    <div className="activity-icon">
                                        <i className={log.action.includes('suspend') ? 'fas fa-ban red' : 'fas fa-check-circle green'}></i>
                                    </div>
                                    <div className="activity-details">
                                        <p><strong>{log.user.fullName}</strong> {log.action.replace(/_/g, ' ')}</p>
                                        <span>{format(new Date(log.createdAt), 'MMM dd, HH:mm')}</span>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="no-data">No recent activity logged</p>
                        )}
                    </div>
                </div>
            </div>

            <div className="approvals-overview">
                <h3>Quick Approvals</h3>
                <div className="approvals-grid">
                    <div className="approval-widget">
                        <span className="count">{stats.approvals.pendingLands}</span>
                        <span className="label">Land Verifications</span>
                        <button className="view-btn" onClick={() => navigate('/admin/approvals')}>Review All</button>
                    </div>
                    <div className="approval-widget">
                        <span className="count">{stats.approvals.pendingFarms}</span>
                        <span className="label">Farm Listings</span>
                        <button className="view-btn" onClick={() => navigate('/admin/approvals')}>Review All</button>
                    </div>
                    <div className="approval-widget">
                        <span className="count">{stats.approvals.pendingFarmerProfiles}</span>
                        <span className="label">Farmer Profiles</span>
                        <button className="view-btn" onClick={() => navigate('/admin/approvals')}>Review All</button>
                    </div>
                </div>
            </div>

            <div className="approvals-overview mt-8">
                <h3>Plantation Management</h3>
                <div className="approvals-grid" style={{ gridTemplateColumns: 'repeat(1, 1fr)' }}>
                    <div className="approval-widget">
                        <span className="count">🌳</span>
                        <span className="label">Tree Catalogue</span>
                        <button className="view-btn" onClick={() => navigate('/admin/trees')}>Manage Trees</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminOverview;
