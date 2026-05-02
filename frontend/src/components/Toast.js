import React, { useEffect } from 'react';

const typeIcons = {
    activity_update: '🌱',
    message: '💬',
    payment_success: '💰',
    system: '🔔',
    payment_alert: '⚠️',
};

export default function Toast({ notification, onClose, duration = 5000 }) {
    useEffect(() => {
        const timer = setTimeout(onClose, duration);
        return () => clearTimeout(timer);
    }, [onClose, duration]);

    if (!notification) return null;

    return (
        <div 
            onClick={onClose}
            style={{
                position: 'fixed',
                bottom: '24px',
                right: '24px',
                zIndex: 99999,
                background: '#fff',
                color: '#2d3748',
                padding: '16px',
                borderRadius: '16px',
                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(0,0,0,0.05)',
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                minWidth: '320px',
                maxWidth: '450px',
                cursor: 'pointer',
                animation: 'slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                borderLeft: '4px solid #38a169',
            }}
        >
            <style>
                {`
                @keyframes slideUp {
                    from { transform: translateY(100%) scale(0.9); opacity: 0; }
                    to { transform: translateY(0) scale(1); opacity: 1; }
                }
                `}
            </style>
            <div style={{ fontSize: '28px' }}>
                {typeIcons[notification.type] || '🔔'}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: '14px', marginBottom: '2px' }}>
                    {notification.title}
                </div>
                <div style={{ 
                    fontSize: '13px', 
                    color: '#718096', 
                    whiteSpace: 'nowrap', 
                    overflow: 'hidden', 
                    textOverflow: 'ellipsis' 
                }}>
                    {notification.message}
                </div>
            </div>
            <button 
                onClick={(e) => { e.stopPropagation(); onClose(); }}
                style={{
                    background: 'none',
                    border: 'none',
                    color: '#a0aec0',
                    fontSize: '18px',
                    cursor: 'pointer',
                    padding: '4px',
                }}
            >
                ✕
            </button>
        </div>
    );
}
