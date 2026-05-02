import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { marketplaceService, getMediaUrl } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { convertArea, UNIT_CONVERSIONS } from '../utils/unitConverter';

const LandLeasePage = () => {
    const { landId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();

    const [land, setLand] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [availableArea, setAvailableArea] = useState(0);

    const [formData, setFormData] = useState({
        farmName: '',
        description: '',
        area: '',
        areaUnit: '', // User's selected unit
    });

    useEffect(() => {
        if (land && !formData.areaUnit) {
            setFormData(prev => ({ ...prev, areaUnit: land.areaUnit }));
        }
    }, [land]);

    useEffect(() => {
        const fetchLand = async () => {
            try {
                const data = await marketplaceService.getVerifiedLands({ id: landId });
                // getVerifiedLands returns an array/pagination object
                const foundLand = data.lands?.find(l => l.id === landId);

                if (!foundLand) {
                    alert('Land not found');
                    navigate('/marketplace?tab=lands');
                    return;
                }

                setLand(foundLand);

                // Calculate available area in base units
                const leasedArea = foundLand.farms?.reduce((sum, f) => {
                    const farmAreaInBaseUnit = convertArea(f.totalArea, f.areaUnit || foundLand.areaUnit, foundLand.areaUnit);
                    return sum + Number(farmAreaInBaseUnit || 0);
                }, 0) || 0;
                setAvailableArea(Number(foundLand.totalArea) - leasedArea);

            } catch (error) {
                console.error('Error fetching land:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchLand();
    }, [landId, navigate]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Safety check for token
        const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
        if (!token) {
            alert('Your session has expired or you are not logged in. Please login to continue.');
            navigate('/login', { state: { from: window.location.pathname } });
            return;
        }

        if (Number(formData.area) > displayAvailableArea) {
            alert(`Requested area exceeds available area (${displayAvailableArea.toFixed(2)} ${formData.areaUnit})`);
            return;
        }

        setSubmitting(true);
        try {
            const response = await marketplaceService.leaseLand({
                landId,
                farmName: formData.farmName,
                description: formData.description,
                area: formData.area,
                areaUnit: formData.areaUnit || land.areaUnit
            });

            // Redirect to the updated payment path
            navigate(`/investor/checkout/lease/${response.farmId}`);
        } catch (error) {
            console.error('Lease error:', error);
            const message = error.response?.data?.message || 'Error processing lease';
            alert(`${message}${message === 'No token provided' ? ' (Authentication Error)' : ''}`);
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-gray-900">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
        </div>
    );

    // Dynamically calculate values based on selected unit
    const displayAvailableArea = land ? convertArea(availableArea, land.areaUnit, formData.areaUnit) : 0;
    const rateInSelectedUnit = land ? (Number(land.rentalFeeMonthly) / convertArea(1, land.areaUnit, formData.areaUnit)) : 0;
    const leaseAmount = (Number(formData.area) || 0) * rateInSelectedUnit;

    return (
        <div className="min-h-screen bg-gray-950 text-white py-12 px-4 sm:px-6 lg:px-8 font-sans selection:bg-green-500/30">
            <div className="max-w-4xl mx-auto">
                <button
                    onClick={() => navigate(-1)}
                    className="mb-8 flex items-center gap-2 text-gray-400 hover:text-white transition-colors group"
                >
                    <span className="group-hover:-translate-x-1 transition-transform">←</span> Back to Marketplace
                </button>

                <div className="grid lg:grid-cols-2 gap-12">
                    {/* Land Summary */}
                    <div className="space-y-8">
                        <div>
                            <h1 className="text-4xl font-black tracking-tight mb-2 text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-500">
                                Lease Premium Land
                            </h1>
                            <p className="text-gray-400 font-medium">Start your farming project on verified grounds.</p>
                        </div>

                        <div className="bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-xl relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/10 rounded-full blur-3xl -mr-16 -mt-16"></div>

                            <h2 className="text-2xl font-black mb-4 flex items-center gap-3">
                                <span className="text-3xl">🏞️</span> {land.landName}
                            </h2>

                            <div className="space-y-4 text-sm font-medium">
                                <p className="text-gray-400 flex items-center gap-2">
                                    <span className="text-blue-400">📍</span> {land.address}, {land.city}
                                </p>
                                <div className="grid grid-cols-2 gap-4 pt-4">
                                    <div className="bg-black/20 p-4 rounded-2xl border border-white/5">
                                        <span className="text-[10px] uppercase text-gray-500 tracking-widest block mb-1">Total Available</span>
                                        <span className="text-lg font-black">{displayAvailableArea.toFixed(2)} {formData.areaUnit}</span>
                                    </div>
                                    <div className="bg-black/20 p-4 rounded-2xl border border-white/5">
                                        <span className="text-[10px] uppercase text-gray-500 tracking-widest block mb-1">Monthly Rate</span>
                                        <span className="text-lg font-black">Rs. {rateInSelectedUnit.toLocaleString(undefined, { maximumFractionDigits: 2 })} <span className="text-xs text-gray-400">/{formData.areaUnit}</span></span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Growth Conditions */}
                        <div className="grid grid-cols-3 gap-4">
                            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center">
                                <span className="text-[10px] uppercase text-gray-500 tracking-widest block mb-2 font-black">Soil Quality</span>
                                <div className="text-xl font-black text-green-400">{land.soilQuality || '4'}/5</div>
                            </div>
                            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center">
                                <span className="text-[10px] uppercase text-gray-500 tracking-widest block mb-2 font-black">Water Access</span>
                                <div className="text-xl font-black text-blue-400">{land.waterAvailability || '5'}/5</div>
                            </div>
                            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center">
                                <span className="text-[10px] uppercase text-gray-500 tracking-widest block mb-2 font-black">Sun Exposure</span>
                                <div className="text-xl font-black text-yellow-400">{land.sunlightExposure || '4'}/5</div>
                            </div>
                        </div>

                        {/* Suitable Cultivations */}
                        <div className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-xl">
                            <h3 className="text-xs font-black uppercase tracking-widest text-gray-500 mb-4 flex items-center gap-2">
                                <span className="text-lg">🌿</span> Suitable Cultivations
                            </h3>
                            <div className="flex flex-wrap gap-2">
                                {land.cultivablePlants ? (
                                    (typeof land.cultivablePlants === 'string' ? JSON.parse(land.cultivablePlants) : land.cultivablePlants).map((plant, idx) => (
                                        <span key={idx} className="px-4 py-2 bg-green-500/10 text-green-400 text-xs font-black uppercase tracking-widest rounded-xl border border-green-500/20">
                                            {plant}
                                        </span>
                                    ))
                                ) : (
                                    <span className="text-sm text-gray-500 italic">No specific crop data provided</span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Lease Form */}
                    <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-10 backdrop-blur-2xl shadow-2xl relative">
                        <div className="absolute bottom-0 left-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl -ml-24 -mb-24 pointer-events-none"></div>

                        <form onSubmit={handleSubmit} className="space-y-8 relative z-10">
                            <div className="space-y-6">
                                <div>
                                    <label className="block text-xs font-black uppercase tracking-widest text-gray-500 mb-3">Project Name</label>
                                    <input
                                        required
                                        type="text"
                                        name="farmName"
                                        autoComplete="off"
                                        placeholder="e.g. Emerald Acres Orchard"
                                        className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 outline-none focus:ring-2 focus:ring-green-500 transition-all font-bold placeholder:text-gray-600 block"
                                        value={formData.farmName}
                                        onChange={handleChange}
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-black uppercase tracking-widest text-gray-500 mb-3">Project Description</label>
                                    <textarea
                                        name="description"
                                        rows="3"
                                        placeholder="Tell us about your farming vision..."
                                        className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 outline-none focus:ring-2 focus:ring-green-500 transition-all font-bold placeholder:text-gray-600 resize-none block"
                                        value={formData.description}
                                        onChange={handleChange}
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-black uppercase tracking-widest text-gray-500 mb-3">Lease Area & Unit</label>
                                    <div className="flex gap-4">
                                        <div className="relative flex-1">
                                            <input
                                                required
                                                type="number"
                                                name="area"
                                                max={displayAvailableArea}
                                                step="0.01"
                                                min="0.01"
                                                placeholder={`Max ${displayAvailableArea.toFixed(1)}`}
                                                className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 outline-none focus:ring-2 focus:ring-green-500 transition-all font-bold placeholder:text-gray-600 block"
                                                value={formData.area}
                                                onChange={handleChange}
                                            />
                                        </div>
                                        <div className="w-32">
                                            <select
                                                name="areaUnit"
                                                className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 outline-none focus:ring-2 focus:ring-green-500 transition-all font-bold text-gray-300 block appearance-none"
                                                value={formData.areaUnit}
                                                onChange={handleChange}
                                            >
                                                {Object.keys(UNIT_CONVERSIONS).map(unit => (
                                                    <option key={unit} value={unit} className="bg-gray-900 text-white">{unit}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-6 border-t border-white/10 space-y-4">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">Estimated Price</span>
                                    <span className="font-black text-green-400">Rs. {leaseAmount.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-xs text-gray-500">Redirects to secure payment checkout</span>
                                    <span className="text-[10px] bg-green-500/20 text-green-400 px-2 py-1 rounded-md font-black uppercase tracking-widest">Calculated</span>
                                </div>

                                <button
                                    type="submit"
                                    disabled={submitting || !formData.area || !formData.farmName}
                                    className="w-full py-5 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-green-500/20 hover:shadow-green-500/40 hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-50 disabled:translate-y-0"
                                >
                                    {submitting ? 'Initializing...' : 'Confirm & Proceed to Payment'}
                                </button>
                                <p className="text-center text-[10px] text-gray-500 font-medium uppercase tracking-widest">
                                    Secure Transaction Powered by Agro-Connect
                                </p>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LandLeasePage;
