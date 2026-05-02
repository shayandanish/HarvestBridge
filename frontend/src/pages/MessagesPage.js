import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { getMediaUrl } from '../services/api';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000/api/v1';

function statusBadge(msg, myId) {
    if (msg.senderId !== myId) return null;
    if (msg.isRead) return <span title="Read" style={{ color: '#38a169', fontSize: 12 }}>👁 Read</span>;
    if (msg.isDelivered) return <span title="Delivered" style={{ color: '#667eea', fontSize: 12 }}>✓✓ Delivered</span>;
    return <span title="Sent" style={{ color: '#a0aec0', fontSize: 12 }}>✓ Sent</span>;
}

export default function MessagesPage() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { sendMessage, fetchContacts, fetchInbox, fetchConversation } = useNotifications();

    const [contacts, setContacts] = useState([]);
    const [inbox, setInbox] = useState([]);
    const [selectedContact, setSelectedContact] = useState(null);
    const [thread, setThread] = useState([]);
    const [composeText, setComposeText] = useState('');
    const [sending, setSending] = useState(false);
    const [loading, setLoading] = useState(true);
    const [showCompose, setShowCompose] = useState(false);
    const threadEndRef = useRef(null);

    const isInvestor = user?.role === 'investor';

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const [c, i] = await Promise.all([fetchContacts(), fetchInbox()]);
            setContacts(c);
            setInbox(i);
        } finally {
            setLoading(false);
        }
    }, [fetchContacts, fetchInbox]);

    useEffect(() => { load(); }, []); // eslint-disable-line

    const openThread = async (contact) => {
        setSelectedContact(contact);
        setShowCompose(false);
        const msgs = await fetchConversation(contact.id);
        setThread(msgs);
    };

    useEffect(() => {
        threadEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [thread]);

    const handleSend = async () => {
        if (!composeText.trim() || !selectedContact) return;
        setSending(true);
        try {
            const token = localStorage.getItem('accessToken');
            const res = await fetch(`${API_BASE}/messages`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ recipientId: selectedContact.id, content: composeText.trim() }),
            });
            const data = await res.json();
            if (data.status === 'success') {
                setThread(prev => [...prev, data.data]);
                setComposeText('');
                load();
            }
        } finally {
            setSending(false);
        }
    };

    const threadPartner = selectedContact;

    return (
        <div style={{ minHeight: '100vh', background: '#f7fafc', fontFamily: "'Inter', sans-serif" }}>
            {/* Header */}
            <div style={{
                background: 'linear-gradient(135deg, #1a3c34 0%, #2d6a4f 50%, #40916c 100%)',
                padding: '20px 32px', color: '#fff',
            }}>
                <div style={{ maxWidth: 1000, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 16 }}>
                    <button onClick={() => navigate(-1)} style={{
                        background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff',
                        borderRadius: 8, padding: '6px 14px', cursor: 'pointer', fontSize: 13,
                    }}>← Back</button>
                    <div>
                        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800 }}>💬 Messages</h1>
                        <p style={{ margin: '4px 0 0', opacity: 0.8, fontSize: 13 }}>
                            {isInvestor ? 'Message your farmers' : 'Messages from your investors'}
                        </p>
                    </div>
                </div>
            </div>

            <div style={{ maxWidth: 1000, margin: '0 auto', padding: '20px 16px', display: 'flex', gap: 16, height: 'calc(100vh - 100px)' }}>
                {/* Left Panel – Contacts / Inbox */}
                <div style={{
                    width: 280, flexShrink: 0, background: '#fff', borderRadius: 16,
                    boxShadow: '0 2px 12px rgba(0,0,0,0.08)', overflow: 'hidden', display: 'flex', flexDirection: 'column',
                }}>
                    <div style={{ padding: '16px', borderBottom: '1px solid #e2e8f0' }}>
                        <div style={{ fontWeight: 700, fontSize: 14, color: '#2d3748', marginBottom: 10 }}>
                            {isInvestor ? '👨‍🌾 Your Farmers' : '💼 Your Investors'}
                        </div>
                        <button onClick={() => { setShowCompose(true); setSelectedContact(null); }} style={{
                            width: '100%', background: '#2d6a4f', color: '#fff', border: 'none',
                            borderRadius: 8, padding: '8px 0', cursor: 'pointer', fontWeight: 600, fontSize: 13,
                        }}>
                            + Compose Message
                        </button>
                    </div>
                    <div style={{ flex: 1, overflowY: 'auto' }}>
                        {loading ? (
                            <div style={{ padding: 20, textAlign: 'center', color: '#a0aec0' }}>Loading...</div>
                        ) : contacts.length === 0 ? (
                            <div style={{ padding: 20, textAlign: 'center', color: '#a0aec0', fontSize: 13 }}>
                                No contacts yet
                            </div>
                        ) : (
                            contacts.map(contact => {
                                const lastMsg = inbox.find(m => m.sender?.id === contact.id || m.recipient?.id === contact.id);
                                const isActive = selectedContact?.id === contact.id;
                                return (
                                    <div key={contact.id} onClick={() => openThread(contact)} style={{
                                        padding: '12px 16px', cursor: 'pointer', borderBottom: '1px solid #f7fafc',
                                        background: isActive ? '#f0fff4' : '#fff',
                                        borderLeft: isActive ? '3px solid #2d6a4f' : '3px solid transparent',
                                        transition: 'all 0.15s',
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                            <div style={{
                                                width: 36, height: 36, borderRadius: '50%',
                                                background: '#c6f6d5', display: 'flex', alignItems: 'center',
                                                justifyContent: 'center', fontSize: 16, flexShrink: 0,
                                            }}>
                                                {contact.profilePhotoUrl
                                                    ? <img src={getMediaUrl(contact.profilePhotoUrl)} alt="" style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover' }} />
                                                    : '👤'}
                                            </div>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ fontWeight: 600, fontSize: 13, color: '#2d3748' }}>{contact.fullName}</div>
                                                {lastMsg && (
                                                    <div style={{ fontSize: 11, color: '#a0aec0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                        {lastMsg.content}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* Right Panel – Thread or Compose */}
                <div style={{
                    flex: 1, background: '#fff', borderRadius: 16,
                    boxShadow: '0 2px 12px rgba(0,0,0,0.08)', display: 'flex', flexDirection: 'column', overflow: 'hidden',
                }}>
                    {showCompose ? (
                        /* Compose Panel */
                        <div style={{ padding: 24, flex: 1, overflowY: 'auto' }}>
                            <h3 style={{ margin: '0 0 20px', color: '#2d3748' }}>📝 New Message</h3>
                            <div style={{ marginBottom: 16 }}>
                                <label style={{ fontSize: 13, fontWeight: 600, color: '#4a5568', display: 'block', marginBottom: 6 }}>
                                    Select Recipient(s)
                                </label>
                                <select
                                    onChange={e => {
                                        const c = contacts.find(x => x.id === e.target.value);
                                        setSelectedContact(c || null);
                                    }}
                                    style={{
                                        width: '100%', padding: '10px 12px', borderRadius: 8, fontSize: 13,
                                        border: '1px solid #e2e8f0', outline: 'none',
                                    }}
                                >
                                    <option value="">-- Choose {isInvestor ? 'farmer' : 'investor'} --</option>
                                    {contacts.map(c => <option key={c.id} value={c.id}>{c.fullName}</option>)}
                                </select>
                            </div>
                            <div style={{ marginBottom: 16 }}>
                                <label style={{ fontSize: 13, fontWeight: 600, color: '#4a5568', display: 'block', marginBottom: 6 }}>
                                    Message
                                </label>
                                <textarea
                                    value={composeText}
                                    onChange={e => setComposeText(e.target.value)}
                                    rows={6}
                                    placeholder="Write your message here..."
                                    style={{
                                        width: '100%', padding: '10px 12px', borderRadius: 8, fontSize: 13,
                                        border: '1px solid #e2e8f0', outline: 'none', resize: 'vertical',
                                        boxSizing: 'border-box',
                                    }}
                                />
                            </div>
                            <button
                                onClick={handleSend}
                                disabled={sending || !composeText.trim() || !selectedContact}
                                style={{
                                    background: sending || !composeText.trim() || !selectedContact ? '#a0aec0' : '#2d6a4f',
                                    color: '#fff', border: 'none', borderRadius: 8,
                                    padding: '10px 24px', cursor: 'pointer', fontWeight: 700, fontSize: 14,
                                }}
                            >
                                {sending ? 'Sending...' : '📤 Send Message'}
                            </button>
                        </div>
                    ) : selectedContact ? (
                        /* Thread Panel */
                        <>
                            {/* Thread header */}
                            <div style={{
                                padding: '14px 20px', borderBottom: '1px solid #e2e8f0',
                                display: 'flex', alignItems: 'center', gap: 12,
                                background: '#f7fafc',
                            }}>
                                <div style={{
                                    width: 40, height: 40, borderRadius: '50%',
                                    background: '#c6f6d5', display: 'flex', alignItems: 'center',
                                    justifyContent: 'center', fontSize: 18,
                                }}>
                                    {threadPartner?.profilePhotoUrl
                                        ? <img src={getMediaUrl(threadPartner.profilePhotoUrl)} alt="" style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover' }} />
                                        : '👤'}
                                </div>
                                <div>
                                    <div style={{ fontWeight: 700, fontSize: 15, color: '#2d3748' }}>{threadPartner?.fullName}</div>
                                    <div style={{ fontSize: 12, color: '#a0aec0' }}>
                                        {isInvestor ? 'Farmer' : 'Investor'}
                                    </div>
                                </div>
                            </div>

                            {/* Messages */}
                            <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                                {thread.length === 0 ? (
                                    <div style={{ textAlign: 'center', color: '#a0aec0', marginTop: 60 }}>
                                        <div style={{ fontSize: 40, marginBottom: 12 }}>💬</div>
                                        No messages yet. Say hello!
                                    </div>
                                ) : (
                                    thread.map(msg => {
                                        const isMe = msg.senderId === user?.id;
                                        return (
                                            <div key={msg.id} style={{
                                                display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start',
                                            }}>
                                                <div style={{
                                                    maxWidth: '70%', background: isMe ? '#2d6a4f' : '#f7fafc',
                                                    color: isMe ? '#fff' : '#2d3748', borderRadius: isMe ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                                                    padding: '10px 14px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
                                                }}>
                                                    <p style={{ margin: 0, fontSize: 14, lineHeight: 1.5 }}>{msg.content}</p>
                                                    <div style={{
                                                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                                        marginTop: 6, gap: 10,
                                                    }}>
                                                        <span style={{ fontSize: 11, opacity: 0.7 }}>
                                                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </span>
                                                        {statusBadge(msg, user?.id)}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                                <div ref={threadEndRef} />
                            </div>

                            {/* Input box - only investors can reply; farmers can reply too */}
                            <div style={{
                                padding: '12px 20px', borderTop: '1px solid #e2e8f0',
                                display: 'flex', gap: 10, background: '#f7fafc',
                            }}>
                                <input
                                    value={composeText}
                                    onChange={e => setComposeText(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
                                    placeholder="Type a message... (Enter to send)"
                                    style={{
                                        flex: 1, padding: '10px 14px', borderRadius: 24,
                                        border: '1px solid #e2e8f0', outline: 'none', fontSize: 14,
                                        background: '#fff',
                                    }}
                                />
                                <button onClick={handleSend} disabled={sending || !composeText.trim()} style={{
                                    background: sending || !composeText.trim() ? '#a0aec0' : '#2d6a4f',
                                    color: '#fff', border: 'none', borderRadius: 24,
                                    padding: '10px 20px', cursor: 'pointer', fontWeight: 700, fontSize: 14,
                                }}>
                                    {sending ? '...' : '➤'}
                                </button>
                            </div>
                        </>
                    ) : (
                        /* Empty state */
                        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12, color: '#a0aec0' }}>
                            <div style={{ fontSize: 64 }}>💬</div>
                            <h3 style={{ margin: 0, color: '#2d3748' }}>Select a conversation</h3>
                            <p style={{ fontSize: 14, textAlign: 'center', maxWidth: 300 }}>
                                Choose a {isInvestor ? 'farmer' : 'investor'} from the left, or compose a new message.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
