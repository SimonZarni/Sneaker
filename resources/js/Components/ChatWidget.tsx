import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

interface Message {
    id: number;
    sender_type: 'user' | 'admin';
    body: string;
    created_at: string;
}

interface Props {
    userId: number;
}

export default function ChatWidget({ userId }: Props) {
    const [open, setOpen]                   = useState(false);
    const [messages, setMessages]           = useState<Message[]>([]);
    const [input, setInput]                 = useState('');
    const [conversationId, setConversationId] = useState<number | null>(null);
    const [status, setStatus]               = useState<'open' | 'closed'>('open');
    const [unread, setUnread]               = useState(0);
    const [loading, setLoading]             = useState(false);
    const [sending, setSending]             = useState(false);
    const bottomRef                         = useRef<HTMLDivElement>(null);
    const inputRef                          = useRef<HTMLInputElement>(null);
    const loadedRef                         = useRef(false);
    const openRef                           = useRef(false);

    // Keep openRef in sync so Pusher handler always reads current open state
    useEffect(() => { openRef.current = open; }, [open]);

    // Fetch unread count on mount so badge shows without needing to open chat first
    useEffect(() => {
        axios.get('/chat/unread').then(r => setUnread(r.data.unread)).catch(() => {});
    }, []);

    // Load conversation when widget first opens
    useEffect(() => {
        if (!open || loadedRef.current) return;
        loadedRef.current = true;
        setLoading(true);

        axios.get('/chat/conversation')
            .then(r => {
                setConversationId(r.data.conversation_id);
                setStatus(r.data.status);
                setMessages(r.data.messages);
                setUnread(0);
            })
            .finally(() => setLoading(false));
    }, [open]);

    // Subscribe to Pusher when we have a conversationId
    useEffect(() => {
        // @ts-ignore
        if (!conversationId || typeof window.Echo === 'undefined') return;

        // @ts-ignore
        window.Echo.private(`chat.${conversationId}`)
            .listen('.chat.message', (data: any) => {
                // Only add if it's from admin (user's own messages added optimistically)
                if (data.sender_type === 'admin') {
                    setMessages(prev => [...prev, {
                        id:          data.id,
                        sender_type: 'admin',
                        body:        data.body,
                        created_at:  data.created_at,
                    }]);
                    if (openRef.current) {
                        // Chat is open — mark as read in DB immediately
                        axios.post('/chat/read').catch(() => {});
                    } else {
                        // Chat is closed — increment unread badge
                        setUnread(u => u + 1);
                    }
                }
            });

        return () => {
            // @ts-ignore
            window.Echo.leave(`chat.${conversationId}`);
        };
    }, [conversationId]);

    // Scroll to bottom whenever messages change (new message arrives)
    useEffect(() => {
        if (messages.length > 0) {
            bottomRef.current?.scrollIntoView({ behavior: 'auto' });
        }
    }, [messages]);

    // Scroll to bottom immediately when chat opens (DOM just mounted)
    // Use a small delay so the messages div has fully painted before scrolling.
    useEffect(() => {
        if (!open) return;
        const timer = setTimeout(() => {
            bottomRef.current?.scrollIntoView({ behavior: 'auto' });
        }, 80);
        return () => clearTimeout(timer);
    }, [open]);

    // Focus input when opened
    useEffect(() => {
        if (open) {
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [open]);

    // Mark messages as read in DB + clear badge whenever chat is open
    // Runs when: chat opens (open changes to true) OR conversationId first loads
    // while chat is already open. Does NOT run when chat is closed.
    useEffect(() => {
        if (!open || !conversationId) return;
        setUnread(0);
        axios.post('/chat/read').catch(() => {});
    }, [open, conversationId]);

    // Poll for unread when chat is closed — runs regardless of whether
    // chat has ever been opened so badge always reflects current state.
    useEffect(() => {
        if (open) return;
        const interval = setInterval(() => {
            axios.get('/chat/unread').then(r => setUnread(r.data.unread)).catch(() => {});
        }, 30000);
        return () => clearInterval(interval);
    }, [open]);

    const sendMessage = async () => {
        if (!input.trim() || sending) return;
        const body = input.trim();
        setInput('');
        setSending(true);

        // Optimistic — add message immediately
        const tempMsg: Message = {
            id:          Date.now(),
            sender_type: 'user',
            body,
            created_at:  new Date().toISOString(),
        };
        setMessages(prev => [...prev, tempMsg]);

        try {
            await axios.post('/chat/send', { body });
        } catch {
            // Silent fail — message already shown optimistically
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

    const formatTime = (iso: string) => {
        return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 1000 }}>

            {/* ── Chat Window ── */}
            {open && (
                <div style={{
                    position: 'absolute', bottom: '64px', right: 0,
                    width: '340px', height: '480px',
                    backgroundColor: '#fff', border: '1px solid #f0f0f0',
                    boxShadow: '0 16px 48px rgba(0,0,0,0.16)',
                    display: 'flex', flexDirection: 'column',
                    animation: 'chatSlideUp 0.2s ease',
                }}>
                    {/* Header */}
                    <div style={{ backgroundColor: '#0a0a0a', padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                            <p style={{ fontSize: '11px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.15em', color: '#fff' }}>
                                SNEAKER.DRP Support
                            </p>
                            <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.45)', marginTop: '2px' }}>
                                {status === 'closed' ? 'Conversation closed' : 'We typically reply within minutes'}
                            </p>
                        </div>
                        <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontSize: '18px', padding: 0 }}>✕</button>
                    </div>

                    {/* Messages */}
                    <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {loading ? (
                            <div style={{ textAlign: 'center', color: 'rgba(45,50,62,0.3)', fontSize: '11px', marginTop: '40px' }}>Loading...</div>
                        ) : messages.length === 0 ? (
                            <div style={{ textAlign: 'center', marginTop: '40px' }}>
                                <p style={{ fontSize: '24px', marginBottom: '8px' }}>👟</p>
                                <p style={{ fontSize: '11px', fontWeight: 700, color: '#0a0a0a', marginBottom: '4px' }}>How can we help?</p>
                                <p style={{ fontSize: '10px', color: 'rgba(45,50,62,0.45)', lineHeight: 1.6 }}>Send us a message and we'll get back to you as soon as possible.</p>
                            </div>
                        ) : (
                            messages.map(msg => (
                                <div key={msg.id} style={{ display: 'flex', flexDirection: msg.sender_type === 'user' ? 'row-reverse' : 'row', gap: '8px', alignItems: 'flex-end' }}>
                                    {msg.sender_type === 'admin' && (
                                        <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: '#0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', flexShrink: 0 }}>
                                            S
                                        </div>
                                    )}
                                    <div style={{ maxWidth: '70%' }}>
                                        <div style={{
                                            padding: '8px 12px',
                                            backgroundColor: msg.sender_type === 'user' ? '#0a0a0a' : '#f5f5f7',
                                            color: msg.sender_type === 'user' ? '#fff' : '#0a0a0a',
                                            fontSize: '12px', lineHeight: 1.5,
                                            borderRadius: msg.sender_type === 'user' ? '12px 12px 0 12px' : '12px 12px 12px 0',
                                        }}>
                                            {msg.body}
                                        </div>
                                        <p style={{ fontSize: '9px', color: 'rgba(45,50,62,0.35)', marginTop: '3px', textAlign: msg.sender_type === 'user' ? 'right' : 'left' }}>
                                            {formatTime(msg.created_at)}
                                        </p>
                                    </div>
                                </div>
                            ))
                        )}
                        <div ref={bottomRef} />
                    </div>

                    {/* Input */}
                    {status === 'closed' ? (
                        <div style={{ padding: '12px 16px', borderTop: '1px solid #f0f0f0', textAlign: 'center', fontSize: '10px', color: 'rgba(45,50,62,0.4)', fontWeight: 600 }}>
                            This conversation has been closed
                        </div>
                    ) : (
                        <div style={{ padding: '12px', borderTop: '1px solid #f0f0f0', display: 'flex', gap: '8px' }}>
                            <input
                                ref={inputRef}
                                value={input}
                                onChange={e => setInput(e.target.value)}
                                onKeyDown={handleKey}
                                placeholder="Type a message..."
                                maxLength={1000}
                                style={{
                                    flex: 1, padding: '8px 12px',
                                    border: '1px solid #f0f0f0', outline: 'none',
                                    fontSize: '12px', backgroundColor: '#fafafa',
                                    fontFamily: 'inherit',
                                }}
                            />
                            <button
                                onClick={sendMessage}
                                disabled={!input.trim() || sending}
                                style={{
                                    backgroundColor: input.trim() ? '#0a0a0a' : '#f0f0f0',
                                    color: input.trim() ? '#fff' : '#999',
                                    border: 'none', padding: '8px 14px',
                                    cursor: input.trim() ? 'pointer' : 'default',
                                    fontSize: '14px', transition: 'all 0.15s',
                                }}
                            >
                                ↑
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* ── Bubble button ── */}
            <button
                onClick={() => setOpen(v => !v)}
                style={{
                    width: '52px', height: '52px', borderRadius: '50%',
                    backgroundColor: '#0a0a0a', color: '#fff',
                    border: 'none', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    position: 'relative',
                }}
                onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.08)')}
                onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
                aria-label="Open support chat"
            >
                {open ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
                ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                )}
                {!open && unread > 0 && (
                    <span style={{
                        position: 'absolute', top: '-2px', right: '-2px',
                        backgroundColor: '#ef4444', color: '#fff',
                        fontSize: '8px', fontWeight: 900,
                        width: '18px', height: '18px', borderRadius: '50%',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                        {unread > 9 ? '9+' : unread}
                    </span>
                )}
            </button>

            <style>{`@keyframes chatSlideUp { from { transform: translateY(12px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }`}</style>
        </div>
    );
}
