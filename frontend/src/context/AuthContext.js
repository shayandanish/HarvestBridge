import React, { createContext, useState, useContext, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Check if user is logged in on mount
    useEffect(() => {
        const token = localStorage.getItem('accessToken');
        if (token) {
            loadUser();
        } else {
            setLoading(false);
        }
    }, []);

    const loadUser = async () => {
        try {
            const response = await authAPI.getProfile();
            // Unwrap response.data (actual user object) from the backend's standard response format
            const userData = response.data?.data || response.data || response;
            setUser(userData);
            setError(null);
        } catch (err) {
            console.error('Failed to load user:', err);
            if (err.response?.status === 401) {
                localStorage.removeItem('accessToken');
                localStorage.removeItem('refreshToken');
            }
        } finally {
            setLoading(false);
        }
    };

    const login = async (email, password) => {
        try {
            setError(null);
            const response = await authAPI.login({ email, password });

            localStorage.setItem('accessToken', response.data.accessToken);
            localStorage.setItem('refreshToken', response.data.refreshToken);
            setUser(response.data.user);

            return { success: true };
        } catch (err) {
            let message = err.response?.data?.message || err.message || 'Login failed';
            if (err.response?.data?.errors && Array.isArray(err.response.data.errors)) {
                message = err.response.data.errors.map(e => e.message).join(', ');
            }
            setError(message);
            return { success: false, error: message };
        }
    };

    const register = async (userData) => {
        try {
            setError(null);
            const response = await authAPI.register(userData);

            localStorage.setItem('accessToken', response.data.accessToken);
            localStorage.setItem('refreshToken', response.data.refreshToken);
            setUser(response.data.user);

            return { success: true };
        } catch (err) {
            let message = err.response?.data?.message || err.message || 'Registration failed';
            if (err.response?.data?.errors && Array.isArray(err.response.data.errors)) {
                message = err.response.data.errors.map(e => e.message).join(', ');
            }
            setError(message);
            return { success: false, error: message };
        }
    };

    const logout = () => {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        setUser(null);
    };

    const updateUser = async (userData) => {
        try {
            setError(null);
            const response = await authAPI.updateProfile(userData);
            setUser(response.data);
            return { success: true };
        } catch (err) {
            let message = err.response?.data?.message || err.message || 'Update failed';
            if (err.response?.data?.errors && Array.isArray(err.response.data.errors)) {
                message = err.response.data.errors.map(e => e.message).join(', ');
            }
            setError(message);
            return { success: false, error: message };
        }
    };

    const value = {
        user,
        loading,
        error,
        login,
        register,
        logout,
        updateUser,
        isAuthenticated: !!user,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
