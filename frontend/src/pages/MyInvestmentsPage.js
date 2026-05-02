import React, { useState, useEffect } from 'react';
import { investmentService } from '../services/api';
import { useNavigate } from 'react-router-dom';
import RatingModal from '../components/RatingModal';

const MyInvestmentsPage = () => {
    const navigate = useNavigate();
    const [investments, setInvestments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedFarmer, setSelectedFarmer] = useState(null);
    const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);

    useEffect(() => {
        fetchInvestments();
    }, []);

    const fetchInvestments = async () => {
        try {
            const data = await investmentService.getAll();
            setInvestments(data);
        } catch (error) {
            console.error('Error fetching investments:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="text-center py-20">Loading investments...</div>;

    return (
        <div className="container mx-auto px-4 py-12">
            <button
                onClick={() => navigate('/dashboard')}
                className="mb-8 flex items-center gap-2 text-gray-400 font-black uppercase tracking-widest text-[10px] hover:text-gray-900 transition-all group"
            >
                <div className="w-8 h-8 rounded-full border border-gray-100 flex items-center justify-center group-hover:-translate-x-1 transition-transform">
                    ←
                </div>
                Back to Dashboard
            </button>

            <h2 className="text-4xl font-black text-gray-900 mb-12 tracking-tight">My Investments</h2>

            {investments.length === 0 ? (
                <div className="text-center py-20 bg-gray-50 rounded-lg">
                    <p className="text-gray-500 mb-4">You have no active investments.</p>
                    <button
                        onClick={() => navigate('/marketplace')}
                        className="bg-green-600 text-white px-6 py-2 rounded-full hover:bg-green-700"
                    >
                        Browse Marketplace
                    </button>
                </div>
            ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {investments.map(inv => (
                        <div key={inv.id} className="bg-white rounded-3xl shadow-sm hover:shadow-xl transition-all p-8 border border-gray-100 flex flex-col">
                            <div className="flex justify-between items-start mb-6">
                                <div className="flex items-center gap-4">
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl ${inv.type === 'farm_lease' ? 'bg-amber-100 text-amber-600' : 
                                        inv.type === 'plantation_request' ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'
                                        }`}>
                                        {inv.type === 'farm_lease' ? '🚜' : inv.type === 'plantation_request' ? '🌳' : '🌱'}
                                    </div>
                                    <div>
                                        <h3 className="font-black text-gray-900 leading-tight">{inv.title}</h3>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                                            {inv.type === 'farm_lease' ? 'Land Lease' : inv.type === 'plantation_request' ? 'Plantation Project' : 'Plant Investment'}
                                        </p>
                                    </div>
                                </div>
                                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${(inv.status === 'active' || inv.status === 'approved' || inv.status === 'accepted') ? 'bg-green-100 text-green-700' :
                                    (inv.status === 'pending' || (inv.type === 'farm_lease' && inv.hiringStatus === 'pending')) ? 'bg-amber-100 text-amber-700' :
                                        (inv.type === 'farm_lease' && inv.hiringStatus === 'awaiting_payment') ? 'bg-orange-100 text-orange-700' :
                                            'bg-gray-100 text-gray-600'
                                    }`}>
                                    {inv.type === 'farm_lease' && inv.hiringStatus && inv.hiringStatus !== 'none' && inv.hiringStatus !== 'accepted'
                                        ? `Hiring: ${inv.hiringStatus.replace('_', ' ')}`
                                        : inv.status}
                                </span>
                            </div>

                            <div className="space-y-4 mb-8 flex-1">
                                <div className="flex justify-between items-center py-3 border-b border-gray-50 text-sm">
                                    <span className="font-bold text-gray-400 uppercase tracking-widest text-[10px]">Total Invested</span>
                                    <span className="font-black text-gray-900">Rs. {inv.amount?.toLocaleString()}</span>
                                </div>

                                {inv.type === 'farm_lease' || inv.type === 'plantation_request' ? (
                                    <>
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="font-bold text-gray-400 uppercase tracking-widest text-[10px]">Location</span>
                                            <span className="font-bold text-gray-900">{inv.details.location}</span>
                                        </div>
                                        {inv.type === 'plantation_request' && (
                                            <div className="pt-2">
                                                <span className="font-bold text-gray-400 uppercase tracking-widest text-[10px] block mb-1">Trees</span>
                                                <p className="text-xs font-bold text-gray-900 leading-relaxed">{inv.details.items}</p>
                                            </div>
                                        )}
                                        {inv.type === 'farm_lease' && inv.details.area && (
                                            <div className="flex justify-between items-center text-sm">
                                                <span className="font-bold text-gray-400 uppercase tracking-widest text-[10px]">Total Area</span>
                                                <span className="font-bold text-gray-900">{inv.details.area} {inv.details.unit}</span>
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <>
                                        {inv.details?.duration && (
                                            <div className="flex justify-between items-center text-sm">
                                                <span className="font-bold text-gray-400 uppercase tracking-widest text-[10px]">Duration</span>
                                                <span className="font-bold text-gray-900">{inv.details.duration} Months</span>
                                            </div>
                                        )}
                                        {inv.details?.harvestDate && (
                                            <div className="flex justify-between items-center text-sm">
                                                <span className="font-bold text-gray-400 uppercase tracking-widest text-[10px]">Est. Harvest</span>
                                                <span className="font-bold text-gray-900">{new Date(inv.details.harvestDate).toLocaleDateString()}</span>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>

                            <div className="pt-4 border-t border-gray-50">
                                <button
                                    onClick={() => {
                                        if (inv.hiringStatus === 'awaiting_payment') {
                                            navigate(`/investor/pay-farmer?farmId=${inv.farmId || inv.id}`);
                                        } else if (inv.type === 'plantation_request') {
                                            navigate(`/farms/${inv.farmId}`);
                                        } else {
                                            inv.type === 'plant_investment'
                                                ? navigate(`/investor/investments/${inv.plantId}/track`)
                                                : navigate(`/farms/${inv.id}`);
                                        }
                                    }}
                                    className={`w-full py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-colors shadow-lg ${inv.hiringStatus === 'awaiting_payment'
                                        ? 'bg-orange-600 text-white hover:bg-orange-700 shadow-orange-200'
                                        : 'bg-gray-900 text-white hover:bg-primary-600 shadow-gray-200'
                                        }`}
                                >
                                    {inv.hiringStatus === 'awaiting_payment'
                                        ? 'Pay Farmer Charges'
                                        : (inv.type === 'plantation_request' 
                                            ? (inv.farmerId ? 'View Farm Status' : 'Manage Farm') 
                                            : (inv.type === 'plant_investment' ? 'Track Progress' : 'View Farm Status'))}
                                </button>

                                {/* Rate Farmer Button */}
                                {(inv.status === 'active' || inv.hiringStatus === 'accepted') && (
                                    <button
                                        onClick={() => {
                                            setSelectedFarmer({
                                                id: inv.farmerId, // Need to ensure backend provides this
                                                name: inv.farmerName || 'the Farmer',
                                                investmentId: inv.type === 'plant_investment' ? inv.id : null,
                                                farmId: inv.type === 'farm_lease' ? inv.id : inv.farmId
                                            });
                                            setIsRatingModalOpen(true);
                                        }}
                                        className="w-full mt-3 py-3 rounded-2xl font-black text-xs uppercase tracking-widest bg-white border-2 border-green-600 text-green-600 hover:bg-green-50 transition-all flex items-center justify-center gap-2"
                                    >
                                        <span>★</span> Rate Farmer
                                    </button>
                                )}

                                <p className="text-[9px] text-gray-400 text-center mt-4 font-bold uppercase tracking-widest">
                                    Invested on {new Date(inv.createdAt).toLocaleDateString()}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {selectedFarmer && (
                <RatingModal
                    isOpen={isRatingModalOpen}
                    onClose={() => setIsRatingModalOpen(false)}
                    farmerId={selectedFarmer.id}
                    farmerName={selectedFarmer.name}
                    investmentId={selectedFarmer.investmentId}
                    farmId={selectedFarmer.farmId}
                    onReviewSubmitted={() => {
                        fetchInvestments(); // Refresh to potentially hide the button if we add check
                    }}
                />
            )}
        </div>
    );
};

export default MyInvestmentsPage;
