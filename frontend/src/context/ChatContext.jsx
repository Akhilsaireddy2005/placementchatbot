import { createContext, useContext, useState, useRef } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';

const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
    const [messages, setMessages] = useState([]);
    const [chatId, setChatId] = useState(null);
    const [loading, setLoading] = useState(false);
    const [chatHistory, setChatHistory] = useState([]);

    const sendMessage = async (content) => {
        const userMsg = { role: 'user', content, timestamp: new Date() };
        setMessages((prev) => [...prev, userMsg]);
        setLoading(true);

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'}/chat/send`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ message: content, chatId, stream: true })
            });

            if (!response.ok) throw new Error('Failed to send message');

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            
            // Add initial assistant message for streaming
            setMessages((prev) => [...prev, { role: 'assistant', content: '', timestamp: new Date() }]);
            let currentAiContent = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value);
                const lines = chunk.split('\n');

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const dataString = line.slice(6).trim();
                        if (dataString === '[DONE]') continue;
                        
                        try {
                            const parsed = JSON.parse(dataString);
                            if (parsed.chatId) {
                                setChatId(parsed.chatId);
                            }
                            if (parsed.content) {
                                currentAiContent += parsed.content;
                                setMessages((prev) => {
                                    const next = [...prev];
                                    const last = next[next.length - 1];
                                    if (last.role === 'assistant') {
                                        last.content = currentAiContent;
                                    }
                                    return next;
                                });
                            }
                        } catch (e) {
                            console.error('Error parsing SSE chunk:', e);
                        }
                    }
                }
            }
            
            loadHistory();
        } catch (err) {
            console.error(err);
            toast.error('Failed to send message');
            // We don't remove optimistic msg if it's already there, 
            // but maybe show error state or something.
        } finally {
            setLoading(false);
        }
    };

    const loadHistory = async () => {
        try {
            const res = await api.get('/chat/history');
            setChatHistory(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const loadChat = async (id) => {
        try {
            const res = await api.get(`/chat/history/${id}`);
            setMessages(res.data.messages);
            setChatId(res.data._id);
        } catch (err) {
            toast.error('Failed to load chat');
        }
    };

    const newChat = () => {
        setMessages([]);
        setChatId(null);
    };

    const deleteChat = async (id) => {
        try {
            await api.delete(`/chat/history/${id}`);
            setChatHistory((prev) => prev.filter((c) => c._id !== id));
            if (chatId === id) newChat();
            toast.success('Chat deleted');
        } catch {
            toast.error('Failed to delete chat');
        }
    };

    return (
        <ChatContext.Provider value={{ messages, chatId, loading, chatHistory, sendMessage, loadHistory, loadChat, newChat, deleteChat }}>
            {children}
        </ChatContext.Provider>
    );
};

export const useChat = () => useContext(ChatContext);
