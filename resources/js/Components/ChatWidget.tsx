// import React, { useState, useEffect, useRef } from 'react';
// import axios from 'axios';

// interface Message {
//     id: number;
//     sender_type: 'user' | 'admin';
//     body: string;
//     created_at: string;
// }

// interface Props {
//     userId: number;
// }

// export default function ChatWidget({ userId }: Props) {
//     const [open, setOpen]                     = useState(false);
//     const [messages, setMessages]             = useState<Message[]>([]);
//     const [input, setInput]                   = useState('');
//     const [conversationId, setConversationId] = useState<number | null>(null);
//     const [status, setStatus]                 = useState<'open' | 'closed'>('open');
//     const [unread, setUnread]                 = useState(0);
//     const [loading, setLoading]               = useState(false);
//     const [sending, setSending]               = useState(false);
//     const bottomRef                           = useRef<HTMLDivElement>(null);
//     const inputRef                            = useRef<HTMLInputElement>(null);
//     const loadedRef                           = useRef(false);
//     // Ref so Pusher listener always reads current open state (avoids stale closure)
//     const openRef                             = useRef(false);

//     // Keep openRef in sync with open state
//     useEffect(() => { openRef.current = open; }, [open]);

//     // Load conversation on first open
//     useEffect(() => {
//         if (!open || loadedRef.current) return;
//         loadedRef.current = true;
//         setLoading(true);
//         axios.get('/chat/conversation')
//             .then(r => {
//                 setConversationId(r.data.conversation_id);
//                 setStatus(r.data.status);
//                 setMessages(r.data.messages);
//                 setUnread(0);
//             })
//             .finally(() => setLoading(false));
//     }, [open]);

//     // Subscribe to Pusher when we have a conversationId
//     useEffect(() => {
//         // @ts-ignore
//         if (!conversationId || typeof window.Echo === 'undefined') return;
//         // @ts-ignore
//         window.Echo.private(`chat.${conversationId}`)
//             .listen('.chat.message', (data: any) => {
//                 if (data.sender_type === 'admin') {
//                     setMessages(prev => [...prev, {
//                         id:          data.id,
//                         sender_type: 'admin',
//                         body:        data.body,
//                         created_at:  data.created_at,
//                     }]);
//                     if (openRef.current) {
//                         // Chat is open — mark as read in DB immediately
//                         axios.post('/chat/read').catch(() => {});
//                     } else {
//                         // Chat is closed — show badge
//                         setUnread(u => u + 1);
//                     }
//                 }
//             });
//         return () => {
//             // @ts-ignore
//             window.Echo.leave(`chat.${conversationId}`);
//         };
//     }, [conversationId]);

//     // Scroll to bottom on new messages
//     useEffect(() => {
//         if (messages.length > 0) {
//             bottomRef.current?.scrollIntoView({ behavior: 'auto' });
//         }
//     }, [messages]);

//     // Scroll to bottom when chat opens (fresh DOM mount after close)
//     useEffect(() => {
//         if (!open) return;
//         const t = setTimeout(() => {
//             bottomRef.current?.scrollIntoView({ behavior: 'auto' });
//         }, 80);
//         return () => clearTimeout(t);
//     }, [open]);

//     // Focus input + clear badge when opened, mark read in DB on re-opens
//     useEffect(() => {
//         if (!open) return;
//         setTimeout(() => inputRef.current?.focus(), 100);
//         setUnread(0);
//         // Mark read in DB — covers re-opens where loadedRef prevents
//         // /chat/conversation from running again
//         axios.post('/chat/read').catch(() => {});
//     }, [open]);

//     // Poll for unread ONLY when chat is closed AND conversationId exists.
//     // The poll calls markRead before reading the count so it never
//     // resurfaces messages the user has already read.
//     useEffect(() => {
//         if (open || !conversationId) return;
//         const interval = setInterval(async () => {
//             try {
//                 await axios.post('/chat/read');
//                 const r = await axios.get('/chat/unread');
//                 setUnread(r.data.unread);
//             } catch {}
//         }, 30000);
//         return () => clearInterval(interval);
//     }, [open, conversationId]);

//     const sendMessage = async () => {
//         if (!input.trim() || sending) return;
//         const body = input.trim();
//         setInput('');
//         setSending(true);
//         setMessages(prev => [...prev, {
//             id:          Date.now(),
//             sender_type: 'user',
//             body,
//             created_at:  new Date().toISOString(),
//         }]);
//         try {
//             await axios.post('/chat/send', { body });
//         } catch {
//             // Silent fail — message already shown optimistically
//         } finally {
//             setSending(false);
//         }
//     };

//     const handleKey = (e: React.KeyboardEvent) => {
//         if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
//     };

//     const formatTime = (iso: string) =>
//         new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

