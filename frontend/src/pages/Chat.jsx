import { useState } from 'react';
import { Send, User, Bot, Sparkles, Loader } from 'lucide-react';
import clsx from 'clsx';
import api from '../api/axios';

export default function Chat() {
    const [messages, setMessages] = useState([
        { id: 1, role: 'assistant', text: "Hi! I'm your specific nutrition coach. How are you feeling about your diet today?" }
    ]);
    const [loading, setLoading] = useState(false);
    const [input, setInput] = useState('');

    const handleSend = async () => {
        if (!input.trim() || loading) return;

        const userMsg = { id: Date.now(), role: 'user', text: input };
        const updatedMessages = [...messages, userMsg];
        setMessages(updatedMessages);
        setInput('');
        setLoading(true);

        try {
            const response = await api.post('/chat/message', {
                message: userMsg.text,
                history: updatedMessages.map(({ role, text }) => ({ role, text }))
            });

            const botMsg = { id: Date.now() + 1, role: 'assistant', text: response.data.response };
            setMessages(prev => [...prev, botMsg]);
        } catch (error) {
            console.error(error);
            const errorMsg = { id: Date.now() + 1, role: 'assistant', text: "Sorry, I'm having trouble connecting to the server." };
            setMessages(prev => [...prev, errorMsg]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-[calc(100vh-8rem)] bg-card-bg rounded-3xl border border-border-base shadow-sm overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-border-base flex items-center gap-3 bg-gray-50/50 dark:bg-slate-800/50">
                <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-full">
                    <Sparkles size={20} />
                </div>
                <div>
                    <h2 className="font-semibold text-text-main">AI Food Coach</h2>
                    <p className="text-xs text-text-muted">Always here to help</p>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg) => (
                    <div
                        key={msg.id}
                        className={clsx(
                            "flex gap-3 max-w-[80%]",
                            msg.role === 'user' ? "ml-auto flex-row-reverse" : ""
                        )}
                    >
                        <div className={clsx(
                            "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                            msg.role === 'user' ? "bg-gray-200 dark:bg-slate-600 text-gray-600 dark:text-gray-200" : "bg-emerald-600 text-white"
                        )}>
                            {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
                        </div>
                        <div className={clsx(
                            "p-3 rounded-2xl text-sm leading-relaxed",
                            msg.role === 'user'
                                ? "bg-chat-user text-gray-900 dark:text-white rounded-tr-none"
                                : "bg-chat-bot text-text-main rounded-tl-none"
                        )}>
                            {msg.text}
                        </div>
                    </div>
                ))}
            </div>

            {/* Input */}
            <div className="p-4 border-t border-border-base bg-gray-50/30 dark:bg-slate-800/30">
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                        placeholder="Ask about your diet..."
                        className="flex-1 px-4 py-2 rounded-xl border border-gray-200 dark:border-slate-600 bg-card-bg text-text-main focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 placeholder-text-muted"
                    />
                    <button
                        onClick={handleSend}
                        className="p-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-colors disabled:opacity-50"
                        disabled={!input.trim() || loading}
                    >
                        {loading ? <Loader className="animate-spin" size={20} /> : <Send size={20} />}
                    </button>
                </div>
            </div>
        </div>
    );
}
