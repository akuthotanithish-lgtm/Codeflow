import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, Loader2, Terminal } from "lucide-react";

const ResultConsole = ({ result }) => {
    const [activeTab, setActiveTab] = useState("testcase");
    const [selectedCaseIndex, setSelectedCaseIndex] = useState(0);

    useEffect(() => {
        if (result?.type === 'submit' && result.status !== 'Pending') {
            setActiveTab('result');
        } else if (result?.type === 'run') {
            setActiveTab('testcase');
            setSelectedCaseIndex(0);
        }
    }, [result]);

    const renderRunResults = () => {
        if (!result || result.type !== 'run') {
            return (
                <div className="h-full flex flex-col items-center justify-center text-gray-400 text-sm">
                    <Terminal className="mb-2 h-6 w-6 opacity-20" />
                    <p>Run your code to see output here.</p>
                </div>
            );
        }
        if (result.status.startsWith('Running')) {
            return <div className="p-6 flex items-center gap-2 text-gray-500 text-sm"><Loader2 className="animate-spin h-4 w-4"/> Executing test cases...</div>;
        }

        const selectedCaseResult = result.cases[selectedCaseIndex];

        return (
            <div className="p-4 h-full flex flex-col">
                <div className="flex flex-wrap gap-2 mb-6 border-b border-gray-100 pb-4">
                    {result.cases.map((caseResult, index) => (
                        <button
                            key={index}
                            onClick={() => setSelectedCaseIndex(index)}
                            className={`
                                h-8 px-3 rounded-lg text-xs font-medium flex items-center gap-2 transition-all
                                ${selectedCaseIndex === index 
                                    ? 'bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200' 
                                    : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}
                            `}
                        >
                            {caseResult.isCorrect ? ( <div className="w-1.5 h-1.5 rounded-full bg-green-500" /> ) : ( <div className="w-1.5 h-1.5 rounded-full bg-red-500" /> )}
                            Case {index + 1}
                        </button>
                    ))}
                </div>
                
                {selectedCaseResult && (
                    <div className="space-y-4 flex-grow overflow-y-auto font-mono text-xs">
                        <div>
                            <p className="text-gray-500 mb-1.5 text-[10px] uppercase font-bold tracking-wider">Input</p>
                            <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-800">
                                {selectedCaseResult.input}
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-gray-500 mb-1.5 text-[10px] uppercase font-bold tracking-wider">Your Output</p>
                                <div className={`p-3 border rounded-lg ${selectedCaseResult.isCorrect ? 'bg-gray-50 border-gray-200 text-gray-800' : 'bg-red-50 border-red-100 text-red-700'}`}>
                                    {selectedCaseResult.output}
                                </div>
                            </div>
                            <div>
                                <p className="text-gray-500 mb-1.5 text-[10px] uppercase font-bold tracking-wider">Expected</p>
                                <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-800">
                                    {selectedCaseResult.expected}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    const renderSubmitResult = () => {
        if (!result || result.type !== 'submit') {
             return (
                <div className="h-full flex flex-col items-center justify-center text-gray-400 text-sm">
                    <p>Submit your code to see judgment results.</p>
                </div>
            );
        }
        if (result.status === 'Pending' || result.status === 'Submitting...') {
            return <div className="p-6 flex items-center gap-2 text-gray-500 text-sm"><Loader2 className="animate-spin h-4 w-4"/> Judging solution...</div>;
        }

        return (
            <div className="p-6">
                <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold mb-6 ${result.isCorrect ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {result.isCorrect ? <CheckCircle2 size={18} /> : <XCircle size={18} />} 
                    {result.status}
                </div>
                
                {!result.isCorrect && result.failedCase && (
                     <div className="border border-red-100 bg-red-50/50 rounded-xl p-4">
                        <h4 className="font-bold text-red-800 text-sm mb-3">Last Executed Input</h4>
                        <div className="font-mono text-xs space-y-3">
                            <div>
                                <span className="text-red-400 text-[10px] uppercase font-bold">Input</span>
                                <div className="mt-1 p-2 bg-white border border-red-100 rounded text-gray-700">
                                    {JSON.stringify(result.failedCase.input)}
                                </div>
                            </div>
                            <div>
                                <span className="text-red-400 text-[10px] uppercase font-bold">Your Output</span>
                                <div className="mt-1 p-2 bg-white border border-red-100 rounded text-red-600">
                                    {result.failedCase.output}
                                </div>
                            </div>
                            <div>
                                <span className="text-red-400 text-[10px] uppercase font-bold">Expected</span>
                                <div className="mt-1 p-2 bg-white border border-red-100 rounded text-gray-700">
                                    {JSON.stringify(result.failedCase.expected)}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="h-full bg-white flex flex-col">
            <div className="flex-shrink-0 px-2 border-b border-gray-100 bg-gray-50/50">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="bg-transparent h-10 p-0 gap-4">
                        <TabsTrigger value="testcase" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-indigo-600 rounded-none px-1 h-full text-gray-500 data-[state=active]:text-indigo-600 font-medium text-xs">
                            Test Cases
                        </TabsTrigger>
                        <TabsTrigger value="result" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-indigo-600 rounded-none px-1 h-full text-gray-500 data-[state=active]:text-indigo-600 font-medium text-xs">
                            Judgment
                        </TabsTrigger>
                    </TabsList>
                </Tabs>
            </div>
            
            <div className="flex-grow overflow-y-auto">
                {activeTab === 'testcase' ? renderRunResults() : renderSubmitResult()}
            </div>
        </div>
    );
};

export default ResultConsole;