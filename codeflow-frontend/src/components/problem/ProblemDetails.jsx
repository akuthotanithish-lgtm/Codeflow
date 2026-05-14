import { useState, useEffect } from 'react';
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from '@/components/ui/button';
import CodeEditor from "@/components/CodeEditor";
import { 
    FaRegClipboard, 
    FaHistory, 
    FaLightbulb, 
    FaLock, 
    FaInbox, 
    FaCode,
    FaCheck,
    FaCopy,
    FaCheckCircle,
    FaTimesCircle,
    FaClock
    // FaMemory removed
} from 'react-icons/fa';

const ProblemDetails = ({ problem, submissions, onSubmissionClick }) => {
  const difficultyColor = {
    'Easy': 'bg-emerald-50 text-emerald-700 border-emerald-200',
    'Medium': 'bg-amber-50 text-amber-700 border-amber-200',
    'Hard': 'bg-rose-50 text-rose-700 border-rose-200',
  };

  // 1. ROBUST SOLUTION FILTERING
  const hasSolutions = problem?.solutions && problem.solutions.length > 0;
  
  const getSolutionsByLang = (langGroup) => {
      if (!problem?.solutions?.length) return [];
      const targets = Array.isArray(langGroup) ? langGroup : [langGroup];
      return problem.solutions.filter(s => 
          s.language && targets.includes(s.language.toLowerCase())
      );
  };

  const cppSolutions = getSolutionsByLang(['cpp', 'c++']);
  const javaSolutions = getSolutionsByLang(['java']);
  const pythonSolutions = getSolutionsByLang(['python', 'python3', 'py']);

  // Determine default tab safely
  const defaultLang = cppSolutions.length > 0 ? "cpp" : 
                      javaSolutions.length > 0 ? "java" : 
                      pythonSolutions.length > 0 ? "python" : "cpp";

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Key ensures tabs reset when switching problems */}
      <Tabs key={problem?._id || 'main-tabs'} defaultValue="description" className="w-full h-full flex flex-col">
        
        {/* HEADER */}
        <div className="px-4 border-b border-gray-100 bg-white sticky top-0 z-10 flex-shrink-0">
            <TabsList className="bg-transparent p-0 gap-6 h-12 w-full justify-start">
                <TabItem value="description" icon={<FaRegClipboard />} label="Description" />
                <TabItem value="solutions" icon={<FaLightbulb />} label={`Editorial ${hasSolutions ? `(${problem.solutions.length})` : ''}`} />
                <TabItem value="submissions" icon={<FaHistory />} label="Submissions" />
            </TabsList>
        </div>
        
        {/* CONTENT AREA */}
        <div className="flex-grow overflow-y-auto custom-scrollbar relative">
            
            {/* --- DESCRIPTION TAB --- */}
            <TabsContent value="description" className="p-6 m-0 outline-none h-full">
              <div className="max-w-none pb-10">
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-gray-900 leading-tight mb-3">
                        {problem?.title}
                    </h1>
                    <div className="flex items-center gap-3">
                        <Badge className={`${difficultyColor[problem?.difficulty || 'Medium']} border font-semibold px-2.5 py-0.5 shadow-none rounded-md`}>
                            {problem?.difficulty || 'Medium'}
                        </Badge>
                    </div>
                </div>
                
                {problem?.description && (
                    <div 
                        className="prose prose-sm max-w-none text-gray-600 leading-relaxed prose-headings:text-gray-900 prose-code:bg-gray-100 prose-code:text-indigo-600 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:font-mono prose-code:text-[13px] prose-code:before:content-none prose-code:after:content-none"
                        dangerouslySetInnerHTML={{ __html: problem.description }} 
                    />
                )}
                
                {problem?.sampleTestCases?.length > 0 && (
                    <div className="mt-8 space-y-6">
                        {problem.sampleTestCases.map((tc, index) => (
                        <div key={index} className="border border-gray-200 rounded-xl overflow-hidden">
                            <div className="bg-gray-50/80 px-4 py-2 border-b border-gray-200 flex items-center justify-between">
                                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Example {index + 1}</span>
                            </div>
                            <div className="p-4 bg-white space-y-3">
                                <div>
                                    <p className="text-xs font-semibold text-gray-500 mb-1.5 uppercase">Input</p>
                                    <div className="bg-gray-50 border border-gray-100 rounded-lg p-3 font-mono text-sm text-gray-800">
                                        {JSON.stringify(tc.input)}
                                    </div>
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-gray-500 mb-1.5 uppercase">Output</p>
                                    <div className="bg-gray-50 border border-gray-100 rounded-lg p-3 font-mono text-sm text-gray-800">
                                        {JSON.stringify(tc.output)}
                                    </div>
                                </div>
                            </div>
                        </div>
                        ))}
                    </div>
                )}
              </div>
            </TabsContent>
            
            {/* --- SOLUTIONS TAB --- */}
            <TabsContent value="solutions" className="h-full m-0 outline-none">
                {hasSolutions ? (
                    <div className="h-full flex flex-col p-6">
                        <Tabs defaultValue={defaultLang} className="w-full flex flex-col h-full">
                            <div className="flex-shrink-0 mb-4">
                                <TabsList className="bg-gray-100 p-1 w-fit rounded-lg">
                                    <SolutionLangTrigger value="cpp" disabled={cppSolutions.length === 0} label="C++" />
                                    <SolutionLangTrigger value="java" disabled={javaSolutions.length === 0} label="Java" />
                                    <SolutionLangTrigger value="python" disabled={pythonSolutions.length === 0} label="Python" />
                                </TabsList>
                            </div>

                            <div className="flex-grow overflow-hidden">
                                <TabsContent value="cpp" className="h-full mt-0">
                                    <LanguageSolutions solutions={cppSolutions} />
                                </TabsContent>
                                <TabsContent value="java" className="h-full mt-0">
                                    <LanguageSolutions solutions={javaSolutions} />
                                </TabsContent>
                                <TabsContent value="python" className="h-full mt-0">
                                    <LanguageSolutions solutions={pythonSolutions} />
                                </TabsContent>
                            </div>
                        </Tabs>
                    </div>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center p-8 text-center">
                        <div className="bg-gray-50 p-6 rounded-full mb-4"><FaLock className="text-gray-300 text-3xl" /></div>
                        <h3 className="text-lg font-bold text-gray-900 mb-2">Editorial Locked</h3>
                        <p className="text-gray-500 text-sm">No official solutions available yet.</p>
                    </div>
                )}
            </TabsContent>

            {/* --- SUBMISSIONS TAB --- */}
            <TabsContent value="submissions" className="h-full m-0 outline-none p-6">
                 {submissions && submissions.length > 0 ? (
                     <div className="space-y-3">
                         {submissions.map((sub) => (
                             <div 
                                key={sub._id} 
                                onClick={() => onSubmissionClick && onSubmissionClick(sub)}
                                className="border border-gray-200 rounded-xl p-4 bg-white hover:border-indigo-400 hover:shadow-md transition-all cursor-pointer group"
                             >
                                 <div className="flex items-center justify-between mb-2">
                                     <div className="flex items-center gap-2">
                                         {sub.status === 'Accepted' ? ( <FaCheckCircle className="text-green-500" /> ) : ( <FaTimesCircle className="text-red-500" /> )}
                                         <span className={`font-bold text-sm ${sub.status === 'Accepted' ? 'text-green-700' : 'text-red-700'}`}>{sub.status}</span>
                                     </div>
                                     <span className="text-xs text-gray-400 group-hover:text-indigo-500 transition-colors">
                                        {new Date(sub.createdAt).toLocaleString()}
                                     </span>
                                 </div>
                                 <div className="flex items-center gap-6 text-xs text-gray-500 font-mono mt-3 bg-gray-50 p-2 rounded-lg border border-gray-100 group-hover:bg-indigo-50/30 transition-colors">
                                     <div className="flex items-center gap-1.5"><FaCode className="text-indigo-400" /><span className="uppercase">{sub.language}</span></div>
                                     <div className="flex items-center gap-1.5"><FaClock className="text-amber-500" /><span>{sub.runtimeInMs || '-'} ms</span></div>
                                     
                                     {/* MEMORY REMOVED PERMANENTLY AS REQUESTED */}
                                 </div>
                             </div>
                         ))}
                     </div>
                 ) : (
                    <div className="h-full flex flex-col items-center justify-center p-8 text-center mt-12">
                        <div className="bg-gray-50 p-6 rounded-full mb-4"><FaInbox className="text-gray-300 text-3xl" /></div>
                        <h3 className="text-lg font-bold text-gray-900 mb-2">No Submissions</h3>
                        <p className="text-gray-500 text-sm">Submit code to see history.</p>
                    </div>
                 )}
            </TabsContent>
        </div>
      </Tabs>
    </div>
  );
};

