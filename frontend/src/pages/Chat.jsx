import { useState, useEffect, useRef } from 'react';
import { useChat } from '../context/ChatContext';
import { format } from 'date-fns';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';

export default function Chat() {
    const { messages, loading, chatHistory, loadHistory, loadChat, newChat, deleteChat, sendMessage } = useChat();
    const [input, setInput] = useState('');
    const endRef = useRef(null);

    useEffect(() => { loadHistory(); }, []);
    useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!input.trim() || loading) return;
        sendMessage(input);
        setInput('');
    };

    return (
        <div className="page-body animate-in" style={{ display: 'flex', gap: 24, height: 'calc(100vh - 120px)', paddingBottom: 0 }}>
            {/* Sidebar History */}
            <div className="glass-card" style={{ width: 300, display: 'flex', flexDirection: 'column', background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)' }}>
                <div style={{ padding: 20, borderBottom: '1px solid var(--glass-border)' }}>
                    <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={newChat}>
                        ➕ New Chat
                    </button>
                </div>
                <div style={{ flex: 1, overflowY: 'auto', padding: 12 }}>
                    {chatHistory.map((chat) => (
                        <div key={chat._id} className="glass-card" style={{ padding: '12px 16px', marginBottom: 8, cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }} onClick={() => loadChat(chat._id)}>
                            <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 13, fontWeight: 500 }}>
                                {chat.title}
                            </div>
                            <button className="btn-icon" style={{ padding: 4, background: 'none', border: 'none' }} onClick={(e) => { e.stopPropagation(); deleteChat(chat._id); }}>
                                🗑️
                            </button>
                        </div>
                    ))}
                    {chatHistory.length === 0 && (
                        <div className="empty-state" style={{ padding: 20 }}>
                            <span style={{ fontSize: 24 }}>💬</span>
                            <p style={{ fontSize: 13 }}>No recent chats</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Chat Area */}
            <div className="glass-card" style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)', boxShadow: 'var(--shadow-md)' }}>
                {messages.length === 0 ? (
                    <div className="empty-state" style={{ flex: 1 }}>
                        <div style={{ fontSize: 64, marginBottom: 20 }}>🤖</div>
                        <h2 style={{ marginBottom: 10 }}>PlacementBot is ready to help!</h2>
                        <p style={{ maxWidth: 400 }}>Ask about interview tips, company patterns, resume structuring, or skill development.</p>
                        <div style={{ display: 'flex', gap: 10, marginTop: 30, flexWrap: 'wrap', justifyContent: 'center' }}>
                            {['How should I prepare for a Google interview?', 'Review my resume structure', 'What are top DSA topics?'].map((q) => (
                                <button key={q} className="btn btn-secondary" onClick={() => sendMessage(q)}>{q}</button>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div style={{ flex: 1, overflowY: 'auto', padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
                        {messages.map((msg, i) => (
                            <div key={i} style={{ display: 'flex', gap: 16, flexDirection: msg.role === 'user' ? 'row-reverse' : 'row' }}>
                                <div style={{
                                    width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
                                    background: msg.role === 'user' ? 'linear-gradient(135deg, var(--accent), var(--cyan))' : 'rgba(99,102,241,0.2)'
                                }}>
                                    {msg.role === 'user' ? '👤' : '🤖'}
                                </div>
                                <div style={{
                                    maxWidth: '75%', padding: '16px 20px', borderRadius: 'var(--radius-lg)',
                                    background: msg.role === 'user' ? 'var(--bubble-user-bg)' : 'var(--bubble-ai-bg)',
                                    color: msg.role === 'user' ? 'var(--bubble-user-text)' : 'var(--bubble-ai-text)',
                                    border: msg.role === 'assistant' ? '1px solid var(--bubble-ai-border)' : 'none',
                                    boxShadow: 'var(--shadow-sm)',
                                    lineHeight: 1.7, fontSize: 15,
                                }}>
                                    {msg.role === 'user' ? (
                                        <span style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</span>
                                    ) : (
                                        <div className="chat-markdown">
                                            <ReactMarkdown 
                                                remarkPlugins={[remarkGfm]} 
                                                rehypePlugins={[rehypeRaw]}
                                            >
                                                {msg.content}
                                            </ReactMarkdown>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                        {loading && (
                            <div style={{ display: 'flex', gap: 16 }}>
                                <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(99,102,241,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🤖</div>
                                <div style={{ padding: '16px 20px', borderRadius: 'var(--radius-lg)', background: 'var(--glass)', border: '1px solid var(--border)' }}>
                                    <span className="spinner" style={{ display: 'inline-block', width: 16, height: 16, borderTopColor: 'var(--accent)' }} />
                                </div>
                            </div>
                        )}
                        <div ref={endRef} />
                    </div>
                )}

                {/* Input */}
                <form onSubmit={handleSubmit} style={{ padding: 20, borderTop: '1px solid var(--glass-border)', display: 'flex', gap: 12 }}>
                    <input
                        className="form-input"
                        style={{ borderRadius: 100, padding: '14px 24px', flex: 1 }}
                        placeholder="Type your placement question here..."
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                    />
                    <button type="submit" className="btn btn-primary" style={{ borderRadius: 100, width: 48, height: 48, padding: 0, justifyContent: 'center' }} disabled={!input.trim() || loading}>
                        <span style={{ transform: 'rotate(-45deg)', marginLeft: 4 }}>🚀</span>
                    </button>
                </form>
            </div>
        </div>
    );
}
