import { useState, useEffect } from "react";
import CodeEditor from "@/components/CodeEditor";

const SubmissionsHistory = ({ submissions }) => {
    const [selectedSubmission, setSelectedSubmission] = useState(null);

    // --- FIX: Correct the useEffect dependency array and logic ---
    // This effect should ONLY run when the list of submissions changes.
    // It sets the *initial* view to the most recent submission.
    useEffect(() => {
        // We only want to set the initial submission if one isn't already selected by the user.
        if (submissions && submissions.length > 0 && !selectedSubmission) {
            setSelectedSubmission(submissions[0]);
        }
    }, [submissions]); // The ONLY dependency should be `submissions`.

    if (!submissions || submissions.length === 0) {
        return <p className="p-4 text-sm text-slate-400">You have no submissions for this problem yet.</p>;
    }

    return (
        <div className="flex h-full">
            {/* The list of submissions on the left */}
            <div className="w-1/3 border-r border-slate-700 overflow-y-auto">
                <ul className="p-2 space-y-1">
                    {submissions.map(sub => (
                        <li 
                            key={sub._id}
                            onClick={() => setSelectedSubmission(sub)}
                            className={`p-2 rounded cursor-pointer text-sm transition-colors duration-150 ${
                                selectedSubmission?._id === sub._id ? 'bg-slate-700' : 'hover:bg-slate-800'
                            }`}
                        >
                            <div className="flex justify-between items-center">
                                <span className={`font-semibold ${sub.status === 'Accepted' ? 'text-green-500' : 'text-red-500'}`}>
                                    {sub.status}
                                </span>
                                <span className="text-xs text-slate-400">{new Date(sub.createdAt).toLocaleDateString()}</span>
                            </div>
                            <span className="text-xs text-slate-500">{sub.language}</span>
                        </li>
                    ))}
                </ul>
            </div>

            {/* The right panel displaying the selected submission's details */}
            <div className="w-2/3">
                {selectedSubmission ? (
                    <div className="h-full flex flex-col">
                        <div className="p-3 border-b border-slate-700 text-xs text-slate-400 flex justify-between items-center flex-shrink-0">
                           <span>Submitted on {new Date(selectedSubmission.createdAt).toLocaleString()}</span>
                           {/* Display Runtime and Memory for any submission that has them, not just 'Accepted' */}
                           {(selectedSubmission.runtimeInMs > 0 || selectedSubmission.memoryInKb > 0) && (
                               <div className="flex gap-4 font-mono text-xs">
                                   <span>Runtime: <strong className="text-white">{selectedSubmission.runtimeInMs} ms</strong></span>
                                   <span>Memory: <strong className="text-white">{selectedSubmission.memoryInKb} KB</strong></span>
                               </div>
                           )}
                        </div>
                         <CodeEditor
                            language={selectedSubmission.language}
                            code={selectedSubmission.code}
                            setCode={() => {}} // This makes it read-only
                            options={{ readOnly: true, minimap: { enabled: false } }}
                        />
                    </div>
                ) : (
                    <div className="flex items-center justify-center h-full text-slate-500">
                        <p>Select a submission to view your code and results.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SubmissionsHistory;