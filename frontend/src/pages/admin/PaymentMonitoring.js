import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
import './Monitoring.css';

const PaymentMonitoring = () => {
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({ status: '', type: '' });

    useEffect(() => {
        fetchPayments();
    }, [filters]);

    const fetchPayments = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(
                `${process.env.REACT_APP_API_URL || 'http://localhost:5000/api/v1'}/admin/payments`,
                { params: filters, headers: { Authorization: `Bearer ${token}` } }
            );
            setPayments(response.data.data.payments);
        } catch (err) {
            console.error('Failed to fetch payments');
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (id, action) => {
        try {
            const token = localStorage.getItem('token');
            await axios.post(
                `${process.env.REACT_APP_API_URL || 'http://localhost:5000/api/v1'}/admin/payments/${id}/${action}`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );
            alert(`Payment ${action} success`);
            fetchPayments();
        } catch (err) {
            alert(`Action ${action} failed`);
        }
    };

    return (
        <div className="monitoring-view">
            <div className="section-header">
                <h2>Financial Transactions</h2>
                <div className="filters">
                    <select onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
                        <option value="">All Statuses</option>
                        <option value="completed">Completed</option>
                        <option value="pending">Pending</option>
                        <option value="failed">Failed</option>
                        <option value="refunded">Refunded</option>
                    </select>
                    <select onChange={(e) => setFilters({ ...filters, type: e.target.value })}>
                        <option value="">All Types</option>
                        <option value="investment">Investment</option>
                        <option value="land_lease">Land Lease</option>
                        <option value="farmer_charges">Farmer Charges</option>
                        <option value="platform_commission">Commission</option>
                        <option value="payout">Payout</option>
                    </select>
                </div>
            </div>

            <div className="table-container">
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>Inv. ID</th>
                            <th>Investor</th>
                            <th>Amount</th>
                            <th>Type</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? <tr><td colSpan="6">Loading...</td></tr> :
                            payments.map(pay => (
                                <tr key={pay.id}>
                                    <td title={pay.id}>
                                        {(pay.investmentId || pay.farmId || pay.id).substring(0, 8)}
                                    </td>
                                    <td>
                                        {pay.investment?.investor?.fullName ||
                                            pay.farm?.investor?.fullName ||
                                            pay.recipientUser?.fullName ||
                                            'N/A'}
                                    </td>
                                    <td className="amount">Rs. {Number(pay.amount).toLocaleString()}</td>
                                    <td>{pay.type ? pay.type.replace(/_/g, ' ') : (pay.farmId ? 'Land Lease' : 'Investment')}</td>
                                    <td><span className={`status-pill ${pay.status}`}>{pay.status}</span></td>
                                    <td>
                                        {pay.status === 'failed' && (
                                            <button className="icon-btn retry" onClick={() => handleAction(pay.id, 'retry')} title="Retry Payment">
                                                <i className="fas fa-redo"></i>
                                            </button>
                                        )}
                                        {pay.status === 'completed' && (
                                            <button className="icon-btn refund" onClick={() => handleAction(pay.id, 'refund')} title="Refund">
                                                <i className="fas fa-undo"></i>
                                            </button>
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

export default PaymentMonitoring;
