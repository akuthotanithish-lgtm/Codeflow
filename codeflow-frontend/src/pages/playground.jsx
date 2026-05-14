import { useState, useEffect, useRef } from 'react';
import CodeEditor from '@/components/CodeEditor';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import toast from 'react-hot-toast';
import { FaPlay, FaTerminal, FaCircle, FaUndo, FaPalette } from 'react-icons/fa';

let Terminal, FitAddon;

// 1. Define our 5 beautiful themes for the Terminal and UI
const THEMES = {
    'vs-dark': {
        name: 'VS Dark',
        editorTheme: 'vs-dark', 
        terminal: { background: '#1e1e1e', foreground: '#d1d5db', cursor: '#ffffff' },
        headerBg: '#2d2d2d', 
        borderColor: '#404040'
    },
    'light': {
        name: 'Light',
        editorTheme: 'light',
        terminal: { background: '#ffffff', foreground: '#333333', cursor: '#000000' },
        headerBg: '#f3f4f6', 
        borderColor: '#e5e7eb' 
    },
    'dracula': {
        name: 'Dracula',
        editorTheme: 'vs-dark', // SAFE FALLBACK: Forces editor to go dark!
        terminal: { background: '#282a36', foreground: '#f8f8f2', cursor: '#ff79c6' },
        headerBg: '#44475a', // Distinct Dracula purple-grey
        borderColor: '#6272a4' // Bright Dracula purple border
    },
    'monokai': {
        name: 'Monokai',
        editorTheme: 'vs-dark', // SAFE FALLBACK: Forces editor to go dark!
        terminal: { background: '#272822', foreground: '#f8f8f2', cursor: '#f8f8f0' },
        headerBg: '#3e3d32', // Distinct warm/brownish Monokai header
        borderColor: '#75715e' // Monokai khaki border
    },
    'oceanic': {
        name: 'Oceanic',
        editorTheme: 'vs-dark', // SAFE FALLBACK: Forces editor to go dark!
        terminal: { background: '#0f1c23', foreground: '#d8dee9', cursor: '#5fb3b3' }, // Deeper blue bg
        headerBg: '#1b2b34', // Distinct teal/blue header
        borderColor: '#5fb3b3' // Bright oceanic teal border
    }
};

const defaultCode = {
    cpp: '#include <iostream>\n\nint main() {\n    std::string name;\n    std::cout << "What is your name? ";\n    std::cin >> name;\n    std::cout << "Hello, " << name << "!" << std::endl;\n    return 0;\n}',
    java: 'import java.util.Scanner;\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner scanner = new Scanner(System.in);\n        System.out.print("What is your name? ");\n        String name = scanner.nextLine();\n        System.out.println("Hello, " + name + "!");\n        scanner.close();\n    }\n}',
    python: 'name = input("What is your name? ")\nprint(f"Hello, {name}!")\n',
};

