import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { getAllQuestions } from '@/services/problemService';
import useAuth from '@/hooks/useAuth';
import Spinner from '@/components/Spinner';
import { Input } from "@/components/ui/input";
import { Search, CheckCircle2, Circle, ArrowRight, BookOpen, Layers, BarChart3 } from 'lucide-react';

// Difficulty Badge Component
const DifficultyBadge = ({ level }) => {
    const styles = {
        'Easy': 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100',
        'Medium': 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100',
        'Hard': 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100',
    };
    
    return (
        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles[level] || 'bg-gray-100 text-gray-800'}`}>
            {level}
        </span>
    );
};

// Progress Stat Card
const ProgressStat = ({ label, solved, total, color, bg }) => {
    const percentage = total > 0 ? Math.round((solved / total) * 100) : 0;
    
    return (
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-between">
            <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-500">{label}</span>
                <span className="text-xs font-semibold text-gray-900">{percentage}%</span>
            </div>
            <div className="flex items-baseline gap-1 mb-2">
                <span className="text-2xl font-bold text-gray-900">{solved}</span>
                <span className="text-xs text-gray-400 font-medium">/ {total}</span>
            </div>
            <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                <div 
                    className={`h-full ${bg} transition-all duration-1000 ease-out`} 
                    style={{ width: `${percentage}%` }}
                />
            </div>
        </div>
    );
};

// Helper to group data
const groupProblems = (problems) => {
    if (!problems) return [];
    return problems.reduce((acc, problem) => {
        if (!problem.course || !problem.topic) return acc;

        let courseGroup = acc.find(c => c.course._id === problem.course._id);
        if (!courseGroup) {
            courseGroup = { course: problem.course, topics: [] };
            acc.push(courseGroup);
        }

        let topicGroup = courseGroup.topics.find(t => t.topic._id === problem.topic._id);
        if (!topicGroup) {
            topicGroup = { topic: problem.topic, problems: [] };
            courseGroup.topics.push(topicGroup);
        }

        topicGroup.problems.push(problem);
        return acc;
    }, []);
};

const ProblemsPage = () => {
    const { user } = useAuth(); // Get user to check solved status
    const [originalData, setOriginalData] = useState([]);
    const [groupedProblems, setGroupedProblems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    
    // Create a Set of solved problem IDs for O(1) lookup
    const solvedSet = useMemo(() => {
        return new Set(user?.solvedProblems || []);
    }, [user]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await getAllQuestions();
                setOriginalData(res.data);
                setGroupedProblems(groupProblems(res.data));
            } catch (error) {
                console.error("Failed to load problems", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    // Calculate Stats
    const stats = useMemo(() => {
        const s = {
            total: { solved: 0, count: 0 },
            Easy: { solved: 0, count: 0 },
            Medium: { solved: 0, count: 0 },
            Hard: { solved: 0, count: 0 }
        };

        originalData.forEach(p => {
            s.total.count++;
            if (s[p.difficulty]) s[p.difficulty].count++;

            if (solvedSet.has(p._id)) {
                s.total.solved++;
                if (s[p.difficulty]) s[p.difficulty].solved++;
            }
        });

        return s;
    }, [originalData, solvedSet]);

    // Search Filtering
    useEffect(() => {
        if (!searchQuery.trim()) {
            setGroupedProblems(groupProblems(originalData));
            return;
        }

        const lowerQuery = searchQuery.toLowerCase();
        const filtered = originalData.filter(p => 
            p.title.toLowerCase().includes(lowerQuery) || 
            p.topic.title.toLowerCase().includes(lowerQuery) ||
            p.course.title.toLowerCase().includes(lowerQuery)
        );
        setGroupedProblems(groupProblems(filtered));
    }, [searchQuery, originalData]);

    if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><Spinner /></div>;

    return (
        <div className="min-h-screen bg-gray-50 py-12">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                
                {/* Header & Stats Section */}
                <div className="mb-12">
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Problem Library</h1>
                    <p className="text-gray-500 mt-2 text-lg">Master algorithms through our curated collection of challenges.</p>
                    
                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
                        <ProgressStat 
                            label="Total Solved" 
                            solved={stats.total.solved} 
                            total={stats.total.count} 
                            bg="bg-indigo-500" 
                        />
                        <ProgressStat 
                            label="Easy" 
                            solved={stats.Easy.solved} 
                            total={stats.Easy.count} 
                            bg="bg-emerald-500" 
                        />
                        <ProgressStat 
                            label="Medium" 
                            solved={stats.Medium.solved} 
                            total={stats.Medium.count} 
                            bg="bg-amber-500" 
                        />
                        <ProgressStat 
                            label="Hard" 
                            solved={stats.Hard.solved} 
                            total={stats.Hard.count} 
                            bg="bg-rose-500" 
                        />
                    </div>

                    {/* Search Bar */}
                    <div className="mt-8 relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <Search className="h-5 w-5 text-gray-400" />
                        </div>
                        <Input 
                            type="text" 
                            placeholder="Search by problem name, topic, or course..." 
                            className="pl-11 h-14 bg-white border-gray-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 rounded-2xl shadow-sm text-base text-gray-900 placeholder:text-gray-400 transition-all"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                {/* Content Grid */}
                <div className="space-y-12">
                    {groupedProblems.length > 0 ? (
                        groupedProblems.map(({ course, topics }) => (
                            <div key={course._id} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                                {/* Course Title */}
                                <div className="flex items-center gap-3 mb-5 px-1">
                                    <div className="p-2 bg-white border border-gray-200 rounded-lg text-indigo-600 shadow-sm">
                                        <BookOpen size={20} />
                                    </div>
                                    <h2 className="text-xl font-bold text-gray-800">{course.title}</h2>
                                </div>

                                {/* Topics Grid */}
                                <div className="grid grid-cols-1 gap-6">
                                    {topics.map(({ topic, problems }) => (
                                        <div key={topic._id} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                                            {/* Topic Header */}
                                            <div className="bg-gray-50/80 px-6 py-4 border-b border-gray-100 flex items-center justify-between backdrop-blur-sm">
                                                <div className="flex items-center gap-2 text-gray-700 font-bold">
                                                    <Layers size={18} className="text-gray-400" />
                                                    {topic.title}
                                                </div>
                                                <span className="text-xs font-semibold text-gray-500 bg-white border border-gray-200 px-3 py-1 rounded-full shadow-sm">
                                                    {problems.length} Challenges
                                                </span>
                                            </div>

                                            {/* Problems List */}
                                            <div className="divide-y divide-gray-50">
                                                {problems.map(problem => {
                                                    const isSolved = solvedSet.has(problem._id);
                                                    return (
                                                        <Link key={problem._id} href={`/problems/${problem._id}`} className="block group hover:bg-gray-50 transition-colors">
                                                            <div className="px-6 py-4 flex items-center justify-between">
                                                                <div className="flex items-center gap-4">
                                                                    {/* Green Tick or Empty Circle */}
                                                                    {isSolved ? (
                                                                        <CheckCircle2 className="text-emerald-500 h-5 w-5 flex-shrink-0 fill-emerald-50" />
                                                                    ) : (
                                                                        <Circle className="text-gray-300 h-5 w-5 flex-shrink-0 group-hover:text-indigo-400 transition-colors" />
                                                                    )}
                                                                    
                                                                    <div>
                                                                        <h3 className={`text-sm font-medium transition-colors ${
                                                                            isSolved ? 'text-gray-600' : 'text-gray-900 group-hover:text-indigo-600'
                                                                        }`}>
                                                                            {problem.title}
                                                                        </h3>
                                                                    </div>
                                                                </div>

                                                                <div className="flex items-center gap-4">
                                                                    <DifficultyBadge level={problem.difficulty} />
                                                                    <ArrowRight className="h-4 w-4 text-gray-300 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
                                                                </div>
                                                            </div>
                                                        </Link>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-gray-200 border-dashed">
                            <div className="p-4 bg-gray-50 rounded-full mb-4">
                                <Search className="h-8 w-8 text-gray-400" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900">No problems found</h3>
                            <p className="text-gray-500 text-sm mt-1">Try searching for a different keyword.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProblemsPage;