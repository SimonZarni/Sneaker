import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Head } from '@inertiajs/react';
import AdminLayout from '@/Components/AdminLayout';

interface Conversation {
    id: number;
    user_id: number;
    user_name: string;
    user_email: string;
    status: 'open' | 'closed';
    last_message_at: string | null;
    last_message: string;
    unread: number;
}

interface Message {
    id: number;
    sender_type: 'user' | 'admin';
    body: string;
    created_at: string;
}

interface Props {
    conversations: Conversation[];
    totalUnread: number;
    admin: { name: string };
}

export default function AdminChatIndex({ conversations: initial, totalUnread, admin }: Props) {
    const [conversations, setConversations]     = useState<Conversation[]>(initial);
    const [selected, setSelected]               = useState<Conversation | null>(null);
    const [messages, setMessages]               = useState<Message[]>([]);
    const [input, setInput]                     = useState('');
    const [sending, setSending]                 = useState(false);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const [mobileView, setMobileView]           = useState<'list' | 'chat'>('list');
    const bottomRef   = useRef<HTMLDivElement>(null);
    const inputRef    = useRef<HTMLInputElement>(null);
    const selectedRef = useRef<Conversation | null>(null);

    useEffect(() => { selectedRef.current = selected; }, [selected]);

    useEffect(() => {
        // @ts-ignore
        if (typeof window.Echo === 'undefined') return;
        // @ts-ignore
        window.Echo.private('admin-chat')
            .listen('.chat.message', (data: any) => {
                const currentSelected = selectedRef.current;
                const isOpen = data.sender_type === 'user' && currentSelected?.id === data.conversation_id;

                setConversations(prev => {
                    const existing = prev.find(c => c.id === data.conversation_id);
                    if (existing) {
                        const updated = {
                            ...existing,
                            last_message:    data.body,
                            last_message_at: data.created_at,
                            unread: data.sender_type === 'user' && !isOpen
                                ? existing.unread + 1
                                : existing.unread,
                        };
                        return [updated, ...prev.filter(c => c.id !== data.conversation_id)];
                    }
                    return [{
                        id:              data.conversation_id,
                        user_id:         data.user_id,
                        user_name:       data.user_name,
                        user_email:      '',
                        status:          'open' as const,
                        last_message_at: data.created_at,
                        last_message:    data.body,
                        unread:          isOpen ? 0 : 1,
                    }, ...prev];
                });

                if (isOpen) {
                    setMessages(prev => [...prev, {
                        id:          data.id,
                        sender_type: 'user',
                        body:        data.body,
                        created_at:  data.created_at,
                    }]);
                    setConversations(prev => prev.map(c =>
                        c.id === data.conversation_id ? { ...c, unread: 0 } : c
                    ));
                    axios.post(`/admin/chat/${data.conversation_id}/read`).catch(() => {});
                }
            });
        return () => {
            // @ts-ignore
            window.Echo.leave('admin-chat');
        };
    }, []);

    useEffect(() => {
        if (messages.length > 0) {
            bottomRef.current?.scrollIntoView({ behavior: 'auto' });
        }
    }, [messages]);

    const openConversation = async (conv: Conversation) => {
        setSelected(conv);
        setMobileView('chat');
        setLoadingMessages(true);
        setMessages([]);
        try {
            const res  = await axios.get(`/admin/chat/${conv.id}/messages`);
            const data = res.data;
            setMessages(data.messages);
            setConversations(prev => prev.map(c =>
                c.id === conv.id ? { ...c, unread: 0, status: data.conversation.status } : c
            ));
        } finally {
            setLoadingMessages(false);
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    };

    const sendMessage = async () => {
        if (!input.trim() || !selected || sending) return;
        const body = input.trim();
        setInput('');
        setSending(true);
        setMessages(prev => [...prev, {
            id:          Date.now(),
            sender_type: 'admin',
            body,
            created_at:  new Date().toISOString(),
        }]);
        await axios.post(`/admin/chat/${selected.id}/send`, { body });
        setSending(false);
    };

    const closeConversation = async () => {
        if (!selected) return;
        await axios.patch(`/admin/chat/${selected.id}/close`);
        setConversations(prev => prev.map(c => c.id === selected.id ? { ...c, status: 'closed' } : c));
        setSelected(prev => prev ? { ...prev, status: 'closed' } : null);
    };

    const handleKey = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
    };

    const formatTime = (iso: string) => new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const formatDate = (iso: string | null) => {
        if (!iso) return '';
        const d = new Date(iso);
        const now = new Date();
        if (d.toDateString() === now.toDateString()) return formatTime(iso);
        return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
    };

    const totalUnreadCount = conversations.reduce((s, c) => s + c.unread, 0);

    // ── Conversation list panel ────────────────────────────────────────────────
    const ConvList = (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #f0f0f0', flexShrink: 0 }}>
                <p style={{ fontSize: '11px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.15em', color: '#0a0a0a' }}>
                    Live Chat
                    {totalUnreadCount > 0 && (
                        <span style={{ marginLeft: '8px', backgroundColor: '#ef4444', color: '#fff', fontSize: '8px', fontWeight: 900, padding: '2px 6px', borderRadius: '99px' }}>
                            {totalUnreadCount}
                        </span>
                    )}
                </p>
                <p style={{ fontSize: '10px', color: 'rgba(45,50,62,0.4)', marginTop: '2px' }}>{conversations.length} conversations</p>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', width: '100%' }}>
                {conversations.length === 0 ? (
                    <div style={{ padding: '32px 20px', textAlign: 'center', color: 'rgba(45,50,62,0.3)', fontSize: '11px' }}>
                        No conversations yet
                    </div>
                ) : conversations.map(conv => (
                    <div key={conv.id} onClick={() => openConversation(conv)}
                        style={{
                            width: '100%',
                            boxSizing: 'border-box',
                            padding: '14px 20px',
                            cursor: 'pointer',
                            borderBottom: '1px solid #f5f5f7',
                            backgroundColor: selected?.id === conv.id ? '#fafafa' : '#fff',
                            boxShadow: selected?.id === conv.id ? 'inset 3px 0 0 #0a0a0a' : 'none',
                            transition: 'all 0.1s',
                        }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', marginBottom: '5px' }}>
                            <p style={{
                                fontSize: '13px',
                                fontWeight: 700,
                                color: '#0a0a0a',
                                minWidth: 0,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                flex: 1,
                            }}>
                                {conv.user_name}
                            </p>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                                {conv.unread > 0 && (
                                    <span style={{ backgroundColor: '#ef4444', color: '#fff', fontSize: '8px', fontWeight: 900, width: '16px', height: '16px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        {conv.unread}
                                    </span>
                                )}
                                <span style={{ fontSize: '10px', color: 'rgba(45,50,62,0.35)', whiteSpace: 'nowrap' }}>
                                    {formatDate(conv.last_message_at)}
                                </span>
                            </div>
                        </div>
                        <p style={{ fontSize: '11px', color: 'rgba(45,50,62,0.5)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {conv.last_message || 'No messages yet'}
                        </p>
                        {conv.status === 'closed' && (
                            <span style={{ fontSize: '8px', fontWeight: 700, color: 'rgba(45,50,62,0.3)', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginTop: '4px' }}>Closed</span>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );

    // ── Chat panel ─────────────────────────────────────────────────────────────
    const ChatPanel = (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            {!selected ? (
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '12px', color: 'rgba(45,50,62,0.3)' }}>
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                    <p style={{ fontSize: '12px', fontWeight: 600 }}>Select a conversation</p>
                </div>
            ) : (
                <>
                    {/* Chat header */}
                    <div style={{ padding: '14px 16px', borderBottom: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                            {/* Back button — mobile only */}
                            <button onClick={() => setMobileView('list')} className="chat-back-btn"
                                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: '#0a0a0a', flexShrink: 0, display: 'none' }}>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
                            </button>
                            <div style={{ minWidth: 0 }}>
                                <p style={{ fontSize: '13px', fontWeight: 700, color: '#0a0a0a' }}>{selected.user_name}</p>
                                <p style={{ fontSize: '10px', color: 'rgba(45,50,62,0.4)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{selected.user_email}</p>
                            </div>
                        </div>
                        {selected.status === 'open' && (
                            <button onClick={closeConversation}
                                style={{ fontSize: '9px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(45,50,62,0.4)', background: 'none', border: '1px solid #f0f0f0', padding: '6px 10px', cursor: 'pointer', flexShrink: 0, whiteSpace: 'nowrap' }}>
                                Close
                            </button>
                        )}
                        {selected.status === 'closed' && (
                            <span style={{ fontSize: '9px', fontWeight: 700, color: 'rgba(45,50,62,0.35)', textTransform: 'uppercase', letterSpacing: '0.1em', flexShrink: 0 }}>Closed</span>
                        )}
                    </div>
                    {/* Messages */}
                    <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {loadingMessages ? (
                            <div style={{ textAlign: 'center', color: 'rgba(45,50,62,0.3)', fontSize: '11px', marginTop: '40px' }}>Loading...</div>
                        ) : messages.map(msg => (
                            <div key={msg.id} style={{ display: 'flex', flexDirection: msg.sender_type === 'admin' ? 'row-reverse' : 'row', gap: '10px', alignItems: 'flex-end' }}>
                                <div style={{ maxWidth: '75%' }}>
                                    <p style={{ fontSize: '9px', color: 'rgba(45,50,62,0.35)', marginBottom: '3px', textAlign: msg.sender_type === 'admin' ? 'right' : 'left' }}>
                                        {msg.sender_type === 'admin' ? admin.name : selected.user_name}
                                    </p>
                                    <div style={{ padding: '10px 14px', backgroundColor: msg.sender_type === 'admin' ? '#0a0a0a' : '#f5f5f7', color: msg.sender_type === 'admin' ? '#fff' : '#0a0a0a', fontSize: '12px', lineHeight: 1.6, borderRadius: msg.sender_type === 'admin' ? '12px 12px 0 12px' : '12px 12px 12px 0' }}>
                                        {msg.body}
                                    </div>
                                    <p style={{ fontSize: '9px', color: 'rgba(45,50,62,0.3)', marginTop: '3px', textAlign: msg.sender_type === 'admin' ? 'right' : 'left' }}>
                                        {formatTime(msg.created_at)}
                                    </p>
                                </div>
                            </div>
                        ))}
                        <div ref={bottomRef} />
                    </div>
                    {/* Input */}
                    {selected.status === 'closed' ? (
                        <div style={{ padding: '14px 16px', borderTop: '1px solid #f0f0f0', textAlign: 'center', fontSize: '11px', color: 'rgba(45,50,62,0.4)', fontWeight: 600, flexShrink: 0 }}>
                            Conversation closed — user can reopen by sending a new message
                        </div>
                    ) : (
                        <div style={{ padding: '12px 16px', borderTop: '1px solid #f0f0f0', display: 'flex', gap: '8px', flexShrink: 0 }}>
                            <input ref={inputRef} value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKey}
                                placeholder={`Reply to ${selected.user_name}...`} maxLength={1000}
                                style={{ flex: 1, minWidth: 0, padding: '10px 14px', border: '1px solid #f0f0f0', outline: 'none', fontSize: '12px', fontFamily: 'inherit', backgroundColor: '#fafafa' }} />
                            <button onClick={sendMessage} disabled={!input.trim() || sending}
                                style={{ backgroundColor: input.trim() ? '#0a0a0a' : '#f0f0f0', color: input.trim() ? '#fff' : '#999', border: 'none', padding: '10px 16px', cursor: input.trim() ? 'pointer' : 'default', fontSize: '11px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'inherit', transition: 'all 0.15s', flexShrink: 0 }}>
                                Send
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );

    return (
        <AdminLayout adminName={admin.name} active="chat" pageTitle="Live Chat — Admin" pageLabel="Live Chat">
            <Head title="Live Chat — Admin" />

            <div className="chat-container" style={{ height: 'calc(100vh - 64px)', overflow: 'hidden', border: '1px solid #f0f0f0', backgroundColor: '#fff' }}>

                {/* Conversation list */}
                <div className={`chat-list-panel${mobileView === 'chat' ? ' mobile-hidden' : ''}`}
                    style={{ borderRight: '1px solid #f0f0f0', overflow: 'hidden', width: '380px', flexShrink: 0 }}>
                    {ConvList}
                </div>

                {/* Chat panel */}
                <div className={`chat-main-panel${mobileView === 'list' && !selected ? ' mobile-hidden' : ''}`}
                    style={{ overflow: 'hidden', flex: 1, minWidth: 0 }}>
                    {ChatPanel}
                </div>
            </div>

            <style>{`
                /* Desktop: side by side */
                .chat-container {
                    display: flex;
                }
                .chat-list-panel { width: 380px; flex-shrink: 0; height: 100%; }
                .chat-main-panel { flex: 1; height: 100%; }
                .mobile-hidden   { display: flex !important; }
                .chat-back-btn   { display: none !important; }

                /* Mobile: full-width toggled views */
                @media (max-width: 767px) {
                    .chat-container  { position: relative; }
                    .chat-list-panel { width: 100%; position: absolute; inset: 0; background: #fff; z-index: 1; }
                    .chat-main-panel { width: 100%; position: absolute; inset: 0; background: #fff; z-index: 2; }
                    .chat-list-panel.mobile-hidden { display: none !important; }
                    .chat-main-panel.mobile-hidden { display: none !important; }
                    .chat-back-btn { display: flex !important; }
                }
            `}</style>
        </AdminLayout>
    );
}