const Playground = () => {
    const [language, setLanguage] = useState('python');
    const [running, setRunning] = useState(false);
    const [isConnected, setIsConnected] = useState(false);
    
    // Theme State synced with localStorage
    const [activeTheme, setActiveTheme] = useState(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('codeflow-theme') || 'vs-dark';
        }
        return 'vs-dark';
    });

    const [codes, setCodes] = useState(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('codeflow-playground-codes');
            if (saved) {
                try { return JSON.parse(saved); } catch (e) { console.error("Error parsing saved code"); }
            }
        }
        return defaultCode;
    });
    
    const terminalRef = useRef(null);
    const socketRef = useRef(null);
    const isInitialized = useRef(false);
    const runningRef = useRef(running); 
    const xtermInstanceRef = useRef(null);
    const isStoppingRef = useRef(false); 

    // Save changes to localStorage
    useEffect(() => { localStorage.setItem('codeflow-playground-codes', JSON.stringify(codes)); }, [codes]);
    useEffect(() => { localStorage.setItem('codeflow-theme', activeTheme); }, [activeTheme]);

    // Dynamically update the terminal's theme without reloading the component
    useEffect(() => {
        const xterm = xtermInstanceRef.current?.term;
        if (xterm) {
            xterm.options.theme = THEMES[activeTheme].terminal;
        }
    }, [activeTheme]);

    const handleCodeChange = (newCode) => {
        setCodes(prev => ({ ...prev, [language]: newCode }));
    };

    const resetToDefault = () => {
        setCodes(prev => ({ ...prev, [language]: defaultCode[language] }));
        toast.success(`Reset ${language} to default code`);
    };

    useEffect(() => {
        if (runningRef.current) {
            isStoppingRef.current = true;
            setRunning(false); 
            const socket = socketRef.current;
            if (socket && socket.readyState === WebSocket.OPEN) {
                socket.send(JSON.stringify({ type: 'stop' })); 
            }
        }
        const xterm = xtermInstanceRef.current?.term;
        if (xterm) { 
            xterm.write('\x1b[2J\x1b[3J\x1b[H'); 
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [language]);

    useEffect(() => { runningRef.current = running; }, [running]);

    useEffect(() => {
        if (isInitialized.current || !terminalRef.current) return;
        isInitialized.current = true;

        let term, ws;

        const init = async () => {
            const xtermModule = await import('xterm');
            const fitAddonModule = await import('xterm-addon-fit');
            await import('xterm/css/xterm.css');
            Terminal = xtermModule.Terminal;
            FitAddon = fitAddonModule.FitAddon;

            term = new Terminal({ 
                cursorBlink: true, 
                theme: THEMES[activeTheme].terminal, 
                fontFamily: "'JetBrains Mono', 'Fira Code', monospace", 
                fontSize: 14, 
                convertEol: true 
            });
            
            const fitAddonInstance = new FitAddon();
            term.loadAddon(fitAddonInstance);
            term.open(terminalRef.current);
            xtermInstanceRef.current = { term, fitAddon: fitAddonInstance };
            
            setTimeout(() => fitAddonInstance.fit(), 50);
            window.addEventListener('resize', () => fitAddonInstance.fit());

            const WS_URL = 'ws://localhost:5000'; 
            ws = new WebSocket(WS_URL);
            socketRef.current = ws;

            ws.onopen = () => {
                setIsConnected(true);
                term.writeln('\x1b[1;32mWelcome to CodeFlow Playground!\x1b[0m\n'); 
            };
        
            ws.onerror = () => { setIsConnected(false); toast.error("Connection failed."); };

            ws.onmessage = (event) => {
                const message = JSON.parse(event.data);
                
                if (message.type === 'stdout' || message.type === 'stderr') {
                    term.write(message.data);
                    if (!runningRef.current) setRunning(true);
                } else if (message.type === 'exit') {
                    if (isStoppingRef.current) {
                        isStoppingRef.current = false;
                        return;
                    }
                    term.writeln('\r\n' + (message.data || ''));
                    setRunning(false);
                }
            };

            ws.onclose = () => { setIsConnected(false); if (term) term.writeln('\n\x1b[1;31m[Disconnected]\x1b[0m'); };
        
            term.onData((data) => {
                if (runningRef.current) {
                    const socket = socketRef.current;
                    if (socket && socket.readyState === WebSocket.OPEN) {
                        if (data === '\r') { term.write('\r\n'); socket.send(JSON.stringify({ type: 'stdin', data: '\n' })); }
                        else if (data === '\x7f') { term.write('\b \b'); socket.send(JSON.stringify({ type: 'stdin', data: '\b' })); }
                        else { term.write(data); socket.send(JSON.stringify({ type: 'stdin', data })); }
                    }
                }
            });
        };

        init();

        return () => {
            if (ws) ws.close();
            if (term) term.dispose();
            window.removeEventListener('resize', () => xtermInstanceRef.current?.fitAddon?.fit());
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleRun = () => {
        const socket = socketRef.current;
        const term = xtermInstanceRef.current?.term;
        if (!socket || socket.readyState !== WebSocket.OPEN) return toast.error("Not connected."); 
        
        if (term) term.write('\x1b[2J\x1b[3J\x1b[H'); 
        
        setRunning(true);
        socket.send(JSON.stringify({ type: 'run', code: codes[language], language }));
    };

    // Extract current theme configuration to keep JSX clean
    const currentTheme = THEMES[activeTheme];

    return (
        <div className="flex flex-col h-full bg-gray-50">
            {/* Toolbar */}
            <div className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4 flex-shrink-0 shadow-sm z-10 relative">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-gray-900 font-bold text-sm">
                        <FaTerminal className="text-gray-500" />
                        Playground
                    </div>
                    <div className="h-6 w-px bg-gray-200"></div>
                    
                    {/* Language Selector */}
                    <Select value={language} onValueChange={setLanguage}>
                        <SelectTrigger className="w-[120px] border-gray-300 bg-white hover:bg-gray-50 focus:ring-2 focus:ring-indigo-100 text-gray-800 font-medium h-9 text-xs">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-white border-gray-200 text-gray-800">
                            <SelectItem value="cpp">C++</SelectItem>
                            <SelectItem value="java">Java</SelectItem>
                            <SelectItem value="python">Python</SelectItem>
                        </SelectContent>
                    </Select>

                    {/* Theme Selector */}
                    <Select value={activeTheme} onValueChange={setActiveTheme}>
                        <SelectTrigger className="w-[130px] border-gray-300 bg-white hover:bg-gray-50 focus:ring-2 focus:ring-indigo-100 text-gray-800 font-medium h-9 text-xs flex items-center gap-2">
                            <FaPalette className="text-gray-400" />
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-white border-gray-200 text-gray-800">
                            {Object.entries(THEMES).map(([key, val]) => (
                                <SelectItem key={key} value={key}>{val.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    {/* Reset Default Button */}
                    <Button 
                        onClick={resetToDefault}
                        variant="outline" 
                        className="h-9 px-3 text-xs border-gray-300 text-gray-600 hover:text-gray-900 hover:bg-gray-100 flex items-center gap-2"
                        title="Reset to default boilerplate code"
                    >
                        <FaUndo className="text-[10px]" />
                        Reset Code
                    </Button>
                </div>
                
                {/* Right Side: Status + Run Button */}
                <div className="flex items-center gap-4">
                    <div className={`flex items-center gap-2 text-xs font-semibold ${isConnected ? 'text-green-600' : 'text-red-500'}`}>
                        <FaCircle className="text-[8px]" />
                        {isConnected ? 'Connected' : 'Disconnected'}
                    </div>
                    
                    <Button 
                        onClick={handleRun} 
                        disabled={running || !isConnected}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-md hover:shadow-lg active:scale-95 transition-all h-9 px-6 text-xs flex items-center gap-2"
                    >
                        <FaPlay className="text-[10px]" /> 
                        {running ? "Running..." : "Run Code"}
                    </Button>
                </div>
            </div>

            {/* Editor Area */}
            <div className="flex-grow overflow-hidden">
                <ResizablePanelGroup direction="horizontal">
                    <ResizablePanel defaultSize={60} minSize={30} className="flex flex-col" style={{ backgroundColor: currentTheme.terminal.background }}>
                        <CodeEditor 
                            language={language} 
                            code={codes[language]} 
                            setCode={handleCodeChange} 
                            theme={currentTheme.editorTheme}
                            options={{ fontSize: 15, fontFamily: "'JetBrains Mono', 'Fira Code', monospace", lineHeight: 24, padding: { top: 16 } }}
                        />
                    </ResizablePanel>
                    
                    <ResizableHandle withHandle className="bg-gray-200 hover:bg-indigo-500 transition-colors w-1.5" />
                    
                    <ResizablePanel defaultSize={40} minSize={20} className="flex flex-col border-l" style={{ backgroundColor: currentTheme.terminal.background, borderColor: currentTheme.borderColor }}>
                        <div className="h-9 flex items-center px-4 justify-between flex-shrink-0 border-b" style={{ backgroundColor: currentTheme.headerBg, borderColor: currentTheme.borderColor }}>
                            <span className="text-xs font-bold flex items-center gap-2 tracking-wider" style={{ color: currentTheme.terminal.foreground }}>
                                <FaTerminal className="text-indigo-400" /> TERMINAL
                            </span>
                            <span className="text-[10px] font-mono" style={{ color: currentTheme.terminal.foreground, opacity: 0.6 }}>BASH</span>
                        </div>
                        <div className="flex-grow p-1 overflow-hidden" ref={terminalRef} />
                    </ResizablePanel>
                </ResizablePanelGroup>
            </div>
        </div>
    );
};

export default Playground;