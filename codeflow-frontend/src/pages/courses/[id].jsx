import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { getCourseWithDetails } from '@/services/courseService';
import Spinner from '@/components/Spinner';
import { Input } from "@/components/ui/input";
import useAuth from '@/hooks/useAuth'; // Import useAuth for solved status
import { 
    FaChevronRight, 
    FaCode, 
    FaCheckCircle, 
    FaRegCircle, 
    FaLayerGroup,
    FaSearch
} from 'react-icons/fa';

// Difficulty Badge
const DifficultyBadge = ({ level }) => {
    const styles = {
        'Easy': 'bg-emerald-50 text-emerald-700 border-emerald-200',
        'Medium': 'bg-amber-50 text-amber-700 border-amber-200',
        'Hard': 'bg-rose-50 text-rose-700 border-rose-200',
    };
    return (
        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide border ${styles[level]}`}>
            {level}
        </span>
    );
};

// Progress Stat Component (New)
const ProgressStat = ({ label, solved, total, color, bg }) => {
    const percentage = total > 0 ? Math.round((solved / total) * 100) : 0;
    
    return (
        <div className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm flex flex-col justify-between min-w-[140px]">
            <div className="flex justify-between items-center mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">{label}</span>
                <span className="text-xs font-bold text-gray-900">{percentage}%</span>
            </div>
            <div className="flex items-baseline gap-1 mb-2">
                <span className="text-xl font-bold text-gray-900">{solved}</span>
                <span className="text-[10px] text-gray-400 font-medium">/ {total}</span>
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

const CourseDetails = () => {
    const router = useRouter();
    const { id } = router.query;
    const { user } = useAuth(); // Get user data
    const [courseData, setCourseData] = useState(null);
    const [loading, setLoading] = useState(true);
    
    // Filter States
    const [searchQuery, setSearchQuery] = useState('');
    const [difficultyFilter, setDifficultyFilter] = useState('All'); 

    // Create Set of solved problem IDs for fast lookup
    const solvedSet = useMemo(() => new Set(user?.solvedProblems || []), [user]);

    useEffect(() => {
        if (!id) return;
        const fetchData = async () => {
            try {
                const res = await getCourseWithDetails(id);
                setCourseData(res.data);
            } catch (error) {
                console.error("Failed to load course", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id]);

    // Calculate Course-Specific Stats
    const stats = useMemo(() => {
        if (!courseData) return null;
        
        const s = {
            total: { solved: 0, count: 0 },
            Easy: { solved: 0, count: 0 },
            Medium: { solved: 0, count: 0 },
            Hard: { solved: 0, count: 0 }
        };

        courseData.topics.forEach(topic => {
            topic.problems.forEach(p => {
                s.total.count++;
                if (s[p.difficulty]) s[p.difficulty].count++;

                if (solvedSet.has(p._id)) {
                    s.total.solved++;
                    if (s[p.difficulty]) s[p.difficulty].solved++;
                }
            });
        });
        return s;
    }, [courseData, solvedSet]);

    // Filtering Logic
    const filteredTopics = useMemo(() => {
        if (!courseData) return [];
        const { topics } = courseData;

        if (!searchQuery && difficultyFilter === 'All') return topics;

        return topics.map(topic => {
            const matchingProblems = topic.problems.filter(p => {
                const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase());
                const matchesDifficulty = difficultyFilter === 'All' || p.difficulty === difficultyFilter;
                return matchesSearch && matchesDifficulty;
            });

            if (matchingProblems.length > 0 || topic.title.toLowerCase().includes(searchQuery.toLowerCase())) {
                return { ...topic, problems: matchingProblems };
            }
            return null;
        }).filter(Boolean);
    }, [courseData, searchQuery, difficultyFilter]);

    if (loading || !courseData) return <div className="min-h-screen flex items-center justify-center bg-white"><Spinner /></div>;

    const { course } = courseData;
    const totalProblems = courseData.topics.reduce((acc, t) => acc + t.problems.length, 0);
    
    return (
        <div className="min-h-screen bg-gray-50 pb-10">
            
            {/* HERO HEADER */}
            <div className="bg-white border-b border-gray-200 pt-8 pb-8">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Breadcrumbs */}
                    <div className="flex items-center text-sm text-gray-500 mb-6">
                        <Link href="/courses" className="hover:text-indigo-600 transition-colors">Courses</Link>
                        <FaChevronRight className="mx-2 text-xs" />
                        <span className="font-medium text-gray-900">{course.title}</span>
                    </div>

                    <div className="mb-8">
                        <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight mb-4">
                            {course.title}
                        </h1>
                        <p className="text-lg text-gray-600 max-w-2xl leading-relaxed">
                            {course.description || "Master the fundamentals and advanced concepts in this comprehensive module."}
                        </p>
                        
                        <div className="flex items-center gap-6 mt-6 mb-8">
                            <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                                <FaLayerGroup className="text-indigo-500" />
                                {courseData.topics.length} Modules
                            </div>
                            <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                                <FaCode className="text-indigo-500" />
                                {totalProblems} Problems
                            </div>
                        </div>

                        {/* --- NEW: Progress Stats Grid --- */}
                        {stats && (
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
                                <ProgressStat label="Progress" solved={stats.total.solved} total={stats.total.count} bg="bg-indigo-500" />
                                <ProgressStat label="Easy" solved={stats.Easy.solved} total={stats.Easy.count} bg="bg-emerald-500" />
                                <ProgressStat label="Medium" solved={stats.Medium.solved} total={stats.Medium.count} bg="bg-amber-500" />
                                <ProgressStat label="Hard" solved={stats.Hard.solved} total={stats.Hard.count} bg="bg-rose-500" />
                            </div>
                        )}
                    </div>

                    {/* SEARCH & FILTER CONTROLS */}
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="relative flex-grow max-w-lg">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <FaSearch className="text-gray-400" />
                            </div>
                            <Input 
                                type="text" 
                                placeholder="Search topics or problems..." 
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10 bg-gray-50 border-gray-200 text-gray-900 focus:bg-white transition-all h-10"
                            />
                        </div>

                        <div className="flex bg-gray-100 p-1 rounded-lg self-start md:self-auto">
                            {['All', 'Easy', 'Medium', 'Hard'].map((level) => (
                                <button
                                    key={level}
                                    onClick={() => setDifficultyFilter(level)}
                                    className={`px-4 py-1 text-sm font-medium rounded-md transition-all ${
                                        difficultyFilter === level 
                                            ? 'bg-white text-gray-900 shadow-sm' 
                                            : 'text-gray-500 hover:text-gray-700'
                                    }`}
                                >
                                    {level}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* TOPICS LIST */}
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="space-y-6">
                    {filteredTopics.length > 0 ? (
                        filteredTopics.map((topic, index) => (
                            <div key={topic._id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-500">
                                {/* Topic Title Bar */}
                                <div className="px-6 py-4 bg-gray-50/80 border-b border-gray-100 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <span className="text-sm font-bold text-gray-400">#{index + 1}</span>
                                        <h3 className="text-base font-bold text-gray-900">{topic.title}</h3>
                                    </div>
                                    <span className="text-xs font-semibold text-gray-500 bg-white border border-gray-200 px-2 py-1 rounded">
                                        {topic.problems.length} Problems
                                    </span>
                                </div>

                                {/* Problems Rows */}
                                <div className="divide-y divide-gray-50">
                                    {topic.problems && topic.problems.length > 0 ? (
                                        topic.problems.map((problem) => (
                                            <Link 
                                                key={problem._id} 
                                                href={`/problems/${problem._id}`}
                                                className="group flex items-center justify-between px-6 py-3 hover:bg-indigo-50/50 transition-colors"
                                            >
                                                <div className="flex items-center gap-4">
                                                    {/* --- FIXED: Dynamic Solved Icon --- */}
                                                    {solvedSet.has(problem._id) ? (
                                                        <FaCheckCircle className="text-emerald-500 flex-shrink-0" />
                                                    ) : (
                                                        <FaRegCircle className="text-gray-300 flex-shrink-0 group-hover:text-indigo-500 transition-colors" />
                                                    )}
                                                    
                                                    <span className={`text-sm font-medium transition-colors ${
                                                        solvedSet.has(problem._id) 
                                                            ? 'text-gray-500' 
                                                            : 'text-gray-700 group-hover:text-indigo-700'
                                                    }`}>
                                                        {problem.title}
                                                    </span>
                                                </div>
                                                
                                                <div className="flex items-center gap-4">
                                                    <DifficultyBadge level={problem.difficulty} />
                                                    <FaChevronRight className="text-gray-300 text-xs group-hover:text-indigo-500 group-hover:translate-x-1 transition-transform" />
                                                </div>
                                            </Link>
                                        ))
                                    ) : (
                                        <div className="px-6 py-6 text-center text-gray-400 text-sm italic">
                                            No problems match your filters.
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-12">
                            <h3 className="text-lg font-medium text-gray-900">No results found</h3>
                            <button 
                                onClick={() => { setSearchQuery(''); setDifficultyFilter('All'); }}
                                className="mt-2 text-indigo-600 font-medium hover:underline text-sm"
                            >
                                Clear filters
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CourseDetails;