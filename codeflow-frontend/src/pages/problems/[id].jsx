import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { debounce } from 'lodash';
import toast from 'react-hot-toast';
import { FaChevronLeft, FaPlay, FaCloudUploadAlt, FaCode, FaTimes, FaPalette } from 'react-icons/fa';

import { getQuestionById } from '@/services/problemService';
import { 
    submitSolution, 
    getSubmissionResult, 
    runAgainstSamples, 
    getAllUserSubmissions 
} from '@/services/compilerService';

import useAuth from '@/hooks/useAuth';
import Spinner from '@/components/Spinner';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import ProblemDetails from '@/components/problem/ProblemDetails';
import CodeWorkspace from '@/components/problem/CodeWorkspace';
import ResultConsole from '@/components/problem/ResultConsole';
import CodeEditor from '@/components/CodeEditor';

const ProblemPage = () => {
    const router = useRouter();
    const { id } = router.query;
    const { user, refreshUser } = useAuth();

    const [problem, setProblem] = useState(null);
    const [submissions, setSubmissions] = useState([]);
    
    // Editor State
    const [language, setLanguage] = useState('cpp');
    const [code, setCode] = useState('');
    const [editorTheme, setEditorTheme] = useState('vs-dark'); 
    const [editorRefreshKey, setEditorRefreshKey] = useState(0);
    
    // Execution State
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [running, setRunning] = useState(false);

    const [selectedSubmission, setSelectedSubmission] = useState(null);

    const fetchProblemData = useCallback(async () => {
        if (!id) return;
        setLoading(true);
        try {
            const problemRes = await getQuestionById(id);
            setProblem(problemRes.data);

            if (user) {
                const submissionsRes = await getAllUserSubmissions(id);
                setSubmissions(submissionsRes.data);
            }
        } catch (error) {
            console.error(error);
            toast.error('Failed to load problem data.');
        } finally {
            setLoading(false);
        }
    }, [id, user]);

    useEffect(() => {
        if (router.isReady) fetchProblemData();
    }, [router.isReady, fetchProblemData]);

    const getLocalStorageKey = useCallback(() => {
        if (!user || !id) return null;
        return `codeflow_code_${user._id}_${id}_${language}`;
    }, [id, language, user]);

    useEffect(() => {
        if (problem && user) {
            if (user.role === 'admin') {
                setCode(problem[`starter_${language}`] || '');
                return;
            }
            const key = getLocalStorageKey();
            const savedCode = key ? localStorage.getItem(key) : null;
            const mostRecentSubmissionCode = submissions?.[0]?.code;
            
            setCode(savedCode || mostRecentSubmissionCode || problem[`starter_${language}`] || '');
        } else if (problem) {
            setCode(problem[`starter_${language}`] || '');
        }
    }, [language, problem, user, submissions, getLocalStorageKey]);

    const debouncedSave = useCallback(debounce((key, value) => {
        if (key) localStorage.setItem(key, value);
    }, 1000), []);

    useEffect(() => {
        if (code && problem && user && user.role !== 'admin') {
            debouncedSave(getLocalStorageKey(), code);
        }
    }, [code, problem, user, debouncedSave, getLocalStorageKey]);

    const handleSubmissionClick = (submission) => {
        if (!submission.code) return;
        setSelectedSubmission(submission);
    };

    const restoreSubmissionToEditor = () => {
        if (!selectedSubmission) return;
        let lang = selectedSubmission.language.toLowerCase();
        if (lang === 'c++') lang = 'cpp';
        setLanguage(lang);
        setCode(selectedSubmission.code);
        setEditorRefreshKey(prev => prev + 1); 
        setSelectedSubmission(null); 
        toast.success("Code restored to workspace");
    };

    const handleRunCode = async () => {
        if (!problem?.sampleTestCases?.length) return toast.error("No sample cases available.");
        setRunning(true);
        setResult({ type: 'run', status: `Running...`, cases: [] });
        
        try {
            const runPromises = problem.sampleTestCases.map(tc =>
                runAgainstSamples(problem._id, code, language, JSON.stringify(tc.input))
            );
            const runResponses = await Promise.all(runPromises);

            const cases = problem.sampleTestCases.map((tc, i) => {
                const resultData = runResponses[i].data;
                const rawOutput = resultData.output?.trim() || resultData.error || 'Execution Error';
                const expectedOutputString = JSON.stringify(tc.output);
                let isCorrect = false;
                try { isCorrect = JSON.stringify(JSON.parse(rawOutput)) === expectedOutputString; } 
                catch { isCorrect = rawOutput === String(tc.output); }
                if (resultData.status !== 'Accepted') isCorrect = false;

                return { input: JSON.stringify(tc.input), expected: expectedOutputString, output: rawOutput, isCorrect };
            });
            setResult({ type: 'run', status: 'Finished', cases });
        } catch (error) {
            setResult({ type: 'error', status: 'Error', output: error.response?.data?.error || 'Execution failed.' });
        } finally {
            setRunning(false);
        }
    };

    const pollSubmission = useCallback(async (submissionId) => {
        const intervalId = setInterval(async () => {
            try {
                const response = await getSubmissionResult(submissionId);
                const resData = response.data; 

                if (resData.status !== 'Pending') {
                    clearInterval(intervalId);
                    setSubmitting(false);
                    fetchProblemData(); 
                    if (resData.status === 'Accepted') {
                        setResult({ type: 'submit', status: 'Accepted', isCorrect: true });
                        toast.success('Solution Accepted!');
                        await refreshUser();
                    } else {
                        setResult({ type: 'submit', status: resData.status, isCorrect: false, failedCase: resData.failedCase || { error: resData.output } });
                        toast.error(`Failed: ${resData.status}`);
                    }
                }
            } catch (error) {
                clearInterval(intervalId);
                setSubmitting(false);
            }
        }, 2000);
    }, [fetchProblemData, refreshUser]);

    const handleSubmit = async () => {
        if (!user) return toast.error('Please log in.');
        setSubmitting(true);
        setResult({ type: 'submit', status: 'Submitting...' });
        try {
            const response = await submitSolution(id, code, language);
            if (user.role !== 'admin') localStorage.removeItem(getLocalStorageKey());
            setResult({ type: 'submit', status: 'Pending' });
            pollSubmission(response.data.submissionId);
        } catch (error) {
            setResult({ type: 'error', status: 'Error', output: error.response?.data?.msg || 'Failed.' });
            setSubmitting(false);
        }
    };

    if (loading || !problem) return <div className="h-full flex items-center justify-center bg-white"><Spinner /></div>;

    return (
        <div className="flex flex-col h-full bg-gray-50 overflow-hidden">
            
            {/* Header */}
            <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4 flex-shrink-0 z-10 shadow-sm">
                <div className="flex items-center gap-4">
                    <Link href="/problems" className="flex items-center text-gray-500 hover:text-gray-900 transition-colors">
                        <FaChevronLeft className="mr-1 text-xs" /> <span className="text-sm font-medium">Problems</span>
                    </Link>
                    <div className="h-4 w-px bg-gray-200"></div>
                    <h1 className="text-sm font-bold text-gray-900 truncate max-w-md">{problem.title}</h1>
                </div>

                <div className="flex items-center gap-3">
                    
                    <div className="mr-2">
                        <Select value={editorTheme} onValueChange={setEditorTheme}>
                            <SelectTrigger className="h-8 w-[130px] bg-gray-50 border-gray-300 text-xs font-medium text-gray-900 hover:bg-gray-100">
                                <FaPalette className="mr-2 text-indigo-500" />
                                <SelectValue placeholder="Theme" />
                            </SelectTrigger>
                            {/* --- FIX: Added explicit bg-white and text colors for Theme Dropdown --- */}
                            <SelectContent className="bg-white border-gray-200 text-gray-900">
                                {[
                                    {val: "vs-light", label: "Light"},
                                    {val: "vs-dark", label: "Dark"},
                                    {val: "hc-black", label: "High Contrast"},
                                    {val: "github-light", label: "GitHub Light"},
                                    {val: "github-dark", label: "GitHub Dark"}
                                ].map(opt => (
                                    <SelectItem 
                                        key={opt.val} 
                                        value={opt.val}
                                        className="focus:bg-gray-100 focus:text-gray-900 cursor-pointer"
                                    >
                                        {opt.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <Button onClick={handleRunCode} disabled={running || submitting} variant="outline" className="h-8 px-4 bg-gray-50 hover:bg-gray-100 text-gray-700 border-gray-300 text-xs font-semibold">
                        <FaPlay className="mr-2 text-[10px]" /> Run
                    </Button>
                    <Button onClick={handleSubmit} disabled={running || submitting} className="h-8 px-4 bg-green-600 hover:bg-green-700 text-white border-none shadow-sm text-xs font-semibold">
                        {submitting ? <Spinner size="xs" /> : <><FaCloudUploadAlt className="mr-2" /> Submit</>}
                    </Button>
                </div>
            </header>

            {/* Main Resizable Layout */}
            <div className="flex-grow overflow-hidden">
                <ResizablePanelGroup direction="horizontal">
                    <ResizablePanel defaultSize={40} minSize={30} className="bg-white flex flex-col">
                        <div className="flex-grow overflow-y-auto">
                            <ProblemDetails 
                                problem={problem} 
                                submissions={submissions} 
                                onSubmissionClick={handleSubmissionClick} 
                            />
                        </div>
                    </ResizablePanel>
                    
                    <ResizableHandle withHandle className="w-1.5 bg-gray-100 hover:bg-indigo-500 transition-colors" />
                    
                    <ResizablePanel defaultSize={60} minSize={30}>
                        <ResizablePanelGroup direction="vertical">
                            <ResizablePanel defaultSize={70} minSize={30} className="bg-white flex flex-col">
                                <CodeWorkspace
                                    key={editorRefreshKey}
                                    problem={problem} 
                                    language={language} 
                                    setLanguage={setLanguage}
                                    code={code} 
                                    setCode={setCode}
                                    theme={editorTheme} 
                                />
                            </ResizablePanel>
                            
                            <ResizableHandle withHandle className="h-1.5 bg-gray-100 hover:bg-indigo-500 transition-colors" />
                            
                            <ResizablePanel defaultSize={30} minSize={10} className="bg-white flex flex-col">
                                <div className="flex-grow overflow-y-auto">
                                    <ResultConsole result={result} problem={problem} />
                                </div>
                            </ResizablePanel>
                        </ResizablePanelGroup>
                    </ResizablePanel>
                </ResizablePanelGroup>
            </div>

            {selectedSubmission && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl flex flex-col max-h-[90vh] overflow-hidden border border-gray-200">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50">
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">Submission Details</h3>
                                <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                                    <span>{new Date(selectedSubmission.createdAt).toLocaleString()}</span>
                                    <span>•</span>
                                    <span className="uppercase font-mono">{selectedSubmission.language}</span>
                                    <span>•</span>
                                    <span className={selectedSubmission.status === 'Accepted' ? 'text-green-600 font-bold' : 'text-red-600 font-bold'}>
                                        {selectedSubmission.status}
                                    </span>
                                </div>
                            </div>
                            <button onClick={() => setSelectedSubmission(null)} className="text-gray-400 hover:text-gray-700 p-1"><FaTimes className="text-xl" /></button>
                        </div>
                        <div className="w-full h-[60vh] relative bg-white border-b border-gray-100">
                             <CodeEditor 
                                language={selectedSubmission.language === 'c++' ? 'cpp' : selectedSubmission.language} 
                                code={selectedSubmission.code} 
                                setCode={() => {}} 
                                options={{ readOnly: true, minimap: { enabled: false }, fontSize: 14 }}
                                theme={editorTheme} 
                             />
                        </div>
                        <div className="flex items-center justify-end gap-3 px-6 py-4 bg-gray-50">
                            <Button variant="outline" onClick={() => setSelectedSubmission(null)}>Close</Button>
                            <Button onClick={restoreSubmissionToEditor} className="bg-indigo-600 text-white gap-2"><FaCode /> Restore</Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProblemPage;