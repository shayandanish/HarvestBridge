import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import axios from 'axios';
import Toast from '../components/Toast';

const NotificationContext = createContext(null);

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000/api/v1';

const getToken = () => localStorage.getItem('accessToken');

export const NotificationProvider = ({ children }) => {
    const { user } = useAuth();
    const socketRef = useRef(null);

    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [messages, setMessages] = useState([]);
    const [unreadMessages, setUnreadMessages] = useState(0);
    const [connected, setConnected] = useState(false);
    const [currentToast, setCurrentToast] = useState(null);

    // API helpers — read token at call-time so no stale deps
    const authHeaders = useCallback(() => ({
        headers: { Authorization: `Bearer ${getToken()}` }
    }), []);

    const fetchUnreadCount = useCallback(async () => {
        if (!getToken()) return;
        try {
            const [notifRes, msgRes] = await Promise.all([
                axios.get(`${API_BASE}/notifications/count`, authHeaders()),
                axios.get(`${API_BASE}/messages/unread-count`, authHeaders()),
            ]);
            setUnreadCount(notifRes.data.count || 0);
            setUnreadMessages(msgRes.data.count || 0);
        } catch { /* silent */ }
    }, [authHeaders]);

    const fetchNotifications = useCallback(async (params = {}) => {
        if (!getToken()) return [];
        try {
            const res = await axios.get(`${API_BASE}/notifications`, { ...authHeaders(), params });
            setNotifications(res.data.data || []);
            return res.data;
        } catch { return { data: [] }; }
    }, [authHeaders]);

    const markRead = useCallback(async (id) => {
        if (!getToken()) return;
        try {
            await axios.put(`${API_BASE}/notifications/${id}/read`, {}, authHeaders());
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch { /* silent */ }
    }, [authHeaders]);

    const markAllRead = useCallback(async () => {
        if (!getToken()) return;
        try {
            await axios.put(`${API_BASE}/notifications/read-all`, {}, authHeaders());
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
            setUnreadCount(0);
        } catch { /* silent */ }
    }, [authHeaders]);

    const deleteNotification = useCallback(async (id) => {
        if (!getToken()) return;
        try {
            await axios.delete(`${API_BASE}/notifications/${id}`, authHeaders());
            setNotifications(prev => prev.filter(n => n.id !== id));
        } catch { /* silent */ }
    }, [authHeaders]);

    const sendMessage = useCallback(async (payload) => {
        if (!getToken()) throw new Error('Not authenticated');
        const res = await axios.post(`${API_BASE}/messages`, payload, authHeaders());
        return res.data;
    }, [authHeaders]);

    const fetchInbox = useCallback(async () => {
        if (!getToken()) return [];
        try {
            const res = await axios.get(`${API_BASE}/messages/inbox`, authHeaders());
            setMessages(res.data.data || []);
            return res.data.data || [];
        } catch { return []; }
    }, [authHeaders]);

    const fetchConversation = useCallback(async (userId) => {
        if (!getToken()) return [];
        try {
            const res = await axios.get(`${API_BASE}/messages/conversations/${userId}`, authHeaders());
            return res.data.data || [];
        } catch { return []; }
    }, [authHeaders]);

    const fetchContacts = useCallback(async () => {
        if (!getToken()) return [];
        try {
            const res = await axios.get(`${API_BASE}/messages/contacts`, authHeaders());
            return res.data.data || [];
        } catch { return []; }
    }, [authHeaders]);

    // Socket.io connection — reconnect when user changes (login/logout)
    useEffect(() => {
        const token = getToken();
        if (!user || !token) return;

        const socket = io(process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000', {
            auth: { token },
            transports: ['websocket', 'polling'],
        });

        socketRef.current = socket;

        socket.on('connect', () => {
            setConnected(true);
            fetchUnreadCount();
        });

        socket.on('disconnect', () => setConnected(false));

        socket.on('new_notification', (notification) => {
            setNotifications(prev => [notification, ...prev]);
            setUnreadCount(prev => prev + 1);
            setCurrentToast(notification); // Trigger visual toast
        });

        socket.on('new_message', (message) => {
            setUnreadMessages(prev => prev + 1);
            fetchInbox();
            
            // Trigger visual toast for message
            setCurrentToast({
                type: 'message',
                title: 'New Message',
                message: message.content || 'You have a new message',
            });
        });

        // Initial fetch
        fetchUnreadCount();

        return () => {
            socket.disconnect();
            socketRef.current = null;
            setConnected(false);
        };
    }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

    return (
        <NotificationContext.Provider value={{
            notifications,
            unreadCount,
            messages,
            unreadMessages,
            connected,
            fetchNotifications,
            markRead,
            markAllRead,
            deleteNotification,
            sendMessage,
            fetchInbox,
            fetchConversation,
            fetchContacts,
            fetchUnreadCount,
        }}>
            {children}
            {currentToast && (
                <Toast 
                    notification={currentToast} 
                    onClose={() => setCurrentToast(null)} 
                />
            )}
        </NotificationContext.Provider>
    );
};

export const useNotifications = () => {
    const ctx = useContext(NotificationContext);
    if (!ctx) throw new Error('useNotifications must be used within NotificationProvider');
    return ctx;
};

export default NotificationContext;
