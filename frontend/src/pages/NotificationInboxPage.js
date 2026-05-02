import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../context/NotificationContext';

const TABS = [
    { key: 'all', label: 'All', icon: '🔔' },
    { key: 'activity_update', label: 'Activity Updates', icon: '🌱' },
    { key: 'message', label: 'Messages', icon: '💬' },
    { key: 'payment_success', label: 'Payments', icon: '💰' },
    { key: 'system', label: 'System', icon: '⚙️' },
];

const typeIcons = {
    activity_update: '🌱',
    message: '💬',
    payment_success: '💰',
    system: '⚙️',
};

export default function NotificationInboxPage() {
    const navigate = useNavigate();
    const { markRead, markAllRead, deleteNotification } = useNotifications();

    const [activeTab, setActiveTab] = useState('all');
    const [notifications, setNotifications] = useState([]);
    const [pagination, setPagination] = useState({ page: 1, total: 0, limit: 20 });
    const [loading, setLoading] = useState(false);

    const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000/api/v1';

    const loadNotifications = useCallback(async (tab = activeTab, page = 1) => {
        setLoading(true);
        try {
            const token = localStorage.getItem('accessToken');
            const params = new URLSearchParams({ page, limit: 20 });
            if (tab !== 'all') params.set('type', tab);
            const res = await fetch(`${API_BASE}/notifications?${params}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            setNotifications(data.data || []);
            setPagination(data.pagination || { page: 1, total: 0, limit: 20 });
        } finally {
            setLoading(false);
        }
    }, [activeTab, API_BASE]);

    useEffect(() => { loadNotifications(activeTab, 1); }, [activeTab]); // eslint-disable-line

    const handleMarkAllRead = async () => {
        await markAllRead();
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    };

    const handleDelete = async (id) => {
        await deleteNotification(id);
        setNotifications(prev => prev.filter(n => n.id !== id));
    };

    const handleClick = async (notif) => {
        if (!notif.isRead) {
            await markRead(notif.id);
            setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, isRead: true } : n));
        }
        if (notif.link) navigate(notif.link);
    };

    const unreadInView = notifications.filter(n => !n.isRead).length;

    return (
        <div style={{ minHeight: '100vh', background: '#f7fafc', fontFamily: "'Inter', sans-serif" }}>
            {/* Header */}
            <div style={{
                background: 'linear-gradient(135deg, #1a3c34 0%, #2d6a4f 50%, #40916c 100%)',
                padding: '24px 32px', color: '#fff',
            }}>
                <div style={{ maxWidth: 800, margin: '0 auto' }}>
                    <button onClick={() => navigate(-1)} style={{
                        background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff',
                        borderRadius: 8, padding: '6px 16px', cursor: 'pointer', marginBottom: 16, fontSize: 13,
                    }}>← Back</button>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <h1 style={{ margin: 0, fontSize: 28, fontWeight: 800 }}>🔔 Notification Center</h1>
                            <p style={{ margin: '6px 0 0', opacity: 0.8, fontSize: 14 }}>
                                {pagination.total} total notification{pagination.total !== 1 ? 's' : ''}
                            </p>
                        </div>
                        <div style={{ display: 'flex', gap: 10 }}>
                            {unreadInView > 0 && (
                                <button onClick={handleMarkAllRead} style={{
                                    background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.4)',
                                    color: '#fff', borderRadius: 8, padding: '8px 16px', cursor: 'pointer',
                                    fontSize: 13, fontWeight: 600,
                                }}>
                                    ✓ Mark All Read
                                </button>
                            )}
                            <button onClick={() => navigate('/messages')} style={{
                                background: '#fff', border: 'none', color: '#2d6a4f',
                                borderRadius: 8, padding: '8px 16px', cursor: 'pointer',
                                fontSize: 13, fontWeight: 700,
                            }}>
                                💬 Messages
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div style={{ maxWidth: 800, margin: '0 auto', padding: '24px 16px' }}>
                {/* Filter Tabs */}
                <div style={{
                    display: 'flex', gap: 8, overflowX: 'auto', marginBottom: 24,
                    background: '#fff', borderRadius: 12, padding: 8,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                }}>
                    {TABS.map(tab => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            style={{
                                padding: '8px 16px', borderRadius: 8, border: 'none', cursor: 'pointer',
                                fontWeight: activeTab === tab.key ? 700 : 500, fontSize: 13, whiteSpace: 'nowrap',
                                background: activeTab === tab.key
                                    ? 'linear-gradient(135deg, #2d6a4f, #40916c)'
                                    : 'transparent',
                                color: activeTab === tab.key ? '#fff' : '#4a5568',
                                transition: 'all 0.2s',
                            }}
                        >
                            {tab.icon} {tab.label}
                        </button>
                    ))}
                </div>

                {/* Notifications List */}
                {loading ? (
                    <div style={{ textAlign: 'center', padding: 60, color: '#718096' }}>
                        <div style={{ fontSize: 40, marginBottom: 12 }}>⏳</div>
                        Loading notifications...
                    </div>
                ) : notifications.length === 0 ? (
                    <div style={{
                        textAlign: 'center', padding: 60, background: '#fff',
                        borderRadius: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                    }}>
                        <div style={{ fontSize: 48, marginBottom: 16 }}>🌿</div>
                        <h3 style={{ color: '#2d3748', margin: '0 0 8px' }}>No notifications here</h3>
                        <p style={{ color: '#718096', fontSize: 14 }}>You're all caught up!</p>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {notifications.map(notif => (
                            <div key={notif.id} style={{
                                background: notif.isRead ? '#fff' : '#f0fff4',
                                borderRadius: 12, padding: '16px 20px',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                                border: notif.isRead ? '1px solid #e2e8f0' : '1px solid #9ae6b4',
                                display: 'flex', gap: 14, alignItems: 'flex-start',
                                transition: 'all 0.2s',
                            }}>
                                {/* Icon */}
                                <div style={{
                                    width: 44, height: 44, borderRadius: 12,
                                    background: notif.isRead ? '#f7fafc' : '#c6f6d5',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: 22, flexShrink: 0,
                                }}>
                                    {typeIcons[notif.type] || '🔔'}
                                </div>

                                {/* Content */}
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{
                                        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8,
                                    }}>
                                        <div style={{
                                            fontWeight: notif.isRead ? 500 : 700, fontSize: 14,
                                            color: '#1a202c',
                                        }}>
                                            {notif.title}
                                        </div>
                                        <span style={{
                                            fontSize: 11, color: '#a0aec0', whiteSpace: 'nowrap', flexShrink: 0,
                                        }}>
                                            {new Date(notif.createdAt).toLocaleString()}
                                        </span>
                                    </div>
                                    <p style={{ margin: '4px 0 0', fontSize: 13, color: '#4a5568', lineHeight: 1.5 }}>
                                        {notif.message}
                                    </p>
                                    <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                                        {notif.link && (
                                            <button onClick={() => handleClick(notif)} style={{
                                                background: '#2d6a4f', color: '#fff', border: 'none',
                                                borderRadius: 6, padding: '5px 12px', cursor: 'pointer', fontSize: 12,
                                            }}>
                                                View Details →
                                            </button>
                                        )}
                                        {!notif.isRead && (
                                            <button onClick={() => {
                                                markRead(notif.id);
                                                setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, isRead: true } : n));
                                            }} style={{
                                                background: 'transparent', color: '#2d6a4f', border: '1px solid #2d6a4f',
                                                borderRadius: 6, padding: '5px 12px', cursor: 'pointer', fontSize: 12,
                                            }}>
                                                Mark Read
                                            </button>
                                        )}
                                        <button onClick={() => handleDelete(notif.id)} style={{
                                            background: 'transparent', color: '#e53e3e', border: '1px solid #e53e3e',
                                            borderRadius: 6, padding: '5px 12px', cursor: 'pointer', fontSize: 12, marginLeft: 'auto',
                                        }}>
                                            Delete
                                        </button>
                                    </div>
                                </div>

                                {!notif.isRead && (
                                    <div style={{
                                        width: 10, height: 10, borderRadius: '50%',
                                        background: '#38a169', flexShrink: 0, marginTop: 4,
                                    }} />
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {/* Pagination */}
                {pagination.total > pagination.limit && (
                    <div style={{ display: 'flex', justifyContent: 'center', gap: 10, marginTop: 24 }}>
                        <button disabled={pagination.page <= 1}
                            onClick={() => loadNotifications(activeTab, pagination.page - 1)} style={{
                                padding: '8px 20px', borderRadius: 8, border: '1px solid #e2e8f0',
                                background: '#fff', cursor: 'pointer', fontSize: 13,
                            }}>
                            ← Previous
                        </button>
                        <span style={{ lineHeight: '36px', fontSize: 13, color: '#718096' }}>
                            Page {pagination.page} of {Math.ceil(pagination.total / pagination.limit)}
                        </span>
                        <button disabled={pagination.page * pagination.limit >= pagination.total}
                            onClick={() => loadNotifications(activeTab, pagination.page + 1)} style={{
                                padding: '8px 20px', borderRadius: 8, border: '1px solid #e2e8f0',
                                background: '#fff', cursor: 'pointer', fontSize: 13,
                            }}>
                            Next →
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
