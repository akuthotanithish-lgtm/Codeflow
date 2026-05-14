import { useState } from "react";
import CodeEditor from "@/components/CodeEditor";

const SolutionsPanel = ({ solutions }) => {
    if (!solutions || solutions.length === 0) {
        return (
            <p className="p-4 text-sm text-slate-400">
                No official solutions are available for this problem yet.
            </p>
        );
    }

    // This can later be extended to tabs for Bruteforce / Better / Optimal.
    const [selectedSolution, setSelectedSolution] = useState(solutions[0]);

    return (
        // Full height container so it stretches to bottom
        <div className="flex flex-col h-full w-full overflow-hidden p-2">
            
            {/* Header */}
            <div className="mb-2 flex-shrink-0">
                <h3 className="font-semibold text-slate-200">
                    Official Solution ({selectedSolution.approach})
                </h3>
                <p className="text-sm text-slate-400 mt-1">
                    {selectedSolution.explanation}
                </p>
            </div>
            
            {/* Code editor takes rest of space */}
            <div className="flex-grow rounded-md overflow-hidden">
                <CodeEditor
                    language={selectedSolution.language}
                    code={selectedSolution.code}
                    setCode={() => {}} // Read-only
                    options={{ readOnly: true, minimap: { enabled: false } }}
                />
            </div>
        </div>
    );
};

export default SolutionsPanel;
