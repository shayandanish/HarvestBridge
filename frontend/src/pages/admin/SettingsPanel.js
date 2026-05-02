import React, { useState, useEffect } from 'react';
import { authAPI } from '../../services/api';
import './SettingsPanel.css';

const SettingsPanel = () => {
    const [profile, setProfile] = useState({
        fullName: '',
        phone: '',
        profilePhotoUrl: ''
    });
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [platformSettings, setPlatformSettings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [profileRes, settingsRes] = await Promise.all([
                authAPI.getProfile(),
                authAPI.getPlatformSettings ? authAPI.getPlatformSettings() : Promise.resolve({ data: [] })
            ]);
            
            setProfile({
                fullName: profileRes.data.fullName || '',
                phone: profileRes.data.phone || '',
                profilePhotoUrl: profileRes.data.profilePhotoUrl || ''
            });
            
            if (settingsRes && settingsRes.data) {
                setPlatformSettings(settingsRes.data);
            }
        } catch (err) {
            setError('Failed to fetch account settings');
        } finally {
            setLoading(false);
        }
    };

    const handleProfileUpdate = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        try {
            await authAPI.updateProfile(profile);
            setSuccess('Profile updated successfully');
            // Update local storage if needed
            const user = JSON.parse(localStorage.getItem('user'));
            localStorage.setItem('user', JSON.stringify({ ...user, ...profile }));
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to update profile');
        }
    };

    const handlePasswordChange = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (passwordData.newPassword !== passwordData.confirmPassword) {
            return setError('Passwords do not match');
        }

        try {
            await authAPI.changePassword({
                currentPassword: passwordData.currentPassword,
                newPassword: passwordData.newPassword
            });
            setSuccess('Password changed successfully');
            setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to change password');
        }
    };

    if (loading) return <div className="settings-loading">Loading settings...</div>;

    return (
        <div className="settings-container">
            <div className="settings-header">
                <h2>Account Settings</h2>
                <p>Manage your admin profile and security</p>
            </div>

            {error && <div className="settings-error">{error}</div>}
            {success && <div className="settings-success">{success}</div>}

            <div className="settings-grid">
                {/* Profile Section */}
                <section className="settings-card">
                    <div className="card-header">
                        <i className="fas fa-user-circle"></i>
                        <h3>Admin Profile</h3>
                    </div>
                    <form onSubmit={handleProfileUpdate}>
                        <div className="form-group">
                            <label>Full Name</label>
                            <input
                                type="text"
                                value={profile.fullName}
                                onChange={(e) => setProfile({ ...profile, fullName: e.target.value })}
                                placeholder="Enter your full name"
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label>Phone Number</label>
                            <input
                                type="tel"
                                value={profile.phone}
                                onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                                placeholder="Enter phone number"
                            />
                        </div>
                        <button type="submit" className="save-btn">Update Profile</button>
                    </form>
                </section>

                {/* Password Section */}
                <section className="settings-card">
                    <div className="card-header">
                        <i className="fas fa-shield-alt"></i>
                        <h3>Security</h3>
                    </div>
                    <form onSubmit={handlePasswordChange}>
                        <div className="form-group">
                            <label>Current Password</label>
                            <input
                                type="password"
                                value={passwordData.currentPassword}
                                onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label>New Password</label>
                            <input
                                type="password"
                                value={passwordData.newPassword}
                                onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label>Confirm New Password</label>
                            <input
                                type="password"
                                value={passwordData.confirmPassword}
                                onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                                required
                            />
                        </div>
                        <button type="submit" className="save-btn">Change Password</button>
                    </form>
                </section>
            </div>

            {/* Platform Settings Section (Retained) */}
            <div className="platform-config-section">
                <div className="settings-header">
                    <h2>Platform Configuration</h2>
                    <p>Global system constants and operational parameters</p>
                </div>
                <div className="settings-card">
                    {platformSettings.length > 0 ? (
                        <div className="settings-list">
                            {/* Render platform settings here if any */}
                            {platformSettings.map(setting => (
                                <div key={setting.id} className="platform-setting-item">
                                    <span>{setting.settingKey}</span>
                                    <span>{setting.settingValue}</span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="empty-settings">
                            <i className="fas fa-database"></i>
                            <p>No platform settings found in database</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SettingsPanel;