//     return (
//         <div style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 1000 }}>

//             {/* ── Chat Window ── */}
//             {open && (
//                 <div style={{
//                     position: 'absolute', bottom: '64px', right: 0,
//                     width: '340px', height: '480px',
//                     backgroundColor: '#fff', border: '1px solid #f0f0f0',
//                     boxShadow: '0 16px 48px rgba(0,0,0,0.16)',
//                     display: 'flex', flexDirection: 'column',
//                     animation: 'chatSlideUp 0.2s ease',
//                 }}>
//                     {/* Header */}
//                     <div style={{ backgroundColor: '#0a0a0a', padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
//                         <div>
//                             <p style={{ fontSize: '11px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.15em', color: '#fff' }}>
//                                 SNEAKER.DRP Support
//                             </p>
//                             <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.45)', marginTop: '2px' }}>
//                                 {status === 'closed' ? 'Conversation closed' : 'We typically reply within minutes'}
//                             </p>
//                         </div>
//                         <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontSize: '18px', padding: 0 }}>✕</button>
//                     </div>

//                     {/* Messages */}
//                     <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
//                         {loading ? (
//                             <div style={{ textAlign: 'center', color: 'rgba(45,50,62,0.3)', fontSize: '11px', marginTop: '40px' }}>Loading...</div>
//                         ) : messages.length === 0 ? (
//                             <div style={{ textAlign: 'center', marginTop: '40px' }}>
//                                 <p style={{ fontSize: '24px', marginBottom: '8px' }}>👟</p>
//                                 <p style={{ fontSize: '11px', fontWeight: 700, color: '#0a0a0a', marginBottom: '4px' }}>How can we help?</p>
//                                 <p style={{ fontSize: '10px', color: 'rgba(45,50,62,0.45)', lineHeight: 1.6 }}>Send us a message and we'll get back to you as soon as possible.</p>
//                             </div>
//                         ) : messages.map(msg => (
//                             <div key={msg.id} style={{ display: 'flex', flexDirection: msg.sender_type === 'user' ? 'row-reverse' : 'row', gap: '8px', alignItems: 'flex-end' }}>
//                                 {msg.sender_type === 'admin' && (
//                                     <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: '#0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', flexShrink: 0 }}>S</div>
//                                 )}
//                                 <div style={{ maxWidth: '70%' }}>
//                                     <div style={{
//                                         padding: '8px 12px',
//                                         backgroundColor: msg.sender_type === 'user' ? '#0a0a0a' : '#f5f5f7',
//                                         color: msg.sender_type === 'user' ? '#fff' : '#0a0a0a',
//                                         fontSize: '12px', lineHeight: 1.5,
//                                         borderRadius: msg.sender_type === 'user' ? '12px 12px 0 12px' : '12px 12px 12px 0',
//                                     }}>
//                                         {msg.body}
//                                     </div>
//                                     <p style={{ fontSize: '9px', color: 'rgba(45,50,62,0.35)', marginTop: '3px', textAlign: msg.sender_type === 'user' ? 'right' : 'left' }}>
//                                         {formatTime(msg.created_at)}
//                                     </p>
//                                 </div>
//                             </div>
//                         ))}
//                         <div ref={bottomRef} />
//                     </div>

//                     {/* Input */}
//                     {status === 'closed' ? (
//                         <div style={{ padding: '12px 16px', borderTop: '1px solid #f0f0f0', textAlign: 'center', fontSize: '10px', color: 'rgba(45,50,62,0.4)', fontWeight: 600 }}>
//                             This conversation has been closed
//                         </div>
//                     ) : (
//                         <div style={{ padding: '12px', borderTop: '1px solid #f0f0f0', display: 'flex', gap: '8px' }}>
//                             <input
//                                 ref={inputRef}
//                                 value={input}
//                                 onChange={e => setInput(e.target.value)}
//                                 onKeyDown={handleKey}
//                                 placeholder="Type a message..."
//                                 maxLength={1000}
//                                 style={{ flex: 1, padding: '8px 12px', border: '1px solid #f0f0f0', outline: 'none', fontSize: '12px', backgroundColor: '#fafafa', fontFamily: 'inherit' }}
//                             />
//                             <button
//                                 onClick={sendMessage}
//                                 disabled={!input.trim() || sending}
//                                 style={{
//                                     backgroundColor: input.trim() ? '#0a0a0a' : '#f0f0f0',
//                                     color: input.trim() ? '#fff' : '#999',
//                                     border: 'none', padding: '8px 14px',
//                                     cursor: input.trim() ? 'pointer' : 'default',
//                                     fontSize: '14px', transition: 'all 0.15s',
//                                 }}
//                             >↑</button>
//                         </div>
//                     )}
//                 </div>
//             )}

