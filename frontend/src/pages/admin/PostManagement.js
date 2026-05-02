import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/adminService';
import './UserManagement.css'; // Reusing similar table styles

const PostManagement = () => {
    const [activeTab, setActiveTab] = useState('lands');
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0 });

    useEffect(() => {
        fetchData();
    }, [activeTab, pagination.page, search]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const params = { page: pagination.page, limit: pagination.limit, search };
            let res;
            if (activeTab === 'lands') {
                res = await adminService.getAllLands(params);
                setData(res.data.lands);
                setPagination(prev => ({ ...prev, total: res.data.pagination.total }));
            } else {
                res = await adminService.getAllFarms(params);
                setData(res.data.farms);
                setPagination(prev => ({ ...prev, total: res.data.pagination.total }));
            }
        } catch (err) {
            console.error('Fetch error:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm(`Are you sure you want to delete this ${activeTab === 'lands' ? 'land' : 'farm'}?`)) return;
        try {
            if (activeTab === 'lands') {
                await adminService.deleteLand(id);
            } else {
                await adminService.deleteFarm(id);
            }
            fetchData();
        } catch (err) {
            const errorMsg = err.response?.data?.message || 'Delete failed';
            alert(errorMsg);
        }
    };

    return (
        <div className="user-management">
            <div className="section-header">
                <h2>Post Management System</h2>
                <div className="tabs" style={{ display: 'flex', gap: '10px' }}>
                    <button
                        onClick={() => { setActiveTab('lands'); setPagination(p => ({ ...p, page: 1 })); }}
                        style={{ padding: '8px 16px', background: activeTab === 'lands' ? '#10b981' : '#f1f5f9', color: activeTab === 'lands' ? 'white' : '#64748b', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
                    >
                        Lands
                    </button>
                    <button
                        onClick={() => { setActiveTab('farms'); setPagination(p => ({ ...p, page: 1 })); }}
                        style={{ padding: '8px 16px', background: activeTab === 'farms' ? '#10b981' : '#f1f5f9', color: activeTab === 'farms' ? 'white' : '#64748b', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
                    >
                        Farms
                    </button>
                </div>
            </div>

            <div className="filters-bar">
                <div className="search-box">
                    <i>🔍</i>
                    <input
                        type="text"
                        placeholder={`Search ${activeTab}...`}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            <div className="table-container">
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>{activeTab === 'lands' ? 'Land Name' : 'Farm Name'}</th>
                            <th>Owner</th>
                            <th>Location/Parent</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="5" className="loading-row">Loading...</td></tr>
                        ) : data.length === 0 ? (
                            <tr><td colSpan="5" className="no-users">No {activeTab} found.</td></tr>
                        ) : data.map(item => (
                            <tr key={item.id}>
                                <td>
                                    <div className="user-info">
                                        <span className="name">{activeTab === 'lands' ? item.landName : item.farmName}</span>
                                        <span className="email">{item.id.slice(0, 8)}...</span>
                                    </div>
                                </td>
                                <td>
                                    <div className="user-info">
                                        <span className="name">{activeTab === 'lands' ? item.landowner?.user?.fullName : item.farmer?.user?.fullName}</span>
                                        <span className="email">{activeTab === 'lands' ? item.landowner?.user?.email : item.farmer?.user?.email}</span>
                                    </div>
                                </td>
                                <td>
                                    {activeTab === 'lands' ?
                                        `${item.city}, ${item.state}` :
                                        `Land: ${item.land?.landName || 'Unknown'}`
                                    }
                                </td>
                                <td>
                                    <span className={`status-badge ${item.isVerified || item.isApproved ? 'active' : 'suspended'}`}>
                                        {activeTab === 'lands' ? (item.isVerified ? 'Verified' : 'Pending') : (item.isApproved ? 'Approved' : 'Pending')}
                                    </span>
                                </td>
                                <td className="action-buttons">
                                    <button className="icon-btn delete" onClick={() => handleDelete(item.id)} title="Delete Listing">
                                        🗑️
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="pagination">
                <span>Showing {data.length} items of {pagination.total}</span>
                <div className="page-btns">
                    <button
                        disabled={pagination.page === 1}
                        onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}
                    >
                        Previous
                    </button>
                    <button
                        disabled={pagination.page * pagination.limit >= pagination.total}
                        onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}
                    >
                        Next
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PostManagement;