// --- HELPER COMPONENTS ---

const LanguageSolutions = ({ solutions }) => {
    const [selectedSolution, setSelectedSolution] = useState(solutions?.[0]);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (solutions && solutions.length > 0) {
            setSelectedSolution(solutions[0]);
        }
    }, [solutions]);

    if (!solutions || solutions.length === 0 || !selectedSolution) {
        return (
            <div className="flex flex-col items-center justify-center h-64 text-gray-400 bg-gray-50/50 rounded-xl border border-dashed border-gray-200">
                <FaCode className="text-2xl mb-2 opacity-20" />
                <p className="text-sm">No solution available for this language.</p>
            </div>
        );
    }

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(selectedSolution.code);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error("Failed to copy", err);
        }
    };

    return (
        <div className="flex flex-col h-full">
            <div className="flex gap-2 mb-4 flex-wrap pt-2">
                {solutions.map((sol, index) => (
                    <button
                        key={index}
                        onClick={() => { setSelectedSolution(sol); setCopied(false); }}
                        className={`
                            px-3 py-1.5 text-xs font-medium rounded-full border transition-all
                            ${selectedSolution.approach === sol.approach 
                                ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm' 
                                : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50'}
                        `}
                    >
                        {sol.approach || `Approach ${index + 1}`}
                    </button>
                ))}
            </div>

            <div className="flex-grow flex flex-col border border-gray-200 rounded-xl overflow-hidden shadow-sm bg-white relative group">
                <div className="p-4 border-b border-gray-100 bg-white max-h-[150px] overflow-y-auto">
                     <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap font-medium">
                        {selectedSolution.explanation || "No explanation provided."}
                     </p>
                </div>

                <div className="flex-grow min-h-[300px] relative">
                     <Button
                        size="icon"
                        variant="ghost"
                        onClick={handleCopy}
                        className="absolute top-2 right-4 z-10 h-8 w-8 bg-white/80 hover:bg-white text-gray-500 border border-gray-200 shadow-sm backdrop-blur-sm transition-all"
                     >
                        {copied ? <FaCheck className="text-green-500" size={14} /> : <FaCopy size={14} />}
                     </Button>

                     <CodeEditor 
                        language={selectedSolution.language === 'c++' ? 'cpp' : selectedSolution.language} 
                        code={selectedSolution.code} 
                        options={{ 
                            readOnly: true, 
                            minimap: { enabled: false }, 
                            fontSize: 13,
                            scrollBeyondLastLine: false,
                            padding: { top: 16 }
                        }} 
                     />
                </div>
            </div>
        </div>
    );
};

const SolutionLangTrigger = ({ value, disabled, label }) => (
    <TabsTrigger 
        value={value} 
        disabled={disabled} 
        className="
            rounded-md text-xs px-3 py-1.5 font-medium transition-all
            text-gray-500 
            hover:text-gray-900
            data-[state=active]:bg-white 
            data-[state=active]:!text-indigo-600 
            data-[state=active]:shadow-sm
            disabled:opacity-30 disabled:cursor-not-allowed
        "
    >
        {label}
    </TabsTrigger>
);

const TabItem = ({ value, icon, label }) => (
    <TabsTrigger 
        value={value} 
        className="
            flex items-center gap-2 
            rounded-none px-1 h-full 
            text-sm font-medium transition-all
            text-gray-500 hover:text-gray-800
            data-[state=active]:bg-transparent 
            data-[state=active]:shadow-none 
            data-[state=active]:border-b-2 
            data-[state=active]:border-indigo-600 
            data-[state=active]:!text-indigo-600
        "
    >
        {icon} {label}
    </TabsTrigger>
);

export default ProblemDetails;