//             {/* ── Bubble button ── */}
//             <button
//                 onClick={() => setOpen(v => !v)}
//                 style={{
//                     width: '52px', height: '52px', borderRadius: '50%',
//                     backgroundColor: '#0a0a0a', color: '#fff',
//                     border: 'none', cursor: 'pointer',
//                     display: 'flex', alignItems: 'center', justifyContent: 'center',
//                     boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
//                     transition: 'transform 0.2s, box-shadow 0.2s',
//                     position: 'relative',
//                 }}
//                 onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.08)')}
//                 onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
//                 aria-label="Open support chat"
//             >
//                 {open ? (
//                     <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
//                 ) : (
//                     <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
//                 )}
//                 {!open && unread > 0 && (
//                     <span style={{
//                         position: 'absolute', top: '-2px', right: '-2px',
//                         backgroundColor: '#ef4444', color: '#fff',
//                         fontSize: '8px', fontWeight: 900,
//                         width: '18px', height: '18px', borderRadius: '50%',
//                         display: 'flex', alignItems: 'center', justifyContent: 'center',
//                     }}>
//                         {unread > 9 ? '9+' : unread}
//                     </span>
//                 )}
//             </button>

//             <style>{`@keyframes chatSlideUp { from { transform: translateY(12px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }`}</style>
//         </div>
//     );
// }

import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

interface Message {
    id: number;
    sender_type: 'user' | 'admin';
    body: string;
    created_at: string;
}

interface Props {
    userId: number | null;
}

