import React, { useState, useEffect, useRef } from 'react';
import { Outlet, Navigate, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import { adminService } from '../../services/adminService';
import { formatDistanceToNow } from 'date-fns';
import './AdminLayout.css';

const AdminLayout = () => {
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem('user'));
    const token = localStorage.getItem('token');
    
    const [notifications, setNotifications] = useState([]);
    const [showNotifs, setShowNotifs] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        if (token && user && user.role === 'admin') {
            fetchNotifications();
            
            // Set up polling for new notifications
            const interval = setInterval(fetchNotifications, 60000);
            return () => clearInterval(interval);
        }
    }, [token]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setShowNotifs(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const fetchNotifications = async () => {
        try {
            const response = await adminService.getNotifications();
            setNotifications(response.data);
        } catch (err) {
            console.error('Failed to fetch notifications');
        }
    };

    const handleMarkAsRead = async (id) => {
        try {
            await adminService.markNotificationAsRead(id);
            setNotifications(notifications.map(n => n.id === id ? { ...n, isRead: true } : n));
        } catch (err) {
            console.error('Failed to mark notification as read');
        }
    };

    if (!token || !user || user.role !== 'admin') {
        return <Navigate to="/admin/login" replace />;
    }

    const unreadCount = notifications.filter(n => !n.isRead).length;

    return (
        <div className="admin-container">
            <Sidebar />
            <main className="admin-content">
                <header className="admin-topbar">
                    <div className="search-bar">
                        <i className="fas fa-search"></i>
                        <input type="text" placeholder="Global search..." />
                    </div>
                    <div style={{ marginRight: 'auto', marginLeft: '20px' }}>
                        <button
                            onClick={() => navigate('/admin/dashboard')}
                            style={{
                                background: 'transparent',
                                border: '1px solid #e5e7eb',
                                padding: '8px 16px',
                                borderRadius: '8px',
                                color: '#4b5563',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                fontSize: '14px',
                                fontWeight: '500'
                            }}
                        >
                            <i className="fas fa-th-large"></i> Admin Dashboard
                        </button>
                    </div>
                    <div className="admin-profile">
                        <div className="notification-wrapper" ref={dropdownRef}>
                            <div className="admin-notif-trigger" onClick={() => setShowNotifs(!showNotifs)}>
                                <i className="fas fa-bell"></i>
                                {unreadCount > 0 && <span className="badge">{unreadCount}</span>}
                            </div>
                            
                            {showNotifs && (
                                <div className="notification-dropdown">
                                    <div className="dropdown-header">
                                        <h3>Notifications</h3>
                                        {unreadCount > 0 && <span className="unread-tag">{unreadCount} new</span>}
                                    </div>
                                    <div className="dropdown-body">
                                        {notifications.length === 0 ? (
                                            <div className="empty-notifs">No notifications</div>
                                        ) : (
                                            notifications.map(notif => (
                                                <div 
                                                    key={notif.id} 
                                                    className={`notif-item ${!notif.isRead ? 'unread' : ''}`}
                                                    onClick={() => !notif.isRead && handleMarkAsRead(notif.id)}
                                                >
                                                    <div className="notif-content">
                                                        <p className="notif-title">{notif.title}</p>
                                                        <p className="notif-message">{notif.message}</p>
                                                        <span className="notif-time">
                                                            {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true })}
                                                        </span>
                                                    </div>
                                                    {!notif.isRead && <div className="unread-dot"></div>}
                                                </div>
                                            ))
                                        )}
                                    </div>
                                    <div className="dropdown-footer">
                                        <button onClick={() => setShowNotifs(false)}>Close</button>
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="admin-info">
                            <span className="admin-name">{user.fullName}</span>
                        </div>
                    </div>
                </header>
                <div className="admin-page-content">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default AdminLayout;
