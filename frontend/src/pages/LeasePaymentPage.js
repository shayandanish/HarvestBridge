import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { paymentService } from '../services/api';
import PaymentProofUpload from '../components/PaymentProofUpload';

const LeasePaymentPage = () => {
    const { farmId } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [paymentData, setPaymentData] = useState(null);
    const [paymentMethod, setPaymentMethod] = useState('pakistan'); // 'bank', 'pakistan'
    const [showProofUpload, setShowProofUpload] = useState(false);
    const [formData, setFormData] = useState({
        bankName: '',
        accountTitle: '',
        accountNumber: ''
    });

    const banks = [
        'Habib Bank Limited (HBL)',
        'United Bank Limited (UBL)',
        'Meezan Bank',
        'Bank Alfalah',
        'Standard Chartered',
        'MCB Bank',
        'Allied Bank',
        'Askari Bank'
    ];

    useEffect(() => {
        const initPayment = async () => {
            try {
                const data = await paymentService.initiateLeasePayment(farmId, paymentMethod === 'pakistan' ? 'manual_pakistan' : 'bank_transfer');
                setPaymentData(data);
            } catch (error) {
                console.error('Payment initiation error:', error);
                const errorMsg = error.response?.data?.message || 'Error initiating payment process';
                alert(`Payment Error: ${errorMsg}`);
                navigate('/dashboard');
            } finally {
                setLoading(false);
            }
        };
        initPayment();
    }, [farmId, navigate]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handlePayment = async (e) => {
        e.preventDefault();

        if (!formData.bankName || !formData.accountTitle || !formData.accountNumber) {
            alert('Please fill in all payment details');
            return;
        }

        setProcessing(true);
        try {
            // Simulate payment processing delay
            await new Promise(resolve => setTimeout(resolve, 2000));

            await paymentService.confirmLeasePayment({
                paymentId: paymentData.paymentId,
                farmId,
                ...formData
            });

            alert('Payment Successful! Your farm is now active.');
            navigate('/dashboard');
        } catch (error) {
            console.error('Payment confirmation error:', error);
            alert('Error confirming payment');
        } finally {
            setProcessing(false);
        }
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-gray-950">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center py-12 px-4 font-sans">
            <div className="max-w-lg w-full bg-white/5 border border-white/10 rounded-[2.5rem] p-10 backdrop-blur-2xl shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/10 rounded-full blur-3xl -mr-16 -mt-16"></div>

                <div className="relative z-10">
                    <div className="mb-8 text-center">
                        <div className="w-20 h-20 bg-green-500/20 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-green-500/30">
                            <span className="text-4xl text-green-400">💸</span>
                        </div>
                        <h1 className="text-3xl font-black mb-2 tracking-tight uppercase tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-500">
                            Payment Details
                        </h1>
                        <p className="text-gray-400 font-medium text-sm">Transfer the amount to complete farm activation.</p>
                    </div>

                    <div className="space-y-6 mb-8">
                        <div className="bg-black/40 p-6 rounded-3xl border border-white/5">
                            <div className="flex justify-between items-center mb-4 pb-4 border-b border-white/5">
                                <span className="text-xs font-black uppercase tracking-widest text-gray-500">Project</span>
                                <span className="font-bold text-sm truncate max-w-[200px]">{paymentData?.farmName}</span>
                            </div>
                            
                            {paymentData?.plantationAmount > 0 ? (
                                <div className="space-y-3 mb-4 pb-4 border-b border-white/5">
                                    <div className="flex justify-between items-center">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-600">Land Lease Fee</span>
                                        <span className="text-sm font-bold">Rs. {paymentData?.leaseAmount?.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-600">Plantation Cost</span>
                                        <span className="text-sm font-bold text-green-500">Rs. {paymentData?.plantationAmount?.toLocaleString()}</span>
                                    </div>
                                </div>
                            ) : (
                                <div className="mb-4 pb-4 border-b border-white/5">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-600 mb-1">Fee Includes</p>
                                    <p className="text-xs text-gray-400">Standard land lease processing and maintenance fee.</p>
                                </div>
                            )}

                            <div className="flex justify-between items-center">
                                <span className="text-xs font-black uppercase tracking-widest text-gray-500">Total Amount Due</span>
                                <span className="text-2xl font-black text-green-400">Rs. {paymentData?.amount?.toLocaleString()}</span>
                            </div>
                        </div>

                        {!showProofUpload ? (
                            <div className="space-y-6">
                                <div className="flex gap-4 mb-6">
                                    <button 
                                        className={`flex-1 py-4 rounded-2xl border-2 transition-all font-bold text-xs uppercase tracking-widest ${paymentMethod === 'bank' ? 'border-green-500 bg-green-500/10 text-green-400' : 'border-white/10 bg-white/5 text-gray-500'}`}
                                        onClick={() => setPaymentMethod('bank')}
                                    >
                                        🏦 Bank Transfer
                                    </button>
                                    <button 
                                        className={`flex-1 py-4 rounded-2xl border-2 transition-all font-bold text-xs uppercase tracking-widest ${paymentMethod === 'pakistan' ? 'border-green-500 bg-green-500/10 text-green-400' : 'border-white/10 bg-white/5 text-gray-500'}`}
                                        onClick={() => setPaymentMethod('pakistan')}
                                    >
                                        📱 Mobile Wallet
                                    </button>
                                </div>

                                {paymentMethod === 'bank' ? (
                                    <form onSubmit={handlePayment} className="space-y-5 animate-fade-in">
                                        <div>
                                            <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2 ml-1">Select Bank</label>
                                            <select
                                                required
                                                name="bankName"
                                                value={formData.bankName}
                                                onChange={handleChange}
                                                className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 outline-none focus:ring-2 focus:ring-green-500 transition-all font-bold text-sm appearance-none cursor-pointer"
                                            >
                                                <option value="" disabled className="bg-gray-900">Choose your bank</option>
                                                {banks.map(bank => (
                                                    <option key={bank} value={bank} className="bg-gray-900">{bank}</option>
                                                ))}
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2 ml-1">Account Title</label>
                                            <input
                                                required
                                                type="text"
                                                name="accountTitle"
                                                placeholder="Enter account holder name"
                                                value={formData.accountTitle}
                                                onChange={handleChange}
                                                className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 outline-none focus:ring-2 focus:ring-green-500 transition-all font-bold placeholder:text-gray-700 text-sm"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2 ml-1">Account Number / IBAN</label>
                                            <input
                                                required
                                                type="text"
                                                name="accountNumber"
                                                placeholder="Enter 14-24 digit number"
                                                value={formData.accountNumber}
                                                onChange={handleChange}
                                                className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 outline-none focus:ring-2 focus:ring-green-500 transition-all font-bold placeholder:text-gray-700 text-sm"
                                            />
                                        </div>

                                        <button
                                            type="submit"
                                            disabled={processing || !formData.bankName || !formData.accountTitle || !formData.accountNumber}
                                            className="w-full py-5 mt-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-green-500/20 hover:shadow-green-500/40 hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-50 disabled:translate-y-0"
                                        >
                                            {processing ? (
                                                <div className="flex items-center justify-center gap-2">
                                                    <div className="animate-spin h-4 w-4 border-2 border-white/30 border-t-white rounded-full"></div>
                                                    <span>Confirming Transfer...</span>
                                                </div>
                                            ) : 'Complete and Confirm Payment'}
                                        </button>
                                    </form>
                                ) : (
                                    <div className="animate-fade-in p-6 bg-green-500/5 border border-green-500/10 rounded-3xl text-center">
                                        <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <span className="text-2xl">📱</span>
                                        </div>
                                        <h3 className="text-lg font-black mb-2">Pakistani Mobile Wallets</h3>
                                        <p className="text-sm text-gray-400 mb-6">Pay using EasyPaisa or JazzCash and upload the receipt screenshot.</p>
                                        <button 
                                            onClick={() => setShowProofUpload(true)}
                                            className="w-full py-4 bg-white text-black rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-green-400 transition-all"
                                        >
                                            Pay with EasyPaisa / JazzCash
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <PaymentProofUpload 
                                paymentId={paymentData?.paymentId}
                                amount={paymentData?.amount}
                                onComplete={() => {
                                    alert('Receipt submitted successfully! Our team will verify it shortly.');
                                    navigate('/dashboard');
                                }}
                                onCancel={() => setShowProofUpload(false)}
                            />
                        )}
                    </div>

                    <div className="text-center space-y-4">
                        <p className="text-[10px] text-gray-500 font-medium uppercase tracking-widest flex items-center justify-center gap-2">
                            <span className="text-green-500 text-sm">🔒</span> Secure Bank Transfer Verification
                        </p>
                        <button
                            type="button"
                            onClick={() => navigate(-1)}
                            className="text-[10px] text-gray-600 font-black uppercase tracking-widest hover:text-white transition-colors"
                        >
                            Cancel Transaction
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LeasePaymentPage;