export default function ChatWidget({ userId }: Props) {
    // ─── STATE ───
    const [open, setOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [conversationId, setConversationId] = useState<number | null>(null);
    const [status, setStatus] = useState<'open' | 'closed'>('open');
    const [unread, setUnread] = useState(0);
    const [loading, setLoading] = useState(false);
    const [sending, setSending] = useState(false);

    // ─── REFS ───
    const bottomRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const loadedRef = useRef(false);
    // Ref used for the Pusher listener to avoid stale closures
    const openRef = useRef(false);

    // Sync openRef with state
    useEffect(() => {
        openRef.current = open;
    }, [open]);

    // ─── EFFECT: BOOTSTRAP ───
    // Runs once on mount to get the ID and current unread count
    useEffect(() => {
        if (!userId) return;

        axios.get('/chat/unread')
            .then(r => {
                setUnread(r.data.unread);
                setConversationId(r.data.conversation_id);
            })
            .catch(err => console.error("Could not fetch initial chat state", err));
    }, [userId]);

    // ─── EFFECT: PUSHER SUBSCRIPTION ───
    // Activates as soon as conversationId is known, even if widget is closed
    useEffect(() => {
        // @ts-ignore
        if (!conversationId || typeof window.Echo === 'undefined') return;

        // @ts-ignore
        const channel = window.Echo.private(`chat.${conversationId}`)
            .listen('.chat.message', (data: any) => {
                // Only process messages from the admin
                if (data.sender_type === 'admin') {
                    setMessages(prev => [...prev, {
                        id: data.id,
                        sender_type: 'admin',
                        body: data.body,
                        created_at: data.created_at,
                    }]);

                    if (openRef.current) {
                        // If chat is open, tell backend we read it immediately
                        axios.post('/chat/read').catch(() => {});
                    } else {
                        // If chat is closed, increment the badge
                        setUnread(u => u + 1);
                    }
                }
            });

        return () => {
            // @ts-ignore
            window.Echo.leave(`chat.${conversationId}`);
        };
    }, [conversationId]);

    // ─── EFFECT: LOAD HISTORY ───
    // Fetches full message history the first time the user opens the widget
    useEffect(() => {
        if (!open || loadedRef.current || !userId) return;

        setLoading(true);
        axios.get('/chat/conversation')
            .then(r => {
                setMessages(r.data.messages);
                setStatus(r.data.status);
                loadedRef.current = true;
                setUnread(0);
            })
            .catch(err => console.error("Could not load conversation", err))
            .finally(() => setLoading(false));
    }, [open, userId]);

    // ─── EFFECT: UI INTERACTIONS ───
    // Focus input and mark as read when opened
    useEffect(() => {
        if (!open) return;

        // Focus the input field
        const focusTimer = setTimeout(() => inputRef.current?.focus(), 100);

        // Clear badge locally and in DB
        setUnread(0);
        axios.post('/chat/read').catch(() => {});

        return () => clearTimeout(focusTimer);
    }, [open]);

    // Auto-scroll to bottom on new messages
    useEffect(() => {
        if (messages.length > 0) {
            bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages]);

    // ─── HANDLERS ───
    const sendMessage = async () => {
        if (!input.trim() || sending || !userId) return;

        const body = input.trim();
        setInput('');
        setSending(true);

        // Optimistic UI Update
        const tempId = Date.now();
        setMessages(prev => [...prev, {
            id: tempId,
            sender_type: 'user',
            body: body,
            created_at: new Date().toISOString(),
        }]);

        try {
            await axios.post('/chat/send', { body });
        } catch (err) {
            console.error("Message failed to send", err);
            // Optional: Mark the message as "failed" in the UI here
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

    // Do not render if the user is not logged in
    if (!userId) return null;

    return (
        <div style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 1000, fontFamily: 'sans-serif' }}>

            {/* ── CHAT WINDOW ── */}
            {open && (
                <div style={{
                    position: 'absolute', bottom: '70px', right: 0,
                    width: '360px', height: '500px',
                    backgroundColor: '#fff', border: '1px solid #e5e7eb',
                    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                    display: 'flex', flexDirection: 'column', borderRadius: '12px',
                    overflow: 'hidden', animation: 'chatFadeIn 0.2s ease-out'
                }}>
                    {/* Header */}
                    <div style={{ backgroundColor: '#000', color: '#fff', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 700, letterSpacing: '0.05em' }}>SNEAKER.DRP SUPPORT</h3>
                            <span style={{ fontSize: '10px', opacity: 0.7 }}>
                                {status === 'closed' ? 'Conversation Closed' : 'Online'}
                            </span>
                        </div>
                        <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '18px' }}>✕</button>
                    </div>

                    {/* Message Area */}
                    <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px', backgroundColor: '#f9fafb' }}>
                        {loading ? (
                            <div style={{ textAlign: 'center', fontSize: '12px', color: '#9ca3af', marginTop: '20px' }}>Loading history...</div>
                        ) : messages.length === 0 ? (
                            <div style={{ textAlign: 'center', marginTop: '40px', color: '#6b7280' }}>
                                <p style={{ fontSize: '24px' }}>👟</p>
                                <p style={{ fontSize: '12px', fontWeight: 600 }}>How can we help you today?</p>
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
                                        borderRadius: msg.sender_type === 'user' ? '14px 14px 2px 14px' : '14px 14px 14px 2px',
                                        backgroundColor: msg.sender_type === 'user' ? '#000' : '#fff',
                                        color: msg.sender_type === 'user' ? '#fff' : '#1f2937',
                                        fontSize: '13px',
                                        boxShadow: msg.sender_type === 'user' ? 'none' : '0 1px 2px rgba(0,0,0,0.05)',
                                        border: msg.sender_type === 'user' ? 'none' : '1px solid #f3f4f6'
                                    }}>
                                        {msg.body}
                                        <div style={{ fontSize: '9px', opacity: 0.5, marginTop: '4px', textAlign: 'right' }}>
                                            {formatTime(msg.created_at)}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                        <div ref={bottomRef} />
                    </div>

                    {/* Input Area */}
                    <div style={{ padding: '16px', borderTop: '1px solid #f3f4f6', backgroundColor: '#fff' }}>
                        {status === 'closed' ? (
                            <p style={{ textAlign: 'center', fontSize: '11px', color: '#9ca3af' }}>This conversation is closed.</p>
                        ) : (
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <input
                                    ref={inputRef}
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={handleKey}
                                    placeholder="Type your message..."
                                    style={{
                                        flex: 1, border: '1px solid #e5e7eb', borderRadius: '6px',
                                        padding: '8px 12px', fontSize: '13px', outline: 'none'
                                    }}
                                />
                                <button
                                    onClick={sendMessage}
                                    disabled={!input.trim() || sending}
                                    style={{
                                        backgroundColor: '#000', color: '#fff', border: 'none',
                                        borderRadius: '6px', padding: '8px 16px', cursor: 'pointer',
                                        opacity: (!input.trim() || sending) ? 0.5 : 1
                                    }}
                                >
                                    ↑
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
                    width: '56px', height: '56px', borderRadius: '50%',
                    backgroundColor: '#000', color: '#fff', border: 'none',
                    cursor: 'pointer', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                    position: 'relative', transition: 'transform 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
                {open ? (
                    <span style={{ fontSize: '20px' }}>✕</span>
                ) : (
                    <span style={{ fontSize: '24px' }}>💬</span>
                )}

                {/* UNREAD BADGE */}
                {!open && unread > 0 && (
                    <div style={{
                        position: 'absolute', top: '-4px', right: '-4px',
                        backgroundColor: '#ef4444', color: '#fff', fontSize: '10px',
                        fontWeight: 700, width: '20px', height: '20px', borderRadius: '50%',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        border: '2px solid #fff'
                    }}>
                        {unread > 9 ? '9+' : unread}
                    </div>
                )}
            </button>

            <style>{`
                @keyframes chatFadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
}
