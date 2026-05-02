import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './AdminLogin.css';

const AdminLogin = () => {
    const [credentials, setCredentials] = useState({ email: '', password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleChange = (e) => {
        setCredentials({ ...credentials, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await axios.post(`${process.env.REACT_APP_API_URL || 'http://localhost:5000/api/v1'}/auth/login`, credentials);

            const { user, accessToken } = response.data.data;

            if (user.role !== 'admin') {
                setError('Access denied. Admin privileges required.');
                setLoading(false);
                return;
            }

            localStorage.setItem('token', accessToken);
            localStorage.setItem('user', JSON.stringify(user));

            navigate('/admin/dashboard');
        } catch (err) {
            setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="admin-login-container">
            <div className="admin-login-card">
                <div className="admin-login-header">
                    <img src="/logo-admin.png" alt="Agro Platform" className="admin-logo" />
                    <h1>Admin Control Center</h1>
                    <p>Secure access for platform administrators</p>
                </div>

                {error && <div className="admin-login-error">{error}</div>}

                <form onSubmit={handleSubmit} className="admin-login-form">
                    {localStorage.getItem('token') && JSON.parse(localStorage.getItem('user'))?.role === 'admin' ? (
                        <div className="admin-already-logged">
                            <p>You are already logged in as administrator.</p>
                            <button
                                type="button"
                                className="admin-login-btn"
                                onClick={() => navigate('/admin/dashboard')}
                            >
                                Enter Admin Dashboard
                            </button>
                        </div>
                    ) : (
                        <>
                            <div className="form-group">
                                <label htmlFor="email">Administrator Email</label>
                                <input
                                    type="email"
                                    id="email"
                                    name="email"
                                    value={credentials.email}
                                    onChange={handleChange}
                                    placeholder="admin@agroplant.com"
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="password">Password</label>
                                <input
                                    type="password"
                                    id="password"
                                    name="password"
                                    value={credentials.password}
                                    onChange={handleChange}
                                    placeholder="••••••••"
                                    required
                                />
                            </div>

                            <button type="submit" disabled={loading} className="admin-login-btn">
                                {loading ? 'Authenticating...' : 'Sign In to Dashboard'}
                            </button>
                        </>
                    )}

                    <div className="login-actions">
                        <button
                            type="button"
                            className="admin-back-btn"
                            onClick={() => navigate('/dashboard')}
                        >
                            <i className="fas fa-arrow-left"></i> Back to Previous Dashboard
                        </button>
                    </div>
                </form>

                <div className="admin-login-footer">
                    <p>&copy; 2026 Agro-Investment Platform. All rights reserved.</p>
                </div>
            </div>
        </div>
    );
};

export default AdminLogin;
