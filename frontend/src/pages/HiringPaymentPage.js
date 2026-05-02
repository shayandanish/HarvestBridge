import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { marketplaceService, paymentService } from '../services/api';
import { investmentService } from '../services/investmentService';
import PaymentProofUpload from '../components/PaymentProofUpload';

const HiringPaymentPage = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const queryParams = new URLSearchParams(location.search);
    const farmId = queryParams.get('farmId');

    const [farm, setFarm] = useState(null);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState('bank'); // 'bank', 'pakistan'
    const [showProofUpload, setShowProofUpload] = useState(false);
    const [paymentId, setPaymentId] = useState(null);
    const [formData, setFormData] = useState({
        bankName: '',
        accountTitle: '',
        accountNumber: '',
        transactionId: ''
    });

    useEffect(() => {
        const fetchFarmDetails = async () => {
            if (!farmId) {
                navigate('/investor/dashboard');
                return;
            }
            try {
                const data = await marketplaceService.getFarmDetails(farmId);
                setFarm(data);
            } catch (error) {
                console.error('Error fetching farm:', error);
                alert('Failed to load farm details');
            } finally {
                setLoading(false);
            }
        };
        fetchFarmDetails();
    }, [farmId, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setProcessing(true);
        try {
            await investmentService.payFarmerCharges({
                farmId,
                ...formData
            });
            alert('Payment submitted successfully! Hiring is now finalized.');
            navigate('/investor/investments');
        } catch (error) {
            console.error('Payment error:', error);
            alert('Failed to process payment. Please try again.');
        } finally {
            setProcessing(false);
        }
    };

    const handleInitiatePakistanPayment = async () => {
        try {
            setProcessing(true);
            const data = await investmentService.initiateHiringPayment({ 
                farmId, 
                paymentMethod: 'manual_pakistan' 
            });
            setPaymentId(data.paymentId);
            setShowProofUpload(true);
        } catch (error) {
            console.error('Payment initiation error:', error);
            alert('Failed to initiate payment. Please try again.');
        } finally {
            setProcessing(false);
        }
    };

    if (loading) return <div className="text-center py-20">Loading details...</div>;
    if (!farm) return <div className="text-center py-20">Farm not found</div>;

    const charges = farm.farmer?.chargesPerTask || 0;

    return (
        <div className="bg-gray-50 min-h-screen py-12">
            <div className="container mx-auto px-4 max-w-2xl">
                <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
                    <div className="bg-orange-600 p-8 text-white relative">
                        <h2 className="text-3xl font-black uppercase tracking-tighter mb-2">Farmer Hiring Fee</h2>
                        <p className="opacity-80 text-sm font-bold uppercase tracking-widest">Complete payment for {farm.farmName}</p>
                    </div>

                    {!showProofUpload ? (
                        <div className="p-8">
                            <div className="mb-8 p-6 bg-orange-50 rounded-2xl border-2 border-orange-100">
                                <div className="flex justify-between items-center">
                                    <span className="font-bold text-gray-500 uppercase tracking-widest text-xs">Farmer Charges</span>
                                    <span className="text-3xl font-black text-orange-600">Rs. {charges.toLocaleString()}</span>
                                </div>
                                <div className="mt-4 pt-4 border-t border-orange-100 flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-orange-200 flex items-center justify-center text-lg">👤</div>
                                    <div>
                                        <p className="font-black text-gray-900 leading-none">{farm.farmer?.user?.fullName}</p>
                                        <p className="text-[10px] text-orange-600 font-bold uppercase tracking-widest mt-1">Professional Farmer</p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-4 mb-8">
                                <button 
                                    className={`flex-1 py-4 rounded-2xl border-2 transition-all font-bold text-xs uppercase tracking-widest ${paymentMethod === 'bank' ? 'border-orange-600 bg-orange-50 text-orange-600' : 'border-gray-100 bg-gray-50 text-gray-400'}`}
                                    onClick={() => setPaymentMethod('bank')}
                                >
                                    🏦 Bank Transfer
                                </button>
                                <button 
                                    className={`flex-1 py-4 rounded-2xl border-2 transition-all font-bold text-xs uppercase tracking-widest ${paymentMethod === 'pakistan' ? 'border-orange-600 bg-orange-50 text-orange-600' : 'border-gray-100 bg-gray-50 text-gray-400'}`}
                                    onClick={() => setPaymentMethod('pakistan')}
                                >
                                    📱 Mobile Wallet
                                </button>
                            </div>

                            {paymentMethod === 'bank' ? (
                                <form onSubmit={handleSubmit}>
                                    <div className="space-y-6">
                                        <div>
                                            <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Bank Name</label>
                                            <input
                                                type="text"
                                                required
                                                className="w-full bg-gray-50 border-2 border-gray-50 rounded-2xl p-4 focus:border-orange-600 focus:bg-white outline-none transition-all font-bold"
                                                placeholder="Enter Bank Name"
                                                value={formData.bankName}
                                                onChange={e => setFormData({ ...formData, bankName: e.target.value })}
                                            />
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Account Title</label>
                                                <input
                                                    type="text"
                                                    required
                                                    className="w-full bg-gray-50 border-2 border-gray-50 rounded-2xl p-4 focus:border-orange-600 focus:bg-white outline-none transition-all font-bold"
                                                    placeholder="Full Name"
                                                    value={formData.accountTitle}
                                                    onChange={e => setFormData({ ...formData, accountTitle: e.target.value })}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Account/IBAN</label>
                                                <input
                                                    type="text"
                                                    required
                                                    className="w-full bg-gray-50 border-2 border-gray-50 rounded-2xl p-4 focus:border-orange-600 focus:bg-white outline-none transition-all font-bold"
                                                    placeholder="Account Number"
                                                    value={formData.accountNumber}
                                                    onChange={e => setFormData({ ...formData, accountNumber: e.target.value })}
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Transaction ID / Reference</label>
                                            <input
                                                type="text"
                                                required
                                                className="w-full bg-gray-50 border-2 border-gray-50 rounded-2xl p-4 focus:border-orange-600 focus:bg-white outline-none transition-all font-bold"
                                                placeholder="TXN-XXXX-XXXX"
                                                value={formData.transactionId}
                                                onChange={e => setFormData({ ...formData, transactionId: e.target.value })}
                                            />
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={processing}
                                        className={`w-full mt-10 py-5 rounded-3xl font-black text-xs uppercase tracking-widest transition-all shadow-xl ${processing ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-gray-900 text-white hover:bg-orange-600 shadow-orange-100 hover:shadow-orange-200'
                                            }`}
                                    >
                                        {processing ? 'Processing Payment...' : 'Confirm & Finalize Hiring'}
                                    </button>
                                </form>
                            ) : (
                                <div className="p-8 bg-orange-50 border-2 border-orange-100 rounded-3xl text-center">
                                    <div className="w-20 h-20 bg-orange-200 rounded-full flex items-center justify-center mx-auto mb-6 text-3xl">📱</div>
                                    <h3 className="text-xl font-black text-gray-900 mb-2">EasyPaisa & JazzCash</h3>
                                    <p className="text-gray-500 mb-8 font-medium">Use your mobile wallet to pay the charges and upload the receipt screenshot.</p>
                                    <button 
                                        onClick={handleInitiatePakistanPayment}
                                        disabled={processing}
                                        className="w-full py-5 bg-orange-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-orange-700 transition-all shadow-lg shadow-orange-200 disabled:opacity-50"
                                    >
                                        {processing ? 'Initiating...' : 'Pay with EasyPaisa / JazzCash'}
                                    </button>
                                </div>
                            )}

                            <p className="text-[9px] text-gray-400 text-center mt-6 font-bold uppercase tracking-widest px-8">
                                By clicking confirm, you agree that you have transferred the mentioned amount to the farmer's account for their services.
                            </p>
                        </div>
                    ) : (
                        <div className="p-8">
                            <PaymentProofUpload 
                                paymentId={paymentId} 
                                amount={charges}
                                onComplete={() => {
                                    alert('Receipt submitted! Our team will verify and finalize the hiring shortly.');
                                    navigate('/investor/investments');
                                }}
                                onCancel={() => setShowProofUpload(false)}
                            />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default HiringPaymentPage;
