import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { adminService } from '../../services/adminService';
import './UserManagement.css';

const UserManagement = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [filters, setFilters] = useState({
        role: '',
        isVerified: '',
        isActive: '',
        search: ''
    });
    const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0 });
    const [selectedUser, setSelectedUser] = useState(null);
    const [editingUser, setEditingUser] = useState(null);
    const [showViewModal, setShowViewModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editForm, setEditForm] = useState({ fullName: '', email: '', phone: '', role: '' });

    useEffect(() => {
        fetchUsers();
    }, [filters, pagination.page]);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const params = {
                ...filters,
                page: pagination.page,
                limit: pagination.limit
            };
            const response = await adminService.getAllUsers(params);
            setUsers(response.data.users);
            setPagination(prev => ({ ...prev, total: response.data.pagination.total }));
        } catch (err) {
            setError('Failed to fetch users');
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (e) => {
        setFilters({ ...filters, [e.target.name]: e.target.value });
        setPagination({ ...pagination, page: 1 });
    };

    const handleView = async (userId) => {
        try {
            const response = await adminService.getUserById(userId);
            setSelectedUser(response.data);
            setShowViewModal(true);
        } catch (err) {
            alert('Failed to fetch user details');
        }
    };

    const handleEdit = (user) => {
        setEditingUser(user.id);
        setEditForm({
            fullName: user.fullName,
            email: user.email,
            phone: user.phone || '',
            role: user.role
        });
        setShowEditModal(true);
    };

    const handleSaveEdit = async () => {
        try {
            await adminService.updateUser(editingUser, editForm);
            setShowEditModal(false);
            fetchUsers();
        } catch (err) {
            alert('Update failed: ' + (err.response?.data?.message || err.message));
        }
    };

    const handleAction = async (userId, action) => {
        if (!window.confirm(`Are you sure you want to ${action} this user?`)) return;

        try {
            if (action === 'delete') {
                await adminService.deleteUser(userId);
            } else if (action === 'suspend') {
                const reason = prompt('Reason for suspension:');
                if (!reason) return;
                await adminService.suspendUser(userId, reason);
            } else if (action === 'activate') {
                await adminService.activateUser(userId);
            }

            fetchUsers();
        } catch (err) {
            alert('Action failed: ' + (err.response?.data?.message || err.message));
        }
    };

    return (
        <div className="user-management">
            <div className="section-header">
                <h2>User Management</h2>
                <div className="actions">
                    <button className="export-btn"><i className="fas fa-download"></i> Export CSV</button>
                </div>
            </div>

            <div className="filters-bar">
                <div className="search-box">
                    <i className="fas fa-search"></i>
                    <input
                        type="text"
                        name="search"
                        placeholder="Search name, email, phone..."
                        value={filters.search}
                        onChange={handleFilterChange}
                    />
                </div>
                <select name="role" value={filters.role} onChange={handleFilterChange}>
                    <option value="">All Roles</option>
                    <option value="investor">Investor</option>
                    <option value="farmer">Farmer</option>
                    <option value="landowner">Landowner</option>
                    <option value="admin">Admin</option>
                </select>
                <select name="isActive" value={filters.isActive} onChange={handleFilterChange}>
                    <option value="">All Status</option>
                    <option value="true">Active</option>
                    <option value="false">Suspended</option>
                </select>
                <select name="isVerified" value={filters.isVerified} onChange={handleFilterChange}>
                    <option value="">Verification</option>
                    <option value="true">Verified</option>
                    <option value="false">Unverified</option>
                </select>
            </div>

            {error && <div className="error-msg">{error}</div>}

            <div className="table-container">
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>User</th>
                            <th>Role</th>
                            <th>Verification</th>
                            <th>Status</th>
                            <th>Joined</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="6" className="loading-row">Loading users...</td></tr>
                        ) : users.length > 0 ? (
                            users.map(user => (
                                <tr key={user.id}>
                                    <td>
                                        <div className="user-cell">
                                            <img src={user.profilePhotoUrl || "/default-avatar.png"} alt="" />
                                            <div className="user-info">
                                                <span className="name">{user.fullName}</span>
                                                <span className="email">{user.email}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td><span className={`role-badge ${user.role}`}>{user.role}</span></td>
                                    <td>
                                        {user.isVerified ? (
                                            <span className="status-badge verified"><i className="fas fa-check"></i> Verified</span>
                                        ) : (
                                            <span className="status-badge unverified">Pending</span>
                                        )}
                                    </td>
                                    <td>
                                        {user.isActive ? (
                                            <span className="status-badge active">Active</span>
                                        ) : (
                                            <span className="status-badge suspended">Suspended</span>
                                        )}
                                    </td>
                                    <td>{format(new Date(user.createdAt), 'MMM dd, yyyy')}</td>
                                    <td>
                                        <div className="action-buttons">
                                            <button className="icon-btn view" onClick={() => handleView(user.id)} title="View Profile"><i className="fas fa-eye"></i></button>
                                            <button className="icon-btn edit" onClick={() => handleEdit(user)} title="Edit User"><i className="fas fa-edit"></i></button>
                                            {user.isActive ? (
                                                <button className="icon-btn suspend" onClick={() => handleAction(user.id, 'suspend')} title="Suspend"><i className="fas fa-ban"></i></button>
                                            ) : (
                                                <button className="icon-btn activate" onClick={() => handleAction(user.id, 'activate')} title="Activate"><i className="fas fa-check"></i></button>
                                            )}
                                            <button className="icon-btn delete" onClick={() => handleAction(user.id, 'delete')} title="Delete"><i className="fas fa-trash"></i></button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr><td colSpan="6" className="no-users">No users found matching filters</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            <div className="pagination">
                <span>Showing {users.length} of {pagination.total} users</span>
                <div className="page-btns">
                    <button
                        disabled={pagination.page === 1}
                        onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                    >Previous</button>
                    <button
                        disabled={users.length < pagination.limit}
                        onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                    >Next</button>
                </div>
            </div>

            {/* View Modal */}
            {showViewModal && selectedUser && (
                <div className="admin-modal-overlay">
                    <div className="admin-modal view-user-modal">
                        <div className="modal-header">
                            <h3>User Details</h3>
                            <button className="close-btn" onClick={() => setShowViewModal(false)}>&times;</button>
                        </div>
                        <div className="modal-body">
                            <div className="user-profile-summary">
                                <img src={selectedUser.profilePhotoUrl || "/default-avatar.png"} alt="" className="large-avatar" />
                                <div className="summary-info">
                                    <h4>{selectedUser.fullName}</h4>
                                    <span className={`role-badge ${selectedUser.role}`}>{selectedUser.role}</span>
                                </div>
                            </div>
                            <div className="detail-grid">
                                <div className="detail-item">
                                    <label>Email</label>
                                    <p>{selectedUser.email}</p>
                                </div>
                                <div className="detail-item">
                                    <label>Phone</label>
                                    <p>{selectedUser.phone || 'N/A'}</p>
                                </div>
                                <div className="detail-item">
                                    <label>Joined</label>
                                    <p>{format(new Date(selectedUser.createdAt), 'MMMM dd, yyyy')}</p>
                                </div>
                                <div className="detail-item">
                                    <label>Verification</label>
                                    <p>{selectedUser.isVerified ? 'Verified' : 'Pending'}</p>
                                </div>
                            </div>
                            {selectedUser.profile && (
                                <div className="extra-info">
                                    <label>Bio/Details</label>
                                    <p>{selectedUser.profile.bio || 'No bio provided'}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Modal */}
            {showEditModal && (
                <div className="admin-modal-overlay">
                    <div className="admin-modal edit-user-modal">
                        <div className="modal-header">
                            <h3>Edit User</h3>
                            <button className="close-btn" onClick={() => setShowEditModal(false)}>&times;</button>
                        </div>
                        <div className="modal-body">
                            <div className="form-group">
                                <label>Full Name</label>
                                <input
                                    type="text"
                                    value={editForm.fullName}
                                    onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                                />
                            </div>
                            <div className="form-group">
                                <label>Email</label>
                                <input
                                    type="email"
                                    value={editForm.email}
                                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                                />
                            </div>
                            <div className="form-group">
                                <label>Phone</label>
                                <input
                                    type="text"
                                    value={editForm.phone}
                                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                                />
                            </div>
                            <div className="form-group">
                                <label>Role</label>
                                <select
                                    value={editForm.role}
                                    onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                                >
                                    <option value="investor">Investor</option>
                                    <option value="farmer">Farmer</option>
                                    <option value="landowner">Landowner</option>
                                    <option value="admin">Admin</option>
                                </select>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="cancel-btn" onClick={() => setShowEditModal(false)}>Cancel</button>
                            <button className="save-btn" onClick={handleSaveEdit}>Save Changes</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserManagement;
