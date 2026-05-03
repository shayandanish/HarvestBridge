import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { marketplaceService } from '../services/marketplaceService';
import { farmerService } from '../services/farmerService';
import { getMediaUrl } from '../services/api';
import { convertArea } from '../utils/unitConverter';

const HomePage = () => {
    const { isAuthenticated, user } = useAuth();
    const [lands, setLands] = useState([]);
    const [farmers, setFarmers] = useState([]);
    const [investorFarms, setInvestorFarms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const scrollToSection = (id) => {
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
        }
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const [landData, farmerData, investorFarmData] = await Promise.all([
                    marketplaceService.getVerifiedLands({ limit: 3 }),
                    farmerService.getPublicFarmers({ limit: 4 }),
                    marketplaceService.getFarms({ investorOnly: true, limit: 3 })
                ]);
                setLands(landData.lands || []);
                setFarmers(farmerData.farmers || []);
                setInvestorFarms(investorFarmData.farms || []);
            } catch (err) {
                console.error('Error fetching landing page data:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    return (
        <div className="min-h-screen bg-[#f8fafc] font-sans selection:bg-primary-300 selection:text-primary-900 overflow-x-hidden">
            
            {/* Navigation - Floating Glassmorphic */}
            <div className="fixed top-0 inset-x-0 z-50 flex justify-center p-4 pointer-events-none">
                <nav className="w-full max-w-7xl bg-white/70 backdrop-blur-xl border border-white/40 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-2xl pointer-events-auto transition-all duration-300">
                    <div className="px-6 py-3">
                        <div className="flex justify-between items-center">
                            <Link to="/" className="text-2xl font-black tracking-tighter text-slate-800 flex items-center gap-2 group">
                                <span className="text-3xl group-hover:rotate-12 transition-transform duration-300">🌱</span> 
                                Harvest<span className="text-primary-600">Bridge</span>
                            </Link>

                            {/* Mobile Menu Toggle */}
                            <button
                                className="md:hidden w-10 h-10 flex items-center justify-center rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors focus:outline-none"
                                onClick={() => setIsMenuOpen(!isMenuOpen)}
                            >
                                <span className="text-xl font-bold">{isMenuOpen ? '✕' : '☰'}</span>
                            </button>

                            {/* Desktop Navigation */}
                            <div className="hidden md:flex space-x-2 items-center">
                                {isAuthenticated ? (
                                    <div className="flex items-center gap-6 ml-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-bold border border-primary-200">
                                                {user?.fullName?.charAt(0)}
                                            </div>
                                            <span className="text-sm font-semibold text-slate-600">Hi, <span className="text-slate-900">{user?.fullName?.split(' ')[0]}</span></span>
                                        </div>
                                        <Link to="/dashboard" className="px-6 py-2.5 bg-slate-900 text-white text-sm font-bold rounded-xl hover:bg-primary-600 hover:shadow-lg hover:shadow-primary-500/20 hover:-translate-y-0.5 transition-all duration-300">
                                            Go to Dashboard
                                        </Link>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2">
                                        <Link to="/marketplace" className="px-5 py-2.5 text-sm text-slate-600 font-bold hover:text-slate-900 hover:bg-slate-50 rounded-xl transition-all">
                                            Browse Farms
                                        </Link>
                                        <Link to="/marketplace?tab=lands" className="px-5 py-2.5 text-sm text-slate-600 font-bold hover:text-slate-900 hover:bg-slate-50 rounded-xl transition-all">
                                            Browse Lands
                                        </Link>
                                        <Link to="/farmers" className="px-5 py-2.5 text-sm text-slate-600 font-bold hover:text-slate-900 hover:bg-slate-50 rounded-xl transition-all">
                                            Farmers
                                        </Link>
                                        <div className="h-6 w-px bg-slate-200 mx-2"></div>
                                        <Link to="/login" className="px-5 py-2.5 text-sm text-slate-600 font-bold hover:text-slate-900 hover:bg-slate-50 rounded-xl transition-all">
                                            Sign In
                                        </Link>
                                        <Link to="/register" className="px-6 py-2.5 bg-slate-900 text-white text-sm font-bold rounded-xl hover:bg-primary-600 hover:shadow-lg hover:shadow-primary-500/20 hover:-translate-y-0.5 transition-all duration-300">
                                            Get Started
                                        </Link>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Mobile Menu Dropdown */}
                        {isMenuOpen && (
                            <div className="md:hidden mt-4 pb-2 animate-in fade-in slide-in-from-top-4 duration-300 border-t border-slate-100 pt-4">
                                <div className="flex flex-col gap-2">
                                    {isAuthenticated ? (
                                        <>
                                            <div className="flex items-center gap-3 px-4 py-3 bg-slate-50 rounded-xl mb-2">
                                                <div className="w-10 h-10 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-bold">
                                                    {user?.fullName?.charAt(0)}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-xs text-slate-500 uppercase tracking-widest font-bold">Welcome Back</span>
                                                    <span className="text-sm font-black text-slate-800">{user?.fullName}</span>
                                                </div>
                                            </div>
                                            <Link to="/dashboard" className="w-full text-center py-3.5 bg-slate-900 text-white font-bold rounded-xl" onClick={() => setIsMenuOpen(false)}>
                                                Dashboard
                                            </Link>
                                        </>
                                    ) : (
                                        <>
                                            <Link to="/marketplace" className="px-4 py-3 text-slate-700 font-bold hover:bg-slate-50 rounded-xl" onClick={() => setIsMenuOpen(false)}>Browse Farms</Link>
                                            <Link to="/marketplace?tab=lands" className="px-4 py-3 text-slate-700 font-bold hover:bg-slate-50 rounded-xl" onClick={() => setIsMenuOpen(false)}>Browse Lands</Link>
                                            <Link to="/farmers" className="px-4 py-3 text-slate-700 font-bold hover:bg-slate-50 rounded-xl" onClick={() => setIsMenuOpen(false)}>Expert Farmers</Link>
                                            <div className="grid grid-cols-2 gap-3 mt-4">
                                                <Link to="/login" className="w-full text-center py-3 bg-white text-slate-900 font-bold border border-slate-200 rounded-xl" onClick={() => setIsMenuOpen(false)}>
                                                    Log In
                                                </Link>
                                                <Link to="/register" className="w-full text-center py-3 bg-primary-600 text-white font-bold rounded-xl shadow-lg shadow-primary-500/20" onClick={() => setIsMenuOpen(false)}>
                                                    Sign Up
                                                </Link>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </nav>
            </div>

            {/* Hero Section */}
            <div className="relative pt-40 pb-20 lg:pt-48 lg:pb-32 2xl:pt-56 overflow-hidden">
                {/* Decorative background blurs */}
                <div className="absolute top-0 right-0 w-[300px] h-[300px] md:w-[800px] md:h-[800px] bg-primary-300/20 rounded-full blur-[60px] md:blur-[120px] mix-blend-multiply pointer-events-none animate-pulse" style={{ animationDuration: '4s' }}></div>
                <div className="absolute -bottom-20 -left-20 w-[200px] h-[200px] md:w-[600px] md:h-[600px] bg-sky-200/40 rounded-full blur-[60px] md:blur-[120px] mix-blend-multiply pointer-events-none"></div>
                
                <div className="container mx-auto px-6 relative z-10 text-center">
                    
                    <h1 className="text-4xl md:text-7xl lg:text-[5.5rem] font-black text-slate-900 tracking-tighter leading-[1.05] mb-8 mx-auto max-w-5xl">
                        Invest in Agriculture.<br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-emerald-400">
                            Grow Your Future.
                        </span>
                    </h1>
                    
                    <p className="text-base md:text-2xl text-slate-500 mb-12 leading-relaxed font-medium max-w-3xl mx-auto px-4 sm:px-0">
                        We connect visionary investors with expert farmers. Support sustainable agriculture while building wealth through verified, trackable investments.
                    </p>
                    
                    <div className="flex flex-col sm:flex-row justify-center gap-4 max-w-xl mx-auto">
                        <Link to="/marketplace" className="px-8 py-4 bg-slate-900 text-white text-lg font-bold rounded-2xl hover:bg-primary-600 hover:-translate-y-1 hover:shadow-xl hover:shadow-primary-500/25 transition-all duration-300 flex-1">
                            Explore Farms
                        </Link>
                        <Link
                            to="/marketplace?tab=lands"
                            className="px-8 py-4 bg-white text-slate-800 border-2 border-slate-200 shadow-sm text-center text-lg font-bold rounded-2xl hover:border-slate-300 hover:bg-slate-50 hover:-translate-y-1 transition-all duration-300 flex-1"
                        >
                            Explore Lands
                        </Link>
                    </div>
                </div>
            </div>

            {/* Verified Lands Highlight */}
            {!loading && lands.length > 0 && (
                <div className="container mx-auto px-6 mb-32" id="lands-section">
                    <div className="flex flex-col md:flex-row justify-between items-end mb-12 border-b border-slate-200 pb-6">
                        <div className="mb-4 md:mb-0">
                            <span className="text-primary-600 font-bold uppercase tracking-widest text-xs mb-2 block">Premium Real Estate</span>
                            <h3 className="text-4xl font-black text-slate-900 tracking-tight">Verified Lands</h3>
                        </div>
                        <Link to="/marketplace?tab=lands" className="px-6 py-3 bg-white text-slate-800 text-sm font-bold border border-slate-200 shadow-sm rounded-xl hover:bg-slate-50 transition-all flex items-center gap-2 group">
                            Browse All Lands <span className="text-primary-600 group-hover:translate-x-1 transition-transform">→</span>
                        </Link>
                    </div>

                    <div className="grid lg:grid-cols-3 gap-8">
                        {lands.map((land) => {
                            let photos = [];
                            try {
                                if (land.landPhotos) {
                                    photos = typeof land.landPhotos === 'string'
                                        ? JSON.parse(land.landPhotos)
                                        : land.landPhotos;
                                }
                            } catch (e) { }

                            const primaryPhoto = photos.length > 0 ? getMediaUrl(photos[0]) : null;

                            const leasedArea = land.farms?.reduce((sum, f) => {
                                if (f.isActive === false) return sum;
                                const areaInBaseUnit = convertArea(f.totalArea, f.areaUnit || land.areaUnit, land.areaUnit);
                                return sum + Number(areaInBaseUnit || 0);
                            }, 0) || 0;
                            const availableArea = Math.max(0, Number(land.totalArea) - leasedArea);
                            const isSoldOut = availableArea <= 0.01;

                            return (
                                <div key={land.id} className={`group relative bg-white rounded-[2rem] overflow-hidden shadow-[0_4px_20px_rgb(0,0,0,0.03)] hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] transition-all duration-500 hover:-translate-y-2 border border-slate-100 flex flex-col ${isSoldOut ? 'opacity-80 grayscale-[0.2]' : ''}`}>
                                    <div className="relative h-72 overflow-hidden">
                                        {primaryPhoto ? (
                                            <img
                                                src={primaryPhoto}
                                                alt={land.landName}
                                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                                            />
                                        ) : (
                                            <div className="w-full h-full bg-slate-100 flex items-center justify-center">
                                                <span className="text-6xl text-slate-300">🏞️</span>
                                            </div>
                                        )}
                                        
                                        {/* Image Gradient Overlay */}
                                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/20 to-transparent opacity-80 group-hover:opacity-100 transition-opacity duration-300"></div>

                                        <div className="absolute top-4 right-4 flex flex-col gap-2 items-end">
                                            <span className="px-4 py-1.5 bg-white/20 backdrop-blur-md text-white border border-white/30 text-[10px] font-black uppercase tracking-widest rounded-full shadow-lg">Verified</span>
                                            {isSoldOut && (
                                                <span className="px-4 py-1.5 bg-rose-500/90 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-widest rounded-full shadow-lg">Sold Out</span>
                                            )}
                                        </div>
                                        
                                        <div className="absolute bottom-6 left-6 right-6">
                                            <h4 className="text-2xl font-black text-white mb-2 drop-shadow-md line-clamp-1">
                                                {land.landName || land.specificLocation}
                                            </h4>
                                            <div className="flex items-center gap-2">
                                                <span className="px-3 py-1 bg-white/20 backdrop-blur-md border border-white/20 text-white text-xs font-bold rounded-lg shadow-sm">
                                                    📍 {land.city}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="p-8 flex-1 flex flex-col">
                                        {land.farms?.length > 0 && land.farms[0].farmer && (
                                            <div className="mb-6 p-4 bg-slate-50 rounded-2xl flex items-center gap-4 border border-slate-100 group-hover:bg-primary-50 transition-colors">
                                                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-primary-700 font-bold overflow-hidden shadow-sm border border-slate-200">
                                                    {land.farms[0].farmer.user?.profilePhotoUrl ? (
                                                        <img src={getMediaUrl(land.farms[0].farmer.user.profilePhotoUrl)} alt="Farmer" className="w-full h-full object-cover" />
                                                    ) : (
                                                        land.farms[0].farmer.user?.fullName?.charAt(0) || 'F'
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Managed By</p>
                                                    <p className="text-sm font-bold text-slate-900 truncate">
                                                        {land.farms[0].farmer.user?.fullName}
                                                        {land.farms[0].farmer.isVerified && <span className="ml-1 text-primary-500 bg-primary-50 px-1 rounded-sm text-[10px]">VERIFIED</span>}
                                                    </p>
                                                </div>
                                            </div>
                                        )}

                                        <div className="mb-8 flex flex-wrap gap-2">
                                            {land.cultivablePlants ? (
                                                (typeof land.cultivablePlants === 'string' ? JSON.parse(land.cultivablePlants) : land.cultivablePlants).map((plant, idx) => (
                                                    <span key={idx} className="px-3 py-1 bg-green-50 text-green-700 text-[10px] font-black uppercase tracking-widest rounded-lg border border-green-100/50">
                                                        {plant}
                                                    </span>
                                                ))
                                            ) : (
                                                <span className="text-[10px] text-slate-400 italic font-medium">Multi-crop compatible</span>
                                            )}
                                        </div>

                                        <div className="mt-auto flex justify-between items-end">
                                            <div className="flex flex-col">
                                                <span className="text-[10px] uppercase tracking-widest font-bold text-slate-400 mb-1">{isSoldOut ? 'Total Area' : 'Available Area'}</span>
                                                <div className="flex items-baseline gap-1">
                                                    <span className="text-3xl font-black text-slate-900 tracking-tighter">{isSoldOut ? land.totalArea : availableArea.toFixed(1)}</span>
                                                    <span className="text-sm font-bold text-slate-500">{land.areaUnit}</span>
                                                </div>
                                            </div>
                                            {isSoldOut ? (
                                                <span className="px-6 py-3.5 bg-slate-100 text-slate-400 text-sm font-black rounded-xl">UNAVAILABLE</span>
                                            ) : (
                                                <Link
                                                    to={isAuthenticated ? `/investor/lease/${land.id}` : "/register"}
                                                    className="px-6 py-3.5 bg-slate-900 text-white text-sm font-black rounded-xl group-hover:bg-primary-600 group-hover:shadow-lg group-hover:shadow-primary-500/20 transition-all duration-300 transform"
                                                >
                                                    {land.farms?.length > 0 ? 'INVEST NOW' : 'LEASE NOW'}
                                                </Link>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Verified Farmers Section */}
            {!loading && farmers.length > 0 && (
                <div className="container mx-auto px-6 mb-32">
                    <div className="flex flex-col md:flex-row justify-between items-end mb-12 border-b border-slate-200 pb-6">
                        <div className="mb-4 md:mb-0">
                            <span className="text-primary-600 font-bold uppercase tracking-widest text-xs mb-2 block">The Best in the Field</span>
                            <h3 className="text-4xl font-black text-slate-900 tracking-tight">Expert Farmers</h3>
                        </div>
                        <Link to="/farmers" className="px-6 py-3 bg-white text-slate-800 text-sm font-bold border border-slate-200 shadow-sm rounded-xl hover:bg-slate-50 transition-all flex items-center gap-2 group">
                            Directory <span className="text-primary-600 group-hover:translate-x-1 transition-transform">→</span>
                        </Link>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {farmers.map((farmer) => (
                            <div key={farmer.id} className="group bg-white rounded-[2rem] p-8 shadow-[0_4px_20px_rgb(0,0,0,0.03)] hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] transition-all duration-500 hover:-translate-y-2 border border-slate-100 flex flex-col items-center text-center relative overflow-hidden">
                                {/* Subtle background element on hover */}
                                <div className="absolute inset-0 bg-gradient-to-b from-primary-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
                                
                                <div className="relative mb-6 z-10">
                                    <div className="w-24 h-24 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 font-bold overflow-hidden border-4 border-white shadow-xl group-hover:scale-105 transition-transform duration-500">
                                        {farmer.user?.profilePhotoUrl ? (
                                            <img src={getMediaUrl(farmer.user.profilePhotoUrl)} alt={farmer.user.fullName} className="w-full h-full object-cover" />
                                        ) : (
                                            <span className="text-3xl text-slate-400">{farmer.user?.fullName?.charAt(0)}</span>
                                        )}
                                    </div>
                                    <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-primary-500 rounded-full border-4 border-white flex items-center justify-center text-white text-[10px] font-black group-hover:rotate-12 transition-transform shadow-md">
                                        ✓
                                    </div>
                                </div>
                                
                                <h4 className="text-xl font-black text-slate-900 mb-1 relative z-10">
                                    {farmer.user?.fullName}
                                </h4>
                                <p className="text-primary-600 text-[10px] font-black uppercase tracking-widest mb-6 relative z-10 bg-primary-50 px-3 py-1 rounded-full">
                                    {farmer.specialization || 'Agriculture'}
                                </p>
                                
                                <div className="w-full pt-6 border-t border-slate-100 flex justify-between items-center px-4 relative z-10">
                                    <div className="flex flex-col items-start gap-1">
                                        <span className="text-xl font-black text-slate-900 leading-none">{farmer.experienceYears}<span className="text-primary-500">+</span></span>
                                        <span className="text-[9px] uppercase font-bold tracking-widest text-slate-400">Exp. Years</span>
                                    </div>
                                    <div className="h-8 w-px bg-slate-100"></div>
                                    <div className="flex flex-col items-end gap-1">
                                        <span className="text-xl font-black text-slate-900 leading-none"><span className="text-amber-400 mr-1 text-sm">★</span>{farmer.rating || '5.0'}</span>
                                        <span className="text-[9px] uppercase font-bold tracking-widest text-slate-400">Rating</span>
                                    </div>
                                </div>
                                
                                <Link
                                    to={`/farmers/${farmer.id}`}
                                    className="mt-8 w-full py-3.5 bg-slate-50 text-slate-700 text-xs font-black uppercase tracking-widest rounded-xl hover:bg-slate-900 hover:text-white transition-all border border-slate-200 hover:border-slate-900 shadow-sm relative z-10"
                                >
                                    Profile view
                                </Link>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Investor Showcase (Dark Section) */}
            {!loading && investorFarms.length > 0 && (
                <div className="px-4 md:px-8 mb-32" id="investor-showcase">
                    <div className="max-w-[1400px] mx-auto bg-slate-900 rounded-[3rem] p-10 md:p-20 text-white relative overflow-hidden shadow-2xl">
                        {/* Abstract background shapes */}
                        <div className="absolute top-0 right-0 w-[300px] h-[300px] md:w-[600px] md:h-[600px] bg-primary-600/20 blur-[60px] md:blur-[100px] rounded-full -mr-24 -mt-24 md:-mr-48 md:-mt-48 pointer-events-none"></div>
                        <div className="absolute bottom-0 left-0 w-[250px] h-[250px] md:w-[500px] md:h-[500px] bg-sky-500/10 blur-[60px] md:blur-[100px] rounded-full -ml-24 -mb-24 md:-ml-48 md:-mb-48 pointer-events-none"></div>
                        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMiIgY3k9IjIiIHI9IjIiIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSIvPjwvc3ZnPg==')] opacity-50 mask-image:linear-gradient(to_bottom,white,transparent)"></div>

                        <div className="relative z-10 text-center max-w-3xl mx-auto mb-16">
                            <span className="px-4 py-1.5 bg-primary-500/10 border border-primary-500/20 text-primary-300 text-[10px] font-black uppercase tracking-widest rounded-full mb-6 inline-block">
                                Proven Results
                            </span>
                            <h3 className="text-4xl md:text-6xl font-black mb-6 tracking-tight leading-[1.1]">
                                Real Investors.<br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-green-300">
                                    Real Growth.
                                </span>
                            </h3>
                            <p className="text-slate-400 text-lg font-medium">
                                See how our community is transforming empty lands into thriving, profitable green assets.
                            </p>
                        </div>

                        <div className="grid md:grid-cols-3 gap-6 relative z-10">
                            {investorFarms.map((farm) => (
                                <div key={farm.id} className="bg-slate-800/50 backdrop-blur-xl rounded-3xl p-8 border border-white/10 hover:bg-slate-800 hover:border-white/20 transition-all duration-300 group">
                                    <div className="flex items-center gap-4 mb-8">
                                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-500 to-emerald-600 flex items-center justify-center text-2xl shadow-lg shadow-primary-500/20 border border-white/10 group-hover:scale-110 transition-transform duration-300">
                                            🪴
                                        </div>
                                        <div>
                                            <h4 className="font-black text-xl text-white truncate max-w-[160px]">{farm.farmName}</h4>
                                            <p className="text-[10px] text-primary-300 font-bold uppercase tracking-widest">{farm.land?.city}</p>
                                        </div>
                                    </div>

                                    <div className="space-y-4 mb-8">
                                        <div className="flex justify-between items-center py-2 border-b border-white/5">
                                            <span className="text-slate-400 text-sm font-medium">Farm Scale</span>
                                            <span className="font-bold text-white tracking-tight">{farm.totalArea} {farm.areaUnit}</span>
                                        </div>
                                        <div className="flex justify-between items-center py-2 border-b border-white/5">
                                            <span className="text-slate-400 text-sm font-medium">Head Farmer</span>
                                            <span className="font-bold text-white">{farm.farmer?.user?.fullName?.split(' ')[0] || 'Expert'}</span>
                                        </div>
                                        <div className="flex justify-between items-center py-2">
                                            <span className="text-slate-400 text-sm font-medium">Status</span>
                                            <span className="px-3 py-1 bg-green-500/20 text-green-300 text-[10px] font-black uppercase tracking-widest rounded-full border border-green-500/30 flex items-center gap-1.5">
                                                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></span>
                                                Active
                                            </span>
                                        </div>
                                    </div>

                                    <Link
                                        to={`/marketplace/farms/${farm.id}`}
                                        className="w-full py-3.5 bg-white/5 text-white text-xs font-black rounded-xl hover:bg-white text-center uppercase tracking-widest hover:text-slate-900 transition-all duration-300 block border border-white/10 hover:border-transparent"
                                    >
                                        View Timeline
                                    </Link>
                                </div>
                            ))}
                        </div>

                        <div className="mt-20 text-center relative z-10 flex flex-col items-center">
                            <Link to="/register?role=investor" className="px-10 py-5 bg-white text-slate-900 text-sm md:text-base font-black uppercase tracking-widest rounded-2xl hover:scale-105 transition-all shadow-[0_0_40px_rgba(255,255,255,0.2)]">
                                Build Your Portfolio
                            </Link>
                            <p className="mt-6 text-slate-400 text-sm font-medium">
                                Join hundreds of investors securely farming online.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Bento Box Features */}
            <div className="container mx-auto px-6 mb-32">
                <div className="text-center mb-16">
                    <h3 className="text-4xl font-black text-slate-900 tracking-tight">One Platform.<br/><span className="text-primary-600">Three Ways to Grow.</span></h3>
                </div>
                
                <div className="grid md:grid-cols-3 gap-6">
                    {/* Investor Box */}
                    <div className="bg-white rounded-[2.5rem] p-10 shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-slate-100 relative overflow-hidden group hover:border-amber-200 transition-colors">

                        <div className="w-16 h-16 bg-amber-100 rounded-2xl flex items-center justify-center mb-8 border border-amber-200/50 relative z-10 group-hover:-translate-y-2 transition-transform duration-300">
                            <svg className="w-8 h-8 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                        </div>
                        <h3 className="text-2xl font-black text-slate-900 mb-4 relative z-10">For Investors</h3>
                        <p className="text-slate-500 font-medium leading-relaxed relative z-10">
                            Invest in physical, individual plants. Track their growth in real-time with photo evidence, and earn transparent returns from seasonal harvests.
                        </p>
                    </div>

                    {/* Farmer Box */}
                    <div className="bg-white rounded-[2.5rem] p-10 shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-slate-100 relative overflow-hidden group hover:border-primary-200 transition-colors">

                        <div className="w-16 h-16 bg-primary-100 rounded-2xl flex items-center justify-center mb-8 border border-primary-200/50 relative z-10 group-hover:-translate-y-2 transition-transform duration-300">
                            <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"/></svg>
                        </div>
                        <h3 className="text-2xl font-black text-slate-900 mb-4 relative z-10">For Farmers</h3>
                        <p className="text-slate-500 font-medium leading-relaxed relative z-10">
                            Access zero-collateral funding instantly. Get hired to manage lands, focus purely on cultivation, and earn a steady income for your expertise.
                        </p>
                    </div>

                    {/* Landowner Box */}
                    <div className="bg-white rounded-[2.5rem] p-10 shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-slate-100 relative overflow-hidden group hover:border-sky-200 transition-colors">

                        <div className="w-16 h-16 bg-sky-100 rounded-2xl flex items-center justify-center mb-8 border border-sky-200/50 relative z-10 group-hover:-translate-y-2 transition-transform duration-300">
                            <svg className="w-8 h-8 text-sky-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.242-4.243a8 8 0 1111.314 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                        </div>
                        <h3 className="text-2xl font-black text-slate-900 mb-4 relative z-10">For Landowners</h3>
                        <p className="text-slate-500 font-medium leading-relaxed relative z-10">
                            Stop letting your land sit idle. Partner with verified agricultural experts securely and turn empty acreage into a reliable, green income stream.
                        </p>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="border-t border-slate-200/60 mt-16 pb-12 pt-10">
                <div className="container mx-auto px-6">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-slate-500 text-sm font-medium">
                        <div className="flex items-center gap-2">
                            <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"/></svg>
                            <span className="font-bold text-slate-900 tracking-tight">Harvest<span className="text-primary-600">Bridge</span></span>
                        </div>
                        <div className="text-slate-400">
                            &copy; {new Date().getFullYear()} All rights reserved. Harvesting the future.
                        </div>
                    </div>
                </div>
            </div>
            
        </div>
    );
};

export default HomePage;
