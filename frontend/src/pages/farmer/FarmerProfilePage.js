import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { farmerService } from '../../services/farmerService';
import { authAPI, getMediaUrl } from '../../services/api';
import { compressImage } from '../../utils/imageUtils';
import './FarmerProfilePage.css';

const SERVICES_OPTIONS = [
    'Watering', 'Grafting', 'Pruning', 'Fertilizing',
    'Harvesting', 'Pest Control', 'Irrigation', 'Planting', 'Nurturing',
];

export default function FarmerProfilePage() {
    const navigate = useNavigate();
    const fileRef = useRef();

    const [profile, setProfile] = useState(null);
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState(null);
    const [photoPreview, setPhotoPreview] = useState(null);
    const [photoFile, setPhotoFile] = useState(null);

    const [form, setForm] = useState({
        fullName: '',
        phone: '',
        age: '',
        location: '',
        bio: '',
        experienceYears: '',
        specialization: '',
        chargesPerTask: '',
        services: [],
        isProfilePublic: true,
        // Bank details
        bankAccountName: '',
        bankAccountNumber: '',
        bankName: '',
        bankBranch: '',
    });

    const load = async () => {
        try {
            setLoading(true);
            const meRes = await authAPI.getProfile();
            const userData = meRes?.data?.user || meRes?.data || meRes?.user || meRes;
            setUser(userData);

            const pRes = await farmerService.getMyProfile();
            const p = pRes?.data?.data || pRes?.data || pRes;
            if (p && p.id) {
                const formData = {
                    fullName: userData?.fullName || '',
                    phone: userData?.phone || '',
                    age: p.age?.toString() ?? '',
                    location: p.location?.toString() ?? '',
                    bio: p.bio?.toString() ?? '',
                    experienceYears: p.experienceYears?.toString() ?? '',
                    specialization: p.specialization?.toString() ?? '',
                    chargesPerTask: p.chargesPerTask?.toString() ?? '',
                    services: Array.isArray(p.services) ? p.services : (p.services ? JSON.parse(p.services) : []),
                    isProfilePublic: p.isProfilePublic !== undefined ? p.isProfilePublic : true,
                    bankAccountName: p.bankAccountName?.toString() ?? '',
                    bankAccountNumber: p.bankAccountNumber?.toString() ?? '',
                    bankName: p.bankName?.toString() ?? '',
                    bankBranch: p.bankBranch?.toString() ?? '',
                };

                setProfile(p);
                setForm(formData);
            } else {
                setForm({
                    fullName: userData?.fullName || '',
                    phone: userData?.phone || '',
                    age: '',
                    location: '',
                    bio: '',
                    experienceYears: '',
                    specialization: '',
                    chargesPerTask: '',
                    services: [],
                    isProfilePublic: true,
                    bankAccountName: '',
                    bankAccountNumber: '',
                    bankName: '',
                    bankBranch: '',
                });
            }
        } catch (error) {
            console.error('Error loading profile:', error);
            if (error.response?.status === 401) {
                alert('Your session has expired. Please log in again.');
                navigate('/login');
                return;
            }
            setForm({
                fullName: '',
                phone: '',
                age: '',
                location: '',
                bio: '',
                experienceYears: '',
                specialization: '',
                chargesPerTask: '',
                services: [],
                isProfilePublic: true,
                bankAccountName: '',
                bankAccountNumber: '',
                bankName: '',
                bankBranch: '',
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
    }, []);

    const showToast = (msg, type = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3500);
    };

    const toggleService = (svc) => {
        setForm(prev => ({
            ...prev,
            services: prev.services.includes(svc)
                ? prev.services.filter(s => s !== svc)
                : [...prev.services, svc],
        }));
    };

    const handlePhotoChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setPhotoFile(file);
        setPhotoPreview(URL.createObjectURL(file));
    };

    const handleSave = async (e) => {
        if (e) e.preventDefault();
        setSaving(true);
        try {
            const locationStr = form.location?.toString().trim();
            if (!locationStr || locationStr.length === 0) {
                throw new Error('Please enter your location');
            }

            if (!form.age || form.age < 18 || form.age > 90) {
                throw new Error('Please enter a valid age between 18 and 90');
            }

            const bioStr = form.bio?.toString().trim();
            if (!bioStr || bioStr.length === 0) {
                throw new Error('Please enter a bio about yourself');
            }

            if (!form.experienceYears || form.experienceYears < 0 || form.experienceYears > 60) {
                throw new Error('Please enter valid experience years');
            }

            const specializationStr = form.specialization?.toString().trim();
            if (!specializationStr || specializationStr.length === 0) {
                throw new Error('Please enter your specialization');
            }

            if (!form.chargesPerTask || form.chargesPerTask < 0) {
                throw new Error('Please enter valid charges per task');
            }

            if (!form.services || form.services.length === 0) {
                throw new Error('Please select at least one service you offer');
            }

            if (form.bankAccountName && !form.bankAccountNumber) {
                throw new Error('Please provide bank account number');
            }
            if (form.bankAccountNumber && !form.bankAccountName) {
                throw new Error('Please provide bank account name');
            }

            if (photoFile) {
                const compressedFile = await compressImage(photoFile);
                const fd = new FormData();
                fd.append('photo', compressedFile);
                await authAPI.uploadPhoto(fd);
            }

            if (form.fullName !== user?.fullName || form.phone !== user?.phone) {
                await authAPI.updateProfile({
                    fullName: form.fullName,
                    phone: form.phone
                });
            }

            const profileData = { ...form };
            delete profileData.fullName;
            delete profileData.phone;

            if (form.experienceYears) profileData.experienceYears = parseInt(form.experienceYears);
            if (form.chargesPerTask) profileData.chargesPerTask = parseFloat(form.chargesPerTask);
            if (form.age) profileData.age = parseInt(form.age);
            
            profileData.services = form.services && form.services.length > 0 ? form.services : [];

            await farmerService.updateProfile(profileData);
            showToast('Profile updated successfully! 🌿');
            await load();
        } catch (err) {
            let errorMessage = err.response?.data?.message || err.response?.data?.error || err.message || 'Failed to save profile';
            showToast(errorMessage, 'error');
        } finally {
            setSaving(false);
        }
    };

    const avatarUrl = photoPreview
        || getMediaUrl(user?.profilePhotoUrl)
        || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.fullName || 'F')}&background=10b981&color=fff&size=128&bold=true`;

    if (loading) {
        return (
            <div className="state-container">
                <span className="modern-loader"></span>
                <p style={{ color: '#64748b', marginTop: 20, fontWeight: 500 }}>Preparing your profile dashboard...</p>
            </div>
        );
    }

    return (
        <div className="farmer-profile-mgmt animate-up">
            {/* Toast Notifications */}
            {toast && (
                <div className="mgmt-toast" style={{ background: toast.type === 'error' ? '#ef4444' : '#10b981' }}>
                    <i className={`fas fa-${toast.type === 'error' ? 'exclamation-triangle' : 'check-circle'}`} style={{ marginRight: 10 }}></i>
                    {toast.msg}
                </div>
            )}

            {/* Header Area */}
            <div className="mgmt-header">
                <button className="mgmt-back-btn" onClick={() => navigate(-1)}>
                    <i className="fas fa-arrow-left"></i> Back
                </button>
                <div className="mgmt-title-group">
                    <h1>My Professional Profile</h1>
                    <p className="mgmt-subtitle">Manage your expert identity and service offerings</p>
                </div>
            </div>

            {/* Verification Status Banner */}
            {profile && (
                <div className="status-banner-mgmt">
                    {profile.isVerified ? (
                        <div className="banner-card verified">
                            <i className="fas fa-check-circle banner-icon"></i>
                            <div className="banner-text">
                                <h3>Expert Profile Verified</h3>
                                <p>Your profile is fully visible in the expert directory and open for hiring requests.</p>
                            </div>
                        </div>
                    ) : profile.rejectionReason ? (
                        <div className="banner-card rejected">
                            <i className="fas fa-times-circle banner-icon"></i>
                            <div className="banner-text">
                                <h3>Improvement Needed</h3>
                                <p>Admin Feedback: <strong>{profile.rejectionReason}</strong>. Please update and save to resubmit.</p>
                            </div>
                        </div>
                    ) : (
                        <div className="banner-card pending">
                            <i className="fas fa-clock banner-icon"></i>
                            <div className="banner-text">
                                <h3>Verification in Progress</h3>
                                <p>Your details are being reviewed by our team. You'll appear in the directory once approved.</p>
                            </div>
                        </div>
                    )}
                </div>
            )}

            <form onSubmit={handleSave} className="mgmt-form">
                {/* Visual Identity Section */}
                <div className="mgmt-card">
                    <h2 className="mgmt-card-title">
                        <i className="fas fa-camera"></i>
                        Profile Presentation
                    </h2>
                    <div className="mgmt-photo-row">
                        <img src={avatarUrl} alt="avatar" className="mgmt-avatar-preview" />
                        <div className="mgmt-photo-controls">
                            <button type="button" className="mgmt-upload-btn" onClick={() => fileRef.current.click()}>
                                <i className="fas fa-upload"></i> Upload New Photo
                            </button>
                            <p style={{ color: '#94a3b8', fontSize: 13, marginTop: 10 }}>Recommended: Square JPG/PNG, max 5MB</p>
                        </div>
                    </div>
                    <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handlePhotoChange} />
                </div>

                {/* Core Personal Details */}
                <div className="mgmt-card">
                    <h2 className="mgmt-card-title">
                        <i className="fas fa-user"></i>
                        Personal Information
                    </h2>
                    <div className="mgmt-grid">
                        <div className="mgmt-field-group">
                            <label className="mgmt-label">Full Professional Name</label>
                            <input className="mgmt-input"
                                value={form.fullName}
                                onChange={e => setForm(p => ({ ...p, fullName: e.target.value }))} />
                        </div>
                        <div className="mgmt-field-group">
                            <label className="mgmt-label">Your Age</label>
                            <input className="mgmt-input" type="number" min={18} max={90}
                                placeholder="35"
                                value={form.age}
                                onChange={e => setForm(p => ({ ...p, age: e.target.value }))} />
                        </div>
                        <div className="mgmt-field-group">
                            <label className="mgmt-label">Direct Contact Number</label>
                            <input className="mgmt-input"
                                value={form.phone}
                                onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} />
                        </div>
                        <div className="mgmt-field-group">
                            <label className="mgmt-label">Official Email (Disabled)</label>
                            <input className="mgmt-input" style={{ opacity: 0.6, cursor: 'not-allowed' }}
                                value={user?.email || ''} readOnly />
                        </div>
                    </div>
                    <div className="mgmt-field-group" style={{ marginTop: 24 }}>
                        <label className="mgmt-label">Primary Service Area (City, District)</label>
                        <input className="mgmt-input" placeholder="e.g. Multan, Punjab"
                            value={form.location}
                            onChange={e => setForm(p => ({ ...p, location: e.target.value }))} />
                    </div>
                    <div className="mgmt-field-group" style={{ marginTop: 24 }}>
                        <label className="mgmt-label">Professional Bio / Introduction</label>
                        <textarea className="mgmt-textarea"
                            placeholder="Briefly describe your farming expertise and passion for plant care…"
                            value={form.bio}
                            onChange={e => setForm(p => ({ ...p, bio: e.target.value }))} />
                    </div>
                </div>

                {/* Expertise & Value */}
                <div className="mgmt-card">
                    <h2 className="mgmt-card-title">
                        <i className="fas fa-award"></i>
                        Expertise Details
                    </h2>
                    <div className="mgmt-grid">
                        <div className="mgmt-field-group">
                            <label className="mgmt-label">Years of Experience</label>
                            <input className="mgmt-input" type="number" min={0} max={60}
                                placeholder="10"
                                value={form.experienceYears}
                                onChange={e => setForm(p => ({ ...p, experienceYears: e.target.value }))} />
                        </div>
                        <div className="mgmt-field-group">
                            <label className="mgmt-label">Service Charge per Task (PKR)</label>
                            <input className="mgmt-input" type="number" min={0}
                                placeholder="2500"
                                value={form.chargesPerTask}
                                onChange={e => setForm(p => ({ ...p, chargesPerTask: e.target.value }))} />
                        </div>
                    </div>
                    <div className="mgmt-field-group" style={{ marginTop: 24 }}>
                        <label className="mgmt-label">Primary Specialization</label>
                        <input className="mgmt-input" placeholder="e.g. Citrus Trees, Organic Fertilization"
                            value={form.specialization}
                            onChange={e => setForm(p => ({ ...p, specialization: e.target.value }))} />
                    </div>
                </div>

                {/* Capabilities */}
                <div className="mgmt-card">
                    <h2 className="mgmt-card-title">
                        <i className="fas fa-concierge-bell"></i>
                        Select Your Services
                    </h2>
                    <p style={{ color: '#64748b', fontSize: 14, marginBottom: 20 }}>
                        Investors find you based on these tags. Choose all that apply.
                    </p>
                    <div className="mgmt-chips-wrap">
                        {SERVICES_OPTIONS.map(svc => {
                            const active = form.services.includes(svc);
                            return (
                                <button
                                    key={svc}
                                    type="button"
                                    onClick={() => toggleService(svc)}
                                    className={`mgmt-chip ${active ? 'active' : ''}`}
                                >
                                    {svc}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Financial Security */}
                <div className="mgmt-card">
                    <h2 className="mgmt-card-title">
                        <i className="fas fa-university"></i>
                        Financial Information
                    </h2>
                    <p style={{ color: '#64748b', fontSize: 14, marginBottom: 20 }}>
                        Required for secure payouts from completed hiring tasks.
                    </p>
                    <div className="mgmt-grid">
                        <div className="mgmt-field-group">
                            <label className="mgmt-label">Account Holder Title</label>
                            <input className="mgmt-input"
                                placeholder="Official Name"
                                value={form.bankAccountName}
                                onChange={e => setForm(p => ({ ...p, bankAccountName: e.target.value }))} />
                        </div>
                        <div className="mgmt-field-group">
                            <label className="mgmt-label">Account / IBAN Number</label>
                            <input className="mgmt-input"
                                placeholder="0000 0000 0000"
                                value={form.bankAccountNumber}
                                onChange={e => setForm(p => ({ ...p, bankAccountNumber: e.target.value }))} />
                        </div>
                        <div className="mgmt-field-group">
                            <label className="mgmt-label">Bank Name</label>
                            <input className="mgmt-input"
                                placeholder="e.g. HBL"
                                value={form.bankName}
                                onChange={e => setForm(p => ({ ...p, bankName: e.target.value }))} />
                        </div>
                        <div className="mgmt-field-group">
                            <label className="mgmt-label">Branch Details</label>
                            <input className="mgmt-input"
                                placeholder="Branch Code or Name"
                                value={form.bankBranch}
                                onChange={e => setForm(p => ({ ...p, bankBranch: e.target.value }))} />
                        </div>
                    </div>
                </div>

                {/* Privacy & State */}
                <div className="mgmt-card">
                    <div className="mgmt-switch-group">
                        <input
                            className="mgmt-checkbox"
                            type="checkbox"
                            id="isPublic"
                            checked={form.isProfilePublic}
                            onChange={e => setForm(p => ({ ...p, isProfilePublic: e.target.checked }))}
                        />
                        <label htmlFor="isPublic" className="mgmt-switch-info" style={{ cursor: 'pointer' }}>
                            <h4>Discovery Status</h4>
                            <p>When enabled, your profile appears in the public expert directory for all investors.</p>
                        </label>
                    </div>
                </div>

                {/* Save Section */}
                <div className="mgmt-save-bar">
                    <button type="submit" className="mgmt-save-btn" disabled={saving}>
                        <i className={`fas fa-${saving ? 'spinner fa-spin' : 'save'}`}></i>
                        {saving ? 'Synchronizing Profile...' : 'Finalize & Save Profile'}
                    </button>
                </div>
            </form>
        </div>
    );
}
