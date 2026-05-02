import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { adminService } from '../../services/adminService';
import './Monitoring.css';

const InvestmentMonitoring = () => {
    const [investments, setInvestments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({ status: '', search: '' });
    const [editingInv, setEditingInv] = useState(null);
    const [editForm, setEditForm] = useState({ status: '', totalAmount: '' });

    useEffect(() => {
        fetchInvestments();
    }, [filters]);

    const fetchInvestments = async () => {
        try {
            const response = await adminService.getAllInvestments(filters);
            setInvestments(response.data.investments);
        } catch (err) {
            console.error('Failed to fetch investments');
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = async (id) => {
        if (!window.confirm('Are you sure you want to cancel this investment? This action is disruptive.')) return;
        try {
            await adminService.cancelInvestment(id, 'Admin Initiated Cancellation');
            fetchInvestments();
        } catch (err) {
            alert('Cancellation failed');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to completely delete this investment? This cannot be undone.')) return;
        try {
            await adminService.deleteInvestment(id);
            fetchInvestments();
        } catch (err) {
            alert('Deletion failed');
        }
    };

    const startEdit = (inv) => {
        setEditingInv(inv.id);
        setEditForm({
            status: inv.status,
            totalAmount: inv.totalAmount
        });
    };

    const handleSaveEdit = async () => {
        try {
            // Allow numbers since it's a decimal amount
            const parsedAmount = parseFloat(editForm.totalAmount);
            if (isNaN(parsedAmount)) {
                return alert('Invalid amount format');
            }

            await adminService.updateInvestment(editingInv, { status: editForm.status, totalAmount: parsedAmount });
            setEditingInv(null);
            fetchInvestments();
        } catch (err) {
            alert('Update failed');
        }
    };

    return (
        <div className="monitoring-view">
            <div className="section-header">
                <h2>Investment Monitoring</h2>
                <div className="filters">
                    <input
                        type="text"
                        placeholder="Search investor/farm..."
                        onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                    />
                    <select onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
                        <option value="">All Statuses</option>
                        <option value="active">Active</option>
                        <option value="pending">Pending</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                    </select>
                </div>
            </div>

            <div className="table-container">
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>Investor</th>
                            <th>Farm/Plant</th>
                            <th>Amount</th>
                            <th>Status</th>
                            <th>Date</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? <tr><td colSpan="6">Loading...</td></tr> :
                            investments.map(inv => (
                                <tr key={inv.id}>
                                    <td>{inv.investor.fullName}</td>
                                    <td>{inv.plant?.farm?.farmName || inv.farmName || 'N/A'}</td>
                                    <td>
                                        {editingInv === inv.id ? (
                                            <input
                                                type="number"
                                                value={editForm.totalAmount}
                                                onChange={e => setEditForm({ ...editForm, totalAmount: e.target.value })}
                                                style={{ width: '80px', padding: '4px' }}
                                            />
                                        ) : (
                                            `$${inv.totalAmount.toLocaleString()}`
                                        )}
                                    </td>
                                    <td>
                                        {editingInv === inv.id ? (
                                            <select
                                                value={editForm.status}
                                                onChange={e => setEditForm({ ...editForm, status: e.target.value })}
                                                style={{ padding: '4px' }}
                                            >
                                                <option value="pending">pending</option>
                                                <option value="active">active</option>
                                                <option value="completed">completed</option>
                                                <option value="cancelled">cancelled</option>
                                            </select>
                                        ) : (
                                            <span className={`status-pill ${inv.status}`}>{inv.status}</span>
                                        )}
                                    </td>
                                    <td>{format(new Date(inv.createdAt), 'MMM dd, yyyy')}</td>
                                    <td>
                                        {editingInv === inv.id ? (
                                            <>
                                                <button className="icon-btn text-green-600" onClick={handleSaveEdit} title="Save">
                                                    <i className="fas fa-check"></i>
                                                </button>
                                                <button className="icon-btn text-gray-500" onClick={() => setEditingInv(null)} title="Cancel Edit">
                                                    <i className="fas fa-times"></i>
                                                </button>
                                            </>
                                        ) : (
                                            <>
                                                <button className="icon-btn text-blue-600" onClick={() => startEdit(inv)} title="Edit Investment">
                                                    <i className="fas fa-edit"></i>
                                                </button>
                                                <button className="icon-btn text-red-600" onClick={() => handleDelete(inv.id)} title="Delete Investment">
                                                    <i className="fas fa-trash"></i>
                                                </button>
                                                {inv.status !== 'cancelled' && (
                                                    <button className="icon-btn cancel" onClick={() => handleCancel(inv.id)} title="Cancel Investment">
                                                        <i className="fas fa-times-circle"></i>
                                                    </button>
                                                )}
                                            </>
                                        )}
                                    </td>
                                </tr>
                            ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default InvestmentMonitoring;
