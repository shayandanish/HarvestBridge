import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PendingLandsList from './PendingLandsList';
import PendingFarmsList from './PendingFarmsList';
import PendingFarmersList from './PendingFarmersList';

const AdminDashboard = () => {
    const [activeTab, setActiveTab] = useState('lands');
    const navigate = useNavigate();

    return (
        <div className="min-h-screen pt-12 sm:pt-24 pb-12 px-4" style={{
            background: 'radial-gradient(circle at 50% 0%, #1e293b 0%, #0f172a 100%)',
            color: '#fff'
        }}>
            <div className="max-w-6xl mx-auto">
                <div className="mb-10">
                    <h2 className="text-2xl sm:text-4xl font-bold text-white mb-2">Admin Control Center</h2>
                    <p className="text-white/60">Manage and verify platform registrations</p>
                </div>

                {/* Tabs */}
                <div className="flex flex-wrap gap-2 sm:gap-4 mb-8 p-1 bg-white/5 backdrop-blur-md border border-white/10 rounded-xl w-full sm:w-fit">
                    <button
                        onClick={() => setActiveTab('lands')}
                        className={`px-3 sm:px-6 py-2 sm:py-2.5 rounded-lg text-xs sm:text-base font-bold transition-all ${activeTab === 'lands'
                            ? 'bg-green-500 text-black shadow-[0_0_20px_rgba(34,197,94,0.3)]'
                            : 'text-white/60 hover:text-white hover:bg-white/5'
                            }`}
                    >
                        Land Registrations
                    </button>
                    <button
                        onClick={() => setActiveTab('farms')}
                        className={`px-3 sm:px-6 py-2 sm:py-2.5 rounded-lg text-xs sm:text-base font-bold transition-all ${activeTab === 'farms'
                            ? 'bg-green-500 text-black shadow-[0_0_20px_rgba(34,197,94,0.3)]'
                            : 'text-white/60 hover:text-white hover:bg-white/5'
                            }`}
                    >
                        Farm Applications
                    </button>
                    <button
                        onClick={() => setActiveTab('farmers')}
                        className={`px-3 sm:px-6 py-2 sm:py-2.5 rounded-lg text-xs sm:text-base font-bold transition-all ${activeTab === 'farmers'
                            ? 'bg-green-500 text-black shadow-[0_0_20px_rgba(34,197,94,0.3)]'
                            : 'text-white/60 hover:text-white hover:bg-white/5'
                            }`}
                    >
                        Farmer Profiles
                    </button>
                    <button
                        onClick={() => navigate('/admin/trees')}
                        className={`flex items-center gap-2 px-3 sm:px-6 py-2 sm:py-2.5 rounded-lg text-xs sm:text-base font-bold transition-all text-white/60 hover:text-white hover:bg-white/5 border border-white/10 ml-0 sm:ml-4`}
                    >
                        <span>🌳</span> Tree Catalogue
                    </button>
                </div>

                {/* Content Area */}
                <div className="transition-all duration-300">
                    {activeTab === 'lands' && <PendingLandsList />}
                    {activeTab === 'farms' && <PendingFarmsList />}
                    {activeTab === 'farmers' && <PendingFarmersList />}
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
