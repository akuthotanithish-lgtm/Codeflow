import { useState, useRef, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import CodeEditor from "@/components/CodeEditor";
import MarkdownRenderer from '@/components/MarkdownRenderer'; 
import toast from 'react-hot-toast';
import { requestAiHelp } from '@/services/aiService';
import { 
    Sparkles, X, Send, Bot, Trash2, 
    Search, BookOpen, Lightbulb, CpuIcon
} from "lucide-react";

// --- UPDATED: Accepted 'theme' as a prop ---
const CodeWorkspace = ({ 
    language, 
    setLanguage, 
    code, 
    setCode,
    problem,
    theme 
}) => {
    const [isAiModalOpen, setIsAiModalOpen] = useState(false);
    const [conversation, setConversation] = useState([]);
    const [userInput, setUserInput] = useState('');
    const [isAiLoading, setIsAiLoading] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [conversation, isAiLoading, isAiModalOpen]);

    const sendMessage = async (messageContent = null) => {
        const contentToSend = messageContent || "Hello! I need help with programming.";
        const isCodeAnalysis = contentToSend.toLowerCase().includes('current code') || 
                              contentToSend.toLowerCase().includes('analyze') ||
                              contentToSend.toLowerCase().includes('debug');

        const userMessage = { 
            role: 'user', 
            content: contentToSend, 
            timestamp: new Date()
        };
        
        setConversation(prev => [...prev, userMessage]);
        setUserInput('');
        setIsAiLoading(true);

        try {
            const recentConversation = conversation.slice(-10).map(msg => ({
                role: msg.role,
                content: msg.content
            }));

            const currentContext = {
                problemTitle: problem?.title,
                language: language,
                code: code, 
                isCodeAnalysis: isCodeAnalysis
            };

            const res = await requestAiHelp(contentToSend, recentConversation, currentContext);
            
            const aiMessage = { 
                role: 'assistant', 
                content: res.help, 
                timestamp: new Date()
            };
            setConversation(prev => [...prev, aiMessage]);
        } catch (error) {
            const errorMsg = error.response?.data?.msg || "Failed to get AI response.";
            toast.error(errorMsg);
            setConversation(prev => [...prev, { 
                role: 'assistant', 
                content: `**Error:** ${errorMsg}`, 
                timestamp: new Date(),
                isError: true
            }]);
        } finally {
            setIsAiLoading(false);
        }
    };

    const handleQuickAction = (action) => {
        const messages = {
            analyze: `Please analyze my current ${language} code for the "${problem?.title}" problem.`,
            optimize: `How can I optimize the time and space complexity of my current ${language} solution?`,
            debug: `I suspect there's a bug in my code. Can you help me find it?`,
            explain: `Explain the optimal algorithm to solve "${problem?.title}" in simple terms.`
        };
        if (messages[action]) sendMessage(messages[action]);
    };

    const handleSubmitMessage = (e) => {
        e.preventDefault();
        if (!userInput.trim()) return;
        sendMessage(userInput);
    };

    return (
        <div className="flex flex-col h-full bg-white relative">
            {/* Toolbar */}
            <div className="flex items-center justify-between px-4 border-b border-gray-100 bg-white flex-shrink-0 h-12">
                <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider select-none">Language:</span>
                    <Select value={language} onValueChange={setLanguage}>
                        <SelectTrigger className="w-[120px] h-8 border-none shadow-none bg-transparent text-xs font-semibold text-gray-700 hover:text-indigo-600 focus:ring-0 px-0">
                            <SelectValue placeholder="Language" />
                        </SelectTrigger>
                        <SelectContent className="bg-white border-gray-200">
                            <SelectItem value="cpp">C++</SelectItem>
                            <SelectItem value="java">Java</SelectItem>
                            <SelectItem value="python">Python</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setIsAiModalOpen(true)}
                    className="h-8 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 text-xs font-medium transition-colors"
                >
                    <Sparkles className="h-3 w-3 mr-1.5" /> AI Assistant
                </Button>
            </div>

            {/* Editor Area */}
            <div className="flex-grow relative">
                {/* --- PASSED THEME PROP --- */}
                <CodeEditor 
                    language={language} 
                    code={code} 
                    setCode={setCode} 
                    theme={theme}
                    options={{
                        fontSize: 14,
                        lineHeight: 24,
                        padding: { top: 20, bottom: 20 },
                        fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                        minimap: { enabled: false },
                        scrollBeyondLastLine: false,
                        smoothScrolling: true,
                    }}
                />
            </div>

            {/* AI Modal (Unchanged) */}
            {isAiModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm">
                    <div className="bg-white w-full max-w-2xl h-[85vh] rounded-2xl shadow-2xl flex flex-col border border-gray-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-indigo-100 rounded-lg">
                                    <Sparkles className="h-5 w-5 text-indigo-600" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900">CodeFlow Assistant</h3>
                                    <p className="text-xs text-gray-500">Powered by Advanced AI</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <Button variant="ghost" size="icon" onClick={() => setConversation([])} className="text-gray-400 hover:text-red-500">
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => setIsAiModalOpen(false)} className="text-gray-400 hover:text-gray-700">
                                    <X className="h-5 w-5" />
                                </Button>
                            </div>
                        </div>

                        <div className="flex-grow overflow-y-auto p-6 bg-white space-y-6">
                            {conversation.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-center opacity-0 animate-in fade-in duration-500">
                                    <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-indigo-200">
                                        <Bot className="h-8 w-8 text-white" />
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-900 mb-2">How can I help you?</h3>
                                    <div className="grid grid-cols-2 gap-3 w-full max-w-md">
                                        <QuickAction icon={<Search/>} text="Explain this problem" onClick={() => handleQuickAction('explain')} />
                                        <QuickAction icon={<CpuIcon/>} text="Analyze my code" onClick={() => handleQuickAction('analyze')} />
                                        <QuickAction icon={<Lightbulb/>} text="Optimize solution" onClick={() => handleQuickAction('optimize')} />
                                        <QuickAction icon={<BookOpen/>} text="Find bugs" onClick={() => handleQuickAction('debug')} />
                                    </div>
                                </div>
                            ) : (
                                conversation.map((msg, idx) => (
                                    <div key={idx} className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[85%] rounded-2xl px-5 py-3.5 shadow-sm text-sm leading-relaxed ${
                                            msg.role === 'user' 
                                                ? 'bg-indigo-600 text-white rounded-tr-sm' 
                                                : msg.isError 
                                                    ? 'bg-red-50 text-red-700 border border-red-100 rounded-tl-sm' 
                                                    : 'bg-gray-100 text-gray-800 rounded-tl-sm'
                                        }`}>
                                            <MarkdownRenderer content={msg.content} />
                                        </div>
                                    </div>
                                ))
                            )}
                            {isAiLoading && (
                                <div className="flex gap-4">
                                    <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                                        <Bot className="h-4 w-4 text-indigo-600" />
                                    </div>
                                    <div className="bg-gray-100 rounded-2xl rounded-tl-sm px-5 py-4 flex items-center gap-2">
                                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100" />
                                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200" />
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        <div className="p-4 bg-white border-t border-gray-100">
                            <form onSubmit={handleSubmitMessage} className="relative">
                                <Input 
                                    value={userInput}
                                    onChange={(e) => setUserInput(e.target.value)}
                                    placeholder="Ask anything about your code..."
                                    className="pr-12 h-12 bg-gray-50 border-gray-200 focus:bg-white focus:ring-2 focus:ring-indigo-500 rounded-xl text-gray-900 placeholder:text-gray-500"
                                    disabled={isAiLoading}
                                />
                                <Button 
                                    type="submit" 
                                    size="icon"
                                    disabled={!userInput.trim() || isAiLoading}
                                    className="absolute right-1.5 top-1.5 h-9 w-9 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-all"
                                >
                                    <Send className="h-4 w-4" />
                                </Button>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const QuickAction = ({ icon, text, onClick }) => (
    <button 
        onClick={onClick}
        className="flex flex-col items-center justify-center gap-2 p-4 bg-gray-50 border border-gray-100 rounded-xl hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-600 transition-all group"
    >
        <div className="text-gray-400 group-hover:text-indigo-500 transition-colors">{icon}</div>
        <span className="text-xs font-medium text-gray-600 group-hover:text-indigo-700">{text}</span>
    </button>
);

export default CodeWorkspace;