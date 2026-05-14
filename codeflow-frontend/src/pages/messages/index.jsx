import React, { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import api from '@/services/api';
import useAuth from '@/hooks/useAuth';
import { getAvatarUrl } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import Spinner from '@/components/Spinner';
import { 
    Send, MoreHorizontal, Image as ImageIcon, Paperclip, 
    Search, ArrowLeft, Star, Smile, Gift, ChevronUp 
} from 'lucide-react';
import { format } from 'date-fns';

const MessagesPage = () => {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const { userId } = router.query;

    const [conversations, setConversations] = useState([]);
    const [activeChatUser, setActiveChatUser] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState("");
    const [loading, setLoading] = useState(true);
    
    const messagesEndRef = useRef(null);

    useEffect(() => {
        if (!authLoading && !user) return router.push('/login');
        const init = async () => {
            try {
                const convRes = await api.get('/chat/conversations');
                setConversations(convRes.data);
                if (userId) await loadChat(userId, convRes.data);
            } catch (err) { console.error(err); } finally { setLoading(false); }
        };
        if (user) init();
    }, [user, authLoading, userId]);

    const loadChat = async (targetId, currentConvs = conversations) => {
        try {
            let targetUser = currentConvs.find(c => c.user._id === targetId)?.user;
            if (!targetUser) {
                const userRes = await api.get(`/users/${targetId}`);
                targetUser = userRes.data;
            }
            setActiveChatUser(targetUser);
            const msgRes = await api.get(`/chat/${targetId}`);
            setMessages(msgRes.data);
            scrollToBottom();
        } catch (error) { console.error(error); }
    };

    const handleSend = async (e) => {
        if (e) e.preventDefault();
        if (!newMessage.trim() || !activeChatUser) return;

        const content = newMessage;
        setNewMessage(""); // Clear immediately for UX

        try {
            const res = await api.post('/chat', { recipientId: activeChatUser._id, content });
            setMessages(prev => [...prev, res.data]);
            scrollToBottom();
        } catch (error) { console.error("Send failed"); }
    };

    const scrollToBottom = () => {
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    };

    if (loading || authLoading) return <div className="h-screen flex items-center justify-center bg-[#F3F2EF]"><Spinner size="xl" /></div>;

    return (
        <>
            <Head><title>Messaging | CodeFlow</title></Head>

            <div className="h-[calc(100vh-64px)] bg-[#F3F2EF] md:pt-4 flex justify-center">
                <div className="w-full max-w-[1128px] bg-white md:rounded-t-xl shadow-sm border border-gray-300 flex overflow-hidden">
                    
                    {/* --- LEFT SIDEBAR --- */}
                    <div className={`w-full md:w-[320px] border-r border-gray-200 flex flex-col ${activeChatUser ? 'hidden md:flex' : 'flex'}`}>
                        <div className="p-3 border-b border-gray-200 flex justify-between items-center bg-white">
                            <h2 className="font-semibold text-gray-700">Messaging</h2>
                            <MoreHorizontal size={18} className="text-gray-500 cursor-pointer"/>
                        </div>
                        <div className="p-2 border-b border-gray-200">
                            <div className="relative">
                                <Search className="absolute left-3 top-2.5 text-gray-400" size={14}/>
                                <input placeholder="Search messages" className="w-full pl-9 bg-[#edf2f7] border-none h-9 text-sm rounded focus:ring-0 text-gray-900"/>
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto">
                            {conversations.map(c => (
                                <div key={c.user._id} onClick={() => loadChat(c.user._id)} className={`p-3 flex gap-3 hover:bg-gray-100 cursor-pointer border-l-4 ${activeChatUser?._id === c.user._id ? 'border-l-green-700 bg-gray-50' : 'border-l-transparent'}`}>
                                    <Avatar className="h-12 w-12"><AvatarImage src={getAvatarUrl(c.user.avatar)} /><AvatarFallback>{c.user.name[0]}</AvatarFallback></Avatar>
                                    <div className="flex-1 overflow-hidden">
                                        <div className="flex justify-between items-center"><h3 className="text-sm font-semibold text-gray-900 truncate">{c.user.name}</h3><span className="text-[10px] text-gray-400">{format(new Date(c.createdAt), 'MMM d')}</span></div>
                                        <p className="text-xs text-gray-500 truncate">{c.lastMessage}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* --- RIGHT CHAT (Exact Reference Match) --- */}
                    <div className={`flex-1 flex flex-col bg-white ${!activeChatUser ? 'hidden md:flex' : 'flex'}`}>
                        {activeChatUser ? (
                            <>
                                {/* HEADER: Match your image */}
                                <div className="p-2 px-4 border-b border-gray-200 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <button onClick={() => setActiveChatUser(null)} className="md:hidden"><ArrowLeft size={20}/></button>
                                        <div className="flex flex-col">
                                            <h2 className="text-sm font-semibold text-gray-900">{activeChatUser.name}</h2>
                                            <p className="text-[10px] text-gray-500 flex items-center gap-1">
                                                <span className="w-2 h-2 bg-green-500 rounded-full"></span> Mobile • 6h ago
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex gap-4 text-gray-600">
                                        <MoreHorizontal size={18} className="cursor-pointer"/>
                                        <Star size={18} className="cursor-pointer"/>
                                    </div>
                                </div>

                                {/* MESSAGES AREA */}
                                <div className="flex-1 overflow-y-auto p-4 space-y-6">
                                    {/* Conversation Start Profile Info */}
                                    <div className="flex flex-col mb-8">
                                        <Avatar className="h-16 w-16 mb-2"><AvatarImage src={getAvatarUrl(activeChatUser.avatar)} /></Avatar>
                                        <h3 className="text-lg font-bold flex items-center gap-1">
                                            {activeChatUser.name} <span className="text-gray-400 text-sm">✔</span>
                                        </h3>
                                        <p className="text-xs text-gray-600">{activeChatUser.bio || "Attended Neil Gogte Institute of Technology"}</p>
                                    </div>

                                    {messages.map((msg, idx) => {
                                        const isMe = msg.sender === user._id;
                                        const sender = isMe ? user : activeChatUser;
                                        return (
                                            <div key={idx} className="flex gap-2 group">
                                                <Avatar className="h-10 w-10 shrink-0">
                                                    <AvatarImage src={getAvatarUrl(sender.avatar)} />
                                                </Avatar>
                                                <div className="flex flex-col w-full">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-sm font-bold text-gray-900">{sender.name}</span>
                                                        <span className="text-xs text-gray-400">✔</span>
                                                        <span className="text-[10px] text-gray-400">• {format(new Date(msg.createdAt), 'h:mm a')}</span>
                                                    </div>
                                                    <div className="text-sm text-gray-800 mt-1 whitespace-pre-wrap">
                                                        {msg.content}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                    <div ref={messagesEndRef} />
                                </div>

                                {/* INPUT AREA: Exact match */}
                                <div className="p-3 border-t border-gray-200">
                                    <div className="bg-[#f4f2ee] rounded-lg p-2 px-4 min-h-[50px] flex items-start relative">
                                        <textarea
                                            value={newMessage}
                                            onChange={(e) => setNewMessage(e.target.value)}
                                            onKeyDown={(e) => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                                            placeholder="Write a message..."
                                            className="w-full bg-transparent border-none focus:ring-0 text-sm text-gray-900 placeholder-gray-500 resize-none pt-1"
                                            rows={2}
                                        />
                                        <ChevronUp size={18} className="text-gray-500 mt-1 cursor-pointer" />
                                    </div>
                                    <div className="flex justify-between items-center mt-2 px-1">
                                        <div className="flex gap-4 text-gray-500">
                                            <ImageIcon size={20} className="hover:text-gray-800 cursor-pointer"/>
                                            <Paperclip size={20} className="hover:text-gray-800 cursor-pointer"/>
                                            <span className="font-bold text-sm cursor-pointer hover:text-gray-800">GIF</span>
                                            <Smile size={20} className="hover:text-gray-800 cursor-pointer"/>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button 
                                                onClick={handleSend}
                                                disabled={!newMessage.trim()}
                                                className={`px-4 py-1 rounded-full text-sm font-semibold transition ${newMessage.trim() ? 'bg-gray-200 text-gray-700 hover:bg-gray-300' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
                                            >
                                                Send
                                            </button>
                                            <MoreHorizontal size={20} className="text-gray-500 cursor-pointer" />
                                        </div>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
                                <Send size={60} strokeWidth={1} className="mb-4 opacity-20"/>
                                <p>Select a message to start chatting</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
};

export default MessagesPage;