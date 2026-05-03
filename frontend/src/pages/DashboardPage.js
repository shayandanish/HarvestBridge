import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LandownerDashboard from '../components/LandownerDashboard';
import FarmerDashboard from '../components/FarmerDashboard';
import AdminDashboard from '../components/AdminDashboard';
import { investorDashboardService } from '../services/api';
import NotificationBell from '../components/NotificationBell';

const DashboardPage = () => {
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const [isMenuOpen, setIsMenuOpen] = React.useState(false);

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    const [stats, setStats] = React.useState({
        totalInvested: 0,
        activePlants: 0,
        totalInvestmentsCount: 0,
        upcomingHarvests: 0
    });
    const [statsLoading, setStatsLoading] = React.useState(false);

    React.useEffect(() => {
        const fetchStats = async () => {
            if (user?.role === 'investor') {
                setStatsLoading(true);
                try {
                    const data = await investorDashboardService.getStats();
                    setStats(data);
                } catch (error) {
                    console.error('Error fetching dashboard stats:', error);
                } finally {
                    setStatsLoading(false);
                }
            }
        };
        fetchStats();
    }, [user]);

    const getRoleBadgeColor = (role) => {
        switch (role) {
            case 'investor':
                return 'bg-blue-100 text-blue-800';
            case 'farmer':
                return 'bg-green-100 text-green-800';
            case 'landowner':
                return 'bg-yellow-100 text-yellow-800';
            case 'admin':
                return 'bg-purple-100 text-purple-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Navigation */}
            <nav className="bg-white shadow-md sticky top-0 z-50">
                <div className="container mx-auto px-6 py-4">
                    <div className="flex justify-between items-center">
                        <h1 className="text-2xl font-bold text-primary-700 cursor-pointer" onClick={() => navigate('/')}>
                            🌱 HarvestBridge
                        </h1>
                        
                        {/* Mobile Toggle */}
                        <button 
                            className="md:hidden text-2xl text-primary-700 focus:outline-none"
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                        >
                            {isMenuOpen ? '✕' : '☰'}
                        </button>

                        {/* Desktop Nav */}
                        <div className="hidden md:flex gap-4 items-center">
                            {user?.role !== 'admin' && (
                                <>
                                    <button
                                        onClick={() => navigate('/marketplace?tab=lands')}
                                        className="px-4 py-2 text-gray-600 hover:text-primary-700 font-medium transition-colors flex items-center gap-2"
                                    >
                                        <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064" /><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth={2} fill="none" /></svg>
                                        Land
                                    </button>
                                    <button
                                        onClick={() => navigate('/marketplace?tab=farms')}
                                        className="px-4 py-2 text-gray-600 hover:text-primary-700 font-medium transition-colors flex items-center gap-2"
                                    >
                                        <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
                                        Farms
                                    </button>
                                    <NotificationBell />
                                    <button
                                        onClick={() => navigate('/messages')}
                                        className="px-4 py-2 text-gray-600 hover:text-primary-700 font-medium transition-colors flex items-center gap-2"
                                    >
                                        <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
                                        Messages
                                    </button>
                                </>
                            )}
                            {user?.role === 'admin' && (
                                <button
                                    onClick={() => navigate('/admin/dashboard')}
                                    className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 font-medium transition-colors flex items-center gap-2"
                                >
                                    <i className="fas fa-user-shield"></i> Admin Console
                                </button>
                            )}
                            <button onClick={() => navigate('/')} className="px-4 py-2 text-gray-600 hover:text-primary-700 font-medium transition-colors flex items-center gap-2">
                                Back to Home
                            </button>
                            <button onClick={handleLogout} className="px-4 py-2 border-2 border-primary-600 text-primary-600 hover:bg-primary-50 font-medium rounded-lg transition-colors flex items-center gap-2">
                                Logout
                            </button>
                        </div>
                    </div>

                    {/* Mobile Menu */}
                    {isMenuOpen && (
                        <div className="md:hidden mt-4 pb-4 flex flex-col gap-2 border-t pt-4">
                            {user?.role !== 'admin' && (
                                <>
                                    <div className="flex justify-between items-center px-4 mb-2">
                                        <NotificationBell />
                                        <span className="text-xs font-bold text-gray-400 uppercase">Notifications</span>
                                    </div>
                                    <button
                                        onClick={() => { navigate('/marketplace?tab=lands'); setIsMenuOpen(false); }}
                                        className="w-full text-left px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-lg font-medium flex items-center gap-3"
                                    >
                                        <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064" /><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth={2} fill="none" /></svg>
                                        Browse Land
                                    </button>
                                    <button
                                        onClick={() => { navigate('/marketplace?tab=farms'); setIsMenuOpen(false); }}
                                        className="w-full text-left px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-lg font-medium flex items-center gap-3"
                                    >
                                        <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
                                        Browse Farms
                                    </button>
                                    <button
                                        onClick={() => { navigate('/messages'); setIsMenuOpen(false); }}
                                        className="w-full text-left px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-lg font-medium flex items-center gap-3"
                                    >
                                        <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
                                        Messages
                                    </button>
                                </>
                            )}
                            {user?.role === 'admin' && (
                                <button
                                    onClick={() => { navigate('/admin/dashboard'); setIsMenuOpen(false); }}
                                    className="w-full text-left px-4 py-3 bg-purple-50 text-purple-700 rounded-lg font-bold"
                                >
                                    🛡️ Admin Console
                                </button>
                            )}
                            <button 
                                onClick={() => { navigate('/'); setIsMenuOpen(false); }} 
                                className="w-full text-left px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-lg font-medium flex items-center gap-3"
                            >
                                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
                                Back to Home
                            </button>
                            <button 
                                onClick={handleLogout} 
                                className="w-full text-left px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg font-bold flex items-center gap-3"
                            >
                                <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                                Logout
                            </button>
                        </div>
                    )}
                </div>
            </nav>

            {/* Dashboard Content */}
            <div className="container mx-auto px-6 py-8">
                <div className="mb-8">
                    <h2 className="text-xl sm:text-3xl font-bold text-gray-900 mb-2">
                        Welcome, {user?.fullName}!
                    </h2>
                    <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getRoleBadgeColor(user?.role)}`}>
                        {user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1)}
                    </span>
                </div>

                {/* Role-specific Dashboard Sections */}
                {user?.role === 'landowner' ? (
                    <LandownerDashboard />
                ) : user?.role === 'farmer' ? (
                    <FarmerDashboard />
                ) : user?.role === 'admin' ? (
                    <AdminDashboard />
                ) : (
                    <>
                        {/* Stats Grid */}
                        <div className="grid md:grid-cols-3 gap-6 mb-8">
                            <div className="card">
                                <h3 className="text-gray-500 text-sm font-medium mb-2">Total Investments</h3>
                                <p className="text-3xl font-bold text-gray-900">{statsLoading ? '...' : stats.totalInvestmentsCount}</p>
                            </div>
                            <div className="card">
                                <h3 className="text-gray-500 text-sm font-medium mb-2">Active Projects</h3>
                                <p className="text-3xl font-bold text-gray-900">{statsLoading ? '...' : stats.totalInvestmentsCount}</p>
                            </div>
                            <div className="card">
                                <h3 className="text-gray-500 text-sm font-medium mb-2">Total Returns</h3>
                                <p className="text-3xl font-bold text-gray-900">Rs. {statsLoading ? '...' : '0'}</p>
                            </div>
                        </div>

                        <div className="card">
                            <h3 className="text-xl font-semibold mb-4">Getting Started</h3>

                            {user?.role === 'investor' && (
                                <div className="space-y-4">
                                    <p className="text-gray-600 mb-4">
                                        Start investing in agricultural projects or browse available land for your own farming ventures.
                                    </p>
                                    <div className="flex flex-wrap gap-4">
                                        <button
                                            onClick={() => navigate('/investor/investments')}
                                            className="btn-primary"
                                        >
                                            My Investments
                                        </button>
                                        <button
                                            onClick={() => navigate('/marketplace?tab=lands')}
                                            className="btn-outline"
                                        >
                                            Browse Land
                                        </button>
                                        <button
                                            onClick={() => navigate('/farmers')}
                                            className="btn-secondary"
                                        >
                                            Hire Farmer
                                        </button>
                                        <button
                                            onClick={() => navigate('/investor/dashboard')}
                                            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md font-medium transition-colors"
                                        >
                                            Plant Tree
                                        </button>
                                    </div>
                                </div>
                            )}

                            {user?.role === 'farmer' && (
                                <div>
                                    <p className="text-gray-600 mb-4">
                                        List your farm and get funding for your crops from investors.
                                    </p>
                                    <button className="btn-primary">Add Your Farm</button>
                                </div>
                            )}
                        </div>
                    </>
                )}

                {/* Account Status */}
                <div className="mt-6 card">
                    <h3 className="text-xl font-semibold mb-4">Account Status</h3>
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <span className="text-gray-600">Email Verified</span>
                            <span className={`px-3 py-1 rounded-full text-sm ${user?.isVerified ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                {user?.isVerified ? 'Verified' : 'Not Verified'}
                            </span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-gray-600">Account Status</span>
                            <span className={`px-3 py-1 rounded-full text-sm ${user?.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                {user?.isActive ? 'Active' : 'Inactive'}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DashboardPage;
