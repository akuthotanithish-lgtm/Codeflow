import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle2, XCircle } from "lucide-react";

const ResultPanel = ({ result, submissions }) => {
  const renderResultContent = () => {
    if (!result) {
      return <p className="text-slate-400">Run code or submit a solution to see the results.</p>;
    }
    
    const isError = result.status && result.status !== 'Accepted';
    
    return (
      <div>
        <h3 className={`text-lg font-bold ${isError ? 'text-red-500' : 'text-green-500'}`}>
          {result.status}
        </h3>
        {result.output && <pre className="mt-2 text-sm whitespace-pre-wrap">{result.output}</pre>}
        
        {/* For failed hidden cases */}
        {result.failedCase && (
          <div className="mt-4 border-t border-slate-700 pt-4">
            <h4 className="font-semibold">Failed Test Case:</h4>
            <div className="font-mono text-sm bg-slate-800 p-2 rounded mt-2">
              <p><strong>Input:</strong> {result.failedCase.input}</p>
              <p className="mt-1"><strong>Your Output:</strong> {result.failedCase.output}</p>
              <p className="mt-1"><strong>Expected:</strong> {result.failedCase.expected}</p>
            </div>
          </div>
        )}
        
        {/* For complexity analysis */}
        {result.analysis && (
          <div className="mt-4 border-t border-slate-700 pt-4">
            <h4 className="font-semibold mb-2">Complexity Analysis</h4>
            <div className="prose prose-sm prose-invert" dangerouslySetInnerHTML={{ __html: result.analysis.replace(/\n/g, '<br />') }} />
          </div>
        )}
      </div>
    );
  };
  
  return (
    <div className="h-full p-2 bg-slate-900">
      <Tabs defaultValue="result" className="w-full h-full flex flex-col">
        <TabsList>
          <TabsTrigger value="result">Result</TabsTrigger>
          <TabsTrigger value="testcases">Testcases</TabsTrigger>
          <TabsTrigger value="submissions">Submissions</TabsTrigger>
        </TabsList>
        
        <TabsContent value="result" className="flex-grow mt-2 overflow-y-auto p-4 bg-slate-950 rounded-md">
          {renderResultContent()}
        </TabsContent>

        <TabsContent value="testcases" className="flex-grow mt-2 overflow-y-auto p-4 bg-slate-950 rounded-md">
          {/* Logic to show all sample test cases */}
          <p>Sample test cases will be shown here.</p>
        </TabsContent>

        <TabsContent value="submissions" className="flex-grow mt-2 overflow-y-auto">
          {/* Display submission history */}
          <ul className="space-y-2">
            {submissions.map(sub => (
              <li key={sub._id} className="flex justify-between items-center p-2 bg-slate-800 rounded">
                <span className={`font-semibold ${sub.status === 'Accepted' ? 'text-green-500' : 'text-red-500'}`}>
                  {sub.status}
                </span>
                <span className="text-xs text-slate-400">{new Date(sub.createdAt).toLocaleString()}</span>
              </li>
            ))}
          </ul>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ResultPanel;