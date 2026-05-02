import React, { useState, useEffect } from 'react';
import { plantationService, getMediaUrl } from '../../services/api';

const PlantationRequests = () => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedReceipt, setSelectedReceipt] = useState(null);

    useEffect(() => {
        fetchRequests();
    }, []);

    const fetchRequests = async () => {
        try {
            setLoading(true);
            const response = await plantationService.getAllRequests();
            setRequests(response.data || []);
        } catch (error) {
            console.error('Failed to fetch plantation requests:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleStatusChange = async (id, newStatus) => {
        try {
            await plantationService.updateRequestStatus(id, newStatus);
            // Update local state without refetching for better UX
            setRequests(requests.map(req =>
                req.id === id ? { ...req, status: newStatus } : req
            ));
        } catch (error) {
            console.error('Failed to update status:', error);
            alert('Failed to update status. Please try again.');
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-green-500 border-t-transparent"></div>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h2 className="text-3xl font-black text-gray-900 tracking-tight">Plantation Requests</h2>
                    <p className="text-gray-500 mt-1">Manage tree planting requests from investors</p>
                </div>
            </div>

            {requests.length === 0 ? (
                <div className="bg-white rounded-[2rem] p-12 text-center border border-dashed border-gray-200">
                    <div className="text-6xl mb-4">🌳</div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">No Requests Yet</h3>
                    <p className="text-gray-500">When investors request to plant trees, they will appear here.</p>
                </div>
            ) : (
                <div className="grid gap-6">
                    {requests.map((request) => (
                        <div key={request.id} className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm flex flex-col md:flex-row gap-6">
                            {/* User Info */}
                            <div className="md:w-1/4 flex flex-col justify-center border-b md:border-b-0 md:border-r border-gray-100 pb-6 md:pb-0 md:pr-6">
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-100 shrink-0 border-2 border-green-100">
                                        {request.investor?.profilePhoto ? (
                                            <img
                                                src={getMediaUrl(request.investor.profilePhoto)}
                                                alt={request.investor.firstName}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-green-50 text-green-700 font-bold">
                                                {request.investor?.firstName?.charAt(0)}
                                                {request.investor?.lastName?.charAt(0)}
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-gray-900 leading-tight">
                                            {request.investor?.firstName} {request.investor?.lastName}
                                        </h4>
                                        <p className="text-xs text-gray-500">{request.investor?.email}</p>
                                    </div>
                                </div>

                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Date</span>
                                        <span className="font-medium text-gray-900">
                                            {new Date(request.createdAt).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Total</span>
                                        <span className="font-black text-green-600">
                                            Rs. {Number(request.totalPrice).toLocaleString()}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Request Items */}
                            <div className="md:w-1/2 flex flex-col justify-center">
                                <h5 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Trees Requested</h5>
                                <div className="space-y-2">
                                    {request.items.map(item => (
                                        <div key={item.id} className="flex justify-between items-center bg-gray-50 p-3 rounded-xl border border-gray-100 px-4">
                                            <div className="flex items-center gap-3">
                                                <span className="text-xl">🪴</span>
                                                <span className="font-bold text-gray-900">{item.tree.name}</span>
                                            </div>
                                            <span className="text-sm font-black text-gray-600">
                                                {item.quantity} × Rs. {Number(item.tree.price).toLocaleString()}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Status controls */}
                            <div className="md:w-1/4 flex flex-col justify-center md:items-end">
                                <h5 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3 md:text-right">Action / Status</h5>
                                
                                {request.farm?.payments?.length > 0 && request.farm.payments[0].proofUrl && (
                                    <button 
                                        onClick={() => setSelectedReceipt(request.farm.payments[0].proofUrl)}
                                        className="mb-3 w-full md:w-auto px-4 py-2 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-xl font-bold text-xs flex items-center justify-center gap-2 hover:bg-emerald-100 transition-colors"
                                    >
                                        <span>📄 View Receipt</span>
                                    </button>
                                )}

                                <select
                                    value={request.status}
                                    onChange={(e) => handleStatusChange(request.id, e.target.value)}
                                    className={`w-full md:w-auto font-black text-sm uppercase tracking-widest rounded-xl border-2 p-3 ${request.status === 'pending' ? 'border-amber-200 bg-amber-50 text-amber-700' :
                                            request.status === 'approved' ? 'border-blue-200 bg-blue-50 text-blue-700' :
                                                request.status === 'planted' ? 'border-green-200 bg-green-50 text-green-700' :
                                                    'border-red-200 bg-red-50 text-red-700'
                                        }`}
                                >
                                    <option value="pending">Pending</option>
                                    <option value="approved">Approved</option>
                                    <option value="planted">Planted</option>
                                    <option value="rejected">Rejected</option>
                                </select>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Receipt Modal */}
            {selectedReceipt && (
                <div 
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300"
                    onClick={() => setSelectedReceipt(null)}
                >
                    <div className="relative max-w-4xl w-full bg-white rounded-[2rem] p-4 shadow-2xl animate-in zoom-in-95 duration-300" onClick={e => e.stopPropagation()}>
                        <button 
                            className="absolute -top-4 -right-4 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg text-gray-900 hover:text-red-500 transition-colors z-10"
                            onClick={() => setSelectedReceipt(null)}
                        >
                            <span className="text-2xl font-black">×</span>
                        </button>
                        
                        <div className="overflow-hidden rounded-2xl bg-gray-100 flex items-center justify-center min-h-[40vh] max-h-[80vh]">
                            <img 
                                src={getMediaUrl(selectedReceipt)} 
                                alt="Payment Receipt" 
                                className="max-w-full max-h-full object-contain"
                            />
                        </div>
                        
                        <div className="mt-4 flex justify-between items-center px-2">
                            <p className="text-sm font-bold text-gray-500">Payment Verification Receipt</p>
                            <a 
                                href={getMediaUrl(selectedReceipt)} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-xs font-black text-emerald-600 uppercase tracking-widest hover:underline"
                            >
                                Open Original
                            </a>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PlantationRequests;
