import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { ChatMessage } from '@/types/models';
import { MessageType, MESSAGE_TYPE } from '@/types/enums';

interface SendPayload {
    text:         string;
    message_type: MessageType;
}

interface Props {
    userId: number | null;
}

export default function ChatWidget({ userId }: Props) {
    // ─── STATE ───
    const [open, setOpen]               = useState(false);
    const [messages, setMessages]       = useState<ChatMessage[]>([]);
    const [input, setInput]             = useState('');
    const [conversationId, setConversationId] = useState<number | null>(null);
    const [status, setStatus]           = useState<'open' | 'closed'>('open');
    const [unread, setUnread]           = useState(0);
    const [loading, setLoading]         = useState(false);
    const [sending, setSending]         = useState(false);

    // ─── REFS ───
    const bottomRef   = useRef<HTMLDivElement>(null);
    const inputRef    = useRef<HTMLInputElement>(null);
    const loadedRef   = useRef(false);
    const openRef     = useRef(false);

    useEffect(() => { openRef.current = open; }, [open]);

    // ─── EFFECT: BOOTSTRAP ───
    useEffect(() => {
        if (!userId) return;

        axios.get('/chat/unread')
            .then(r => {
                setUnread(r.data.unread);
                setConversationId(r.data.conversation_id);
            })
            .catch(err => console.error('Initial chat bootstrap failed', err));
    }, [userId]);

    // ─── EFFECT: PUSHER SUBSCRIPTION ───
    useEffect(() => {
        // @ts-ignore
        if (!conversationId || typeof window.Echo === 'undefined') return;

        // @ts-ignore
        const channel = window.Echo.private(`chat.${conversationId}`)
            .listen('.chat.message', (data: { id: number; sender_type: 'user' | 'admin'; message_type: MessageType; created_at: string }) => {
                if (data.sender_type === 'admin') {
                    // Fetch the decrypted content — broadcast carries no text
                    axios.get<ChatMessage>(`/chat/message/${data.id}`)
                        .then(r => {
                            setMessages(prev => [...prev, r.data]);

                            if (openRef.current) {
                                axios.post('/chat/read').catch(() => {});
                            } else {
                                setUnread(u => u + 1);
                            }
                        })
                        .catch(() => {});
                }
            });

        return () => {
            // @ts-ignore
            window.Echo.leave(`chat.${conversationId}`);
        };
    }, [conversationId]);

    // ─── EFFECT: LOAD HISTORY ───
    useEffect(() => {
        if (!open || loadedRef.current || !userId) return;

        setLoading(true);
        axios.get('/chat/conversation')
            .then(r => {
                setMessages(r.data.messages);
                setStatus(r.data.status);
                loadedRef.current = true;
                setUnread(0);

                setTimeout(() => { bottomRef.current?.scrollIntoView({ behavior: 'auto' }); }, 100);
            })
            .catch(err => console.error('Could not load history', err))
            .finally(() => setLoading(false));
    }, [open, userId]);

    // ─── EFFECT: SCROLL ON RE-OPEN ───
    useEffect(() => {
        if (open && loadedRef.current) {
            const timer = setTimeout(() => { bottomRef.current?.scrollIntoView({ behavior: 'auto' }); }, 50);
            return () => clearTimeout(timer);
        }
    }, [open]);

    // ─── EFFECT: NEW MESSAGE SCROLL ───
    useEffect(() => {
        if (open && !loading && messages.length > 0) {
            bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, open, loading]);

    // ─── EFFECT: FOCUS & READ STATUS ───
    useEffect(() => {
        if (!open) return;

        setTimeout(() => inputRef.current?.focus(), 100);
        setUnread(0);
        axios.post('/chat/read').catch(() => {});
    }, [open]);

    // ─── HANDLERS ───
    const sendMessage = async () => {
        if (!input.trim() || sending || !userId) return;

        const text = input.trim();
        setInput('');
        setSending(true);

        // Optimistic update — replaced by server-confirmed message on success
        const optimisticId = Date.now();
        setMessages(prev => [...prev, {
            id:           optimisticId,
            sender_type:  'user',
            text,
            message_type: MESSAGE_TYPE.Text,
            edited_at:    null,
            created_at:   new Date().toISOString(),
        }]);

        const payload: SendPayload = { text, message_type: MESSAGE_TYPE.Text };

        try {
            const res = await axios.post<{ ok: boolean; id: number }>('/chat/send', payload);
            // Replace optimistic entry with server-confirmed message
            const confirmed = await axios.get<ChatMessage>(`/chat/message/${res.data.id}`);
            setMessages(prev => prev.map(m => m.id === optimisticId ? confirmed.data : m));
        } catch (err) {
            console.error('Failed to send message', err);
        } finally {
            setSending(false);
        }
    };

    const handleKey = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    const formatTime = (iso: string) =>
        new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    if (!userId) return null;

    return (
        <div style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 1000, fontFamily: 'Inter, system-ui, sans-serif' }}>

            {/* ── CHAT WINDOW ── */}
            {open && (
                <div style={{
                    position: 'absolute', bottom: '72px', right: 0,
                    width: '350px', height: '500px',
                    backgroundColor: '#fff', border: '1px solid #e5e7eb',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                    display: 'flex', flexDirection: 'column', borderRadius: '16px',
                    overflow: 'hidden', animation: 'chatSlideIn 0.2s ease-out'
                }}>
                    {/* Header */}
                    <div style={{ backgroundColor: '#000', color: '#fff', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <h3 style={{ margin: 0, fontSize: '13px', fontWeight: 800, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Support Chat</h3>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                                <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: status === 'open' ? '#22c55e' : '#9ca3af' }}></div>
                                <span style={{ fontSize: '10px', opacity: 0.8 }}>{status === 'open' ? 'Active' : 'Closed'}</span>
                            </div>
                        </div>
                        <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '18px' }}>✕</button>
                    </div>

                    {/* Message Area */}
                    <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px', backgroundColor: '#fdfdfd' }}>
                        {loading ? (
                            <div style={{ textAlign: 'center', fontSize: '11px', color: '#9ca3af', marginTop: '20px' }}>Syncing messages...</div>
                        ) : messages.length === 0 ? (
                            <div style={{ textAlign: 'center', marginTop: '60px', padding: '0 20px' }}>
                                <p style={{ fontSize: '28px', marginBottom: '8px' }}>💬</p>
                                <p style={{ fontSize: '13px', fontWeight: 600, color: '#111827' }}>Need help with an order?</p>
                                <p style={{ fontSize: '11px', color: '#6b7280', lineHeight: 1.5 }}>Our team is here to assist you with tracking, sizing, or returns.</p>
                            </div>
                        ) : (
                            messages.map((msg) => (
                                <div key={msg.id} style={{
                                    display: 'flex',
                                    flexDirection: msg.sender_type === 'user' ? 'row-reverse' : 'row',
                                    alignItems: 'flex-end',
                                    gap: '8px'
                                }}>
                                    <div style={{
                                        maxWidth: '80%',
                                        padding: '10px 14px',
                                        borderRadius: msg.sender_type === 'user' ? '16px 16px 2px 16px' : '16px 16px 16px 2px',
                                        backgroundColor: msg.sender_type === 'user' ? '#000' : '#f3f4f6',
                                        color: msg.sender_type === 'user' ? '#fff' : '#111827',
                                        fontSize: '13px',
                                        lineHeight: 1.4,
                                        boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                                    }}>
                                        {msg.text}
                                        <div style={{ fontSize: '9px', opacity: 0.5, marginTop: '4px', textAlign: 'right' }}>
                                            {formatTime(msg.created_at)}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                        <div ref={bottomRef} style={{ height: '1px' }} />
                    </div>

                    {/* Input Area */}
                    <div style={{ padding: '16px', borderTop: '1px solid #f3f4f6', backgroundColor: '#fff' }}>
                        {status === 'closed' ? (
                            <p style={{ textAlign: 'center', fontSize: '11px', color: '#9ca3af' }}>Conversation archived.</p>
                        ) : (
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                <input
                                    ref={inputRef}
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={handleKey}
                                    placeholder="Message support..."
                                    style={{
                                        flex: 1, border: '1px solid #e5e7eb', borderRadius: '8px',
                                        padding: '10px 12px', fontSize: '13px', outline: 'none',
                                        backgroundColor: '#f9fafb'
                                    }}
                                />
                                <button
                                    onClick={sendMessage}
                                    disabled={!input.trim() || sending}
                                    style={{
                                        backgroundColor: '#000', color: '#fff', border: 'none',
                                        borderRadius: '8px', width: '38px', height: '38px',
                                        cursor: 'pointer', display: 'flex', alignItems: 'center',
                                        justifyContent: 'center', transition: 'opacity 0.2s',
                                        opacity: (!input.trim() || sending) ? 0.4 : 1
                                    }}
                                >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="19" x2="12" y2="5"></line><polyline points="5 12 12 5 19 12"></polyline></svg>
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ── BUBBLE BUTTON ── */}
            <button
                onClick={() => setOpen(!open)}
                style={{
                    width: '60px', height: '60px', borderRadius: '50%',
                    backgroundColor: '#000', color: '#fff', border: 'none',
                    cursor: 'pointer', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)',
                    position: 'relative', transition: 'transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
                {open ? (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                ) : (
                    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                )}

                {/* UNREAD BADGE */}
                {!open && unread > 0 && (
                    <div style={{
                        position: 'absolute', top: '-2px', right: '-2px',
                        backgroundColor: '#ef4444', color: '#fff', fontSize: '10px',
                        fontWeight: 800, minWidth: '22px', height: '22px', borderRadius: '11px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        border: '3px solid #fff', padding: '0 4px'
                    }}>
                        {unread > 9 ? '9+' : unread}
                    </div>
                )}
            </button>

            <style>{`
                @keyframes chatSlideIn {
                    from { opacity: 0; transform: translateY(20px) scale(0.95); }
                    to { opacity: 1; transform: translateY(0) scale(1); }
                }
            `}</style>
        </div>
    );
}
