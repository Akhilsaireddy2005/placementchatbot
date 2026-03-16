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
            const res = await api.post('/chat/send', { message: content, chatId });
            setChatId(res.data.chatId);
            const aiMsg = { role: 'assistant', content: res.data.reply, timestamp: new Date() };
            setMessages((prev) => [...prev, aiMsg]);
        } catch (err) {
            toast.error('Failed to send message');
            setMessages((prev) => prev.slice(0, -1)); // Remove optimistic user msg
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
