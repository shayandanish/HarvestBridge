import React, { useState, useEffect } from 'react';
import { farmerService } from '../../services/farmerService';
import { useNavigate } from 'react-router-dom';

const FarmerEarningsPage = () => {
    const navigate = useNavigate();
    const [earningsData, setEarningsData] = useState({ payments: [], totalEarned: 0 });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchEarnings = async () => {
            try {
                setLoading(true);
                const data = await farmerService.getEarnings();
                setEarningsData(data.data || data);
                setError(null);
            } catch (err) {
                console.error('Error fetching earnings:', err);
                setError('Failed to load earnings data.');
            } finally {
                setLoading(false);
            }
        };

        fetchEarnings();
    }, []);

    if (loading) return <div className="text-center py-10">Loading earnings...</div>;

    return (
        <div className="container mx-auto px-4 py-12 max-w-7xl">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
                <div className="flex-1">
                    <h1 className="text-4xl lg:text-5xl font-black text-gray-900 tracking-tight leading-tight">
                        My Earnings
                    </h1>
                    <p className="mt-3 text-lg lg:text-xl text-gray-500 font-medium">
                        Detailed breakdown of your completed farming tasks and payouts.
                    </p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => navigate(-1)}
                        className="bg-white text-gray-700 font-extrabold py-3 px-8 rounded-2xl border-2 border-gray-100 hover:border-gray-200 hover:bg-gray-50 transition-all shadow-sm flex items-center gap-2"
                    >
                        <span>←</span> Back
                    </button>
                </div>
            </div>

            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
                    {error}
                </div>
            )}

            <div className="grid md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white p-8 rounded-3xl shadow-xl border border-gray-100 transition-transform hover:-translate-y-1">
                    <p className="text-xs text-gray-400 font-black uppercase tracking-widest mb-2">Total Earned</p>
                    <p className="text-4xl font-black text-green-600">${earningsData.totalEarned?.toLocaleString()}</p>
                </div>
                <div className="bg-white p-8 rounded-3xl shadow-xl border border-gray-100 transition-transform hover:-translate-y-1">
                    <p className="text-xs text-gray-400 font-black uppercase tracking-widest mb-2">Completed Payments</p>
                    <p className="text-4xl font-black text-gray-900">{earningsData.payments?.length || 0}</p>
                </div>
                <div className="bg-white p-8 rounded-3xl shadow-xl border border-gray-100 transition-transform hover:-translate-y-1">
                    <p className="text-xs text-gray-400 font-black uppercase tracking-widest mb-2">Status</p>
                    <p className="text-4xl font-black text-blue-600">Active</p>
                </div>
            </div>

            <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Farm</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Investor</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {earningsData.payments.length === 0 ? (
                            <tr>
                                <td colSpan="5" className="px-6 py-10 text-center text-gray-500">
                                    No earnings records found.
                                </td>
                            </tr>
                        ) : (
                            earningsData.payments.map((payment) => (
                                <tr key={payment.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {new Date(payment.paidAt || payment.createdAt).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {payment.farm?.farmName || 'N/A'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {payment.farm?.investor?.fullName || 'Investor'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                                        ${parseFloat(payment.amount).toLocaleString()}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                                            Completed
                                        </span>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default FarmerEarningsPage;
