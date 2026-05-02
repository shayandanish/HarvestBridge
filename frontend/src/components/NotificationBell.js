import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../context/NotificationContext';

const typeIcons = {
    activity_update: '🌱',
    message: '💬',
    payment_success: '💰',
    system: '🔔',
};

export default function NotificationBell({ align = 'right' }) {
    const { notifications, unreadCount, markRead, fetchNotifications } = useNotifications();
    const [open, setOpen] = useState(false);
    const ref = useRef(null);
    const navigate = useNavigate();

    // Load notifications on open
    useEffect(() => {
        if (open) fetchNotifications({ limit: 8 });
    }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

    // Close on outside click
    useEffect(() => {
        const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const handleClickNotif = (notif) => {
        if (!notif.isRead) markRead(notif.id);
        setOpen(false);
        if (notif.link) navigate(notif.link);
    };

    const preview = notifications.slice(0, 6);

    return (
        <div ref={ref} style={{ position: 'relative', display: 'inline-block' }}>
            <button
                onClick={() => setOpen(o => !o)}
                title="Notifications"
                style={{
                    background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center',
                    position: 'relative', padding: '4px 8px', color: '#6b7280'
                }}
                onMouseEnter={(e) => e.currentTarget.style.color = '#15803d'}
                onMouseLeave={(e) => e.currentTarget.style.color = '#6b7280'}
            >
                <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                {unreadCount > 0 && (
                    <span style={{
                        position: 'absolute', top: -2, right: -2,
                        background: '#e53e3e', color: '#fff', borderRadius: '50%',
                        fontSize: 10, fontWeight: 700, minWidth: 18, height: 18,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        padding: '0 4px',
                    }}>
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </button>

            {open && (
                <div style={{
                    position: 'absolute', 
                    ...(align === 'right' ? { right: 0 } : { left: 0 }),
                    top: '110%', width: 340,
                    background: '#fff', borderRadius: 12, boxShadow: '0 8px 32px rgba(0,0,0,0.16)',
                    zIndex: 9999, overflow: 'hidden', border: '1px solid #e2e8f0',
                }}>
                    <div style={{
                        padding: '12px 16px', borderBottom: '1px solid #e2e8f0',
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        background: 'linear-gradient(135deg, #2d6a4f 0%, #40916c 100%)',
                    }}>
                        <span style={{ fontWeight: 700, color: '#fff', fontSize: 15, display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                            Notifications
                        </span>
                        {unreadCount > 0 && (
                            <span style={{
                                background: 'rgba(255,255,255,0.25)', color: '#fff',
                                borderRadius: 20, fontSize: 11, padding: '2px 10px',
                            }}>
                                {unreadCount} unread
                            </span>
                        )}
                    </div>

                    <div style={{ maxHeight: 360, overflowY: 'auto' }}>
                        {preview.length === 0 ? (
                            <div style={{ padding: 24, textAlign: 'center', color: '#718096', fontSize: 14 }}>
                                <div style={{ fontSize: 32, marginBottom: 8 }}>🌿</div>
                                No notifications yet
                            </div>
                        ) : (
                            preview.map((n) => (
                                <div
                                    key={n.id}
                                    onClick={() => handleClickNotif(n)}
                                    style={{
                                        display: 'flex', gap: 12, padding: '12px 16px',
                                        cursor: 'pointer', borderBottom: '1px solid #f7fafc',
                                        background: n.isRead ? '#fff' : '#f0fff4',
                                        transition: 'background 0.15s',
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.background = '#f7fafc'}
                                    onMouseLeave={e => e.currentTarget.style.background = n.isRead ? '#fff' : '#f0fff4'}
                                >
                                    <div style={{ fontSize: 22, flexShrink: 0, lineHeight: 1.3 }}>
                                        {typeIcons[n.type] || '🔔'}
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{
                                            fontWeight: n.isRead ? 500 : 700, fontSize: 13,
                                            color: '#2d3748', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                                        }}>
                                            {n.title}
                                        </div>
                                        <div style={{
                                            fontSize: 12, color: '#718096', marginTop: 2,
                                            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                                        }}>
                                            {n.message}
                                        </div>
                                        <div style={{ fontSize: 11, color: '#a0aec0', marginTop: 4 }}>
                                            {new Date(n.createdAt).toLocaleString()}
                                        </div>
                                    </div>
                                    {!n.isRead && (
                                        <div style={{
                                            width: 8, height: 8, borderRadius: '50%',
                                            background: '#38a169', flexShrink: 0, marginTop: 6,
                                        }} />
                                    )}
                                </div>
                            ))
                        )}
                    </div>

                    <div style={{
                        padding: '10px 16px', borderTop: '1px solid #e2e8f0',
                        display: 'flex', justifyContent: 'center',
                    }}>
                        <button
                            onClick={() => { setOpen(false); navigate('/notifications'); }}
                            style={{
                                background: '#2d6a4f', color: '#fff', border: 'none',
                                borderRadius: 8, padding: '8px 20px', cursor: 'pointer',
                                fontSize: 13, fontWeight: 600,
                            }}
                        >
                            View All Notifications
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
