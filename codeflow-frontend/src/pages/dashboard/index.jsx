import { useState, useEffect } from 'react';
import useAuth from '@/hooks/useAuth';
import api from '@/services/api';
import { useRouter } from 'next/router';
import Spinner from '@/components/Spinner';
import ActivityHeatmap from '@/components/ActivityHeatmap';
import EditProfileModal from '@/components/EditProfileModal';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
    FaTrophy, FaFire, FaBolt, FaCheckCircle, 
    FaLock, FaCode, FaArrowRight, FaBrain, FaExclamationTriangle
} from 'react-icons/fa';

const Dashboard = () => {
    const { user, isAuthenticated, loading: authLoading } = useAuth();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
    const [timeLeft, setTimeLeft] = useState('');
    const router = useRouter();

    useEffect(() => {
        if (!authLoading && !isAuthenticated) router.push('/login');
        if (isAuthenticated) fetchStats();
    }, [isAuthenticated, authLoading]);

    // Daily Countdown Timer
    useEffect(() => {
        const updateTimer = () => {
            const now = new Date();
            const midnight = new Date();
            midnight.setHours(24, 0, 0, 0);
            const diff = midnight - now;

            const h = Math.floor((diff / (1000 * 60 * 60)) % 24);
            const m = Math.floor((diff / (1000 * 60)) % 60);
            const s = Math.floor((diff / 1000) % 60);
            setTimeLeft(`${h}h ${m}m ${s}s`);
        };
        updateTimer();
        const interval = setInterval(updateTimer, 1000);
        return () => clearInterval(interval);
    }, []);

    const fetchStats = async () => {
        try {
            const res = await api.get('/users/dashboard/stats');
            
            if (res.data?.recentActivity) {
                const broken = res.data.recentActivity.filter(sub => !sub.question && !sub.problem);
                if (broken.length > 0) {
                    console.warn("⚠️ Found orphaned submissions (Question deleted):", broken);
                }
            }
            
            setData(res.data);
        } catch (err) {
            console.error("Failed to fetch dashboard stats", err);
        } finally {
            setLoading(false);
        }
    };

    const getQuestionDetails = (sub) => {
        if (!sub) return { id: null, title: 'Unknown' };

        const entity = sub.question || sub.problem;

        if (entity && typeof entity === 'object') {
            return { 
                id: entity._id || entity.id, 
                title: entity.title || sub.title || 'Untitled Problem' 
            };
        }

        if (typeof entity === 'string') {
            return { id: entity, title: sub.title || 'Unknown Title' };
        }

        const fallbackId = sub.questionId || sub.problemId || sub.question_id;
        
        if (fallbackId) {
            return { id: fallbackId, title: sub.title || 'Deleted Question' };
        }

        return { id: null, title: 'Data Missing' };
    };

    if (authLoading || loading) return <div className="h-screen flex items-center justify-center bg-slate-50"><Spinner /></div>;
    if (!data) return null;

    const { stats, courses, recentActivity } = data;

    const today = new Date().toDateString();
    const hasSolvedToday = recentActivity?.some(sub => 
        new Date(sub.createdAt).toDateString() === today && sub.status === 'Accepted'
    );

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 pb-20 selection:bg-indigo-200">
            
            {/* --- TOP: POWER ZONE --- */}
            <div className="relative pt-8 pb-12 bg-white border-b border-slate-200 shadow-sm">
                <div className="max-w-[1400px] mx-auto px-6">
                    {/* Header */}
                    <div className="flex justify-between items-center mb-10">
                        <div>
                            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
                                Welcome back, <span className="text-indigo-600">{user?.name}</span>
                            </h1>
                            <p className="text-slate-500 mt-1">Ready to keep your streak alive?</p>
                        </div>
                        <button 
                            onClick={() => setIsEditProfileOpen(true)}
                            className="flex items-center gap-3 bg-white hover:bg-slate-50 border border-slate-200 px-4 py-2 rounded-full shadow-sm transition-all group"
                        >
                            {user?.avatar ? (
                                <img src={user.avatar} className="w-8 h-8 rounded-full border border-indigo-200 object-cover" alt="avatar" />
                            ) : (
                                <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-xs font-bold text-white">
                                    {user?.name?.[0]?.toUpperCase()}
                                </div>
                            )}
                            <span className="text-sm font-medium text-slate-600 group-hover:text-slate-900">Edit Profile</span>
                        </button>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <StatCard 
                            label="Global Rank" 
                            value={`#${stats.rank || 'N/A'}`} 
                            subValue={stats.rank ? "Top 15%" : "Unranked"} 
                            trend="up" 
                            icon={<FaTrophy className="text-amber-500" />} 
                            delay={0}
                        />
                        <StatCard 
                            label="Current Streak" 
                            value={stats.streak} 
                            unit="Days" 
                            trend={stats.streak > 0 ? "hot" : "neutral"} 
                            icon={<FaFire className="text-orange-500" />} 
                            delay={0.1}
                        />
                        <StatCard 
                            label="Problems Solved" 
                            value={stats.solvedCount} 
                            subValue={`/ ${stats.totalQuestions}`} 
                            trend="up" 
                            icon={<FaCheckCircle className="text-emerald-500" />} 
                            delay={0.2}
                        />
                        <StatCard 
                            label="Skill Score" 
                            value={stats.points} 
                            unit="XP" 
                            trend="up" 
                            icon={<FaBolt className="text-indigo-500" />} 
                            delay={0.3}
                        />
                    </div>
                </div>
            </div>

            {/* --- MAIN LAYOUT --- */}
            <div className="max-w-[1400px] mx-auto px-6 mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                
                {/* --- LEFT COLUMN --- */}
                <div className="lg:col-span-8 flex flex-col gap-6">
                    
                    {/* 1. Consistency Graph */}
                    <SectionContainer title="Consistency Graph">
                        <div className="w-full overflow-hidden rounded-xl bg-white border border-slate-100 p-4 shadow-sm">
                            <div className="overflow-x-auto custom-scrollbar">
                                <ActivityHeatmap 
                                    activityData={stats.activity || {}} 
                                    totalSubmissions={stats.totalSubmissions || 0}
                                    count={stats.totalSubmissions || 0} 
                                />
                            </div>
                        </div>
                    </SectionContainer>

                    {/* 2. Topic Mastery */}
                    <SectionContainer title="Topic Mastery">
                        <div className="grid grid-cols-1 gap-4">
                            {courses?.map((course) => (
                                <Link href="/courses" key={course._id}>
                                    <div className="group relative overflow-hidden rounded-xl bg-white border border-slate-200 shadow-sm hover:border-indigo-300 transition-all duration-300">
                                        <div className="absolute inset-0 bg-gradient-to-r from-indigo-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                                        <div className="relative p-5 flex items-center gap-5">
                                            <div className="w-14 h-14 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                                                <FaBrain className="text-xl text-indigo-600" />
                                            </div>
                                            <div className="flex-grow min-w-0">
                                                <div className="flex justify-between items-center mb-1">
                                                    <h4 className="text-base font-bold text-slate-800 group-hover:text-indigo-700 truncate">{course.title}</h4>
                                                    <span className="text-xs font-mono text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded border border-indigo-200">{course.solved}/{course.total}</span>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <div className="flex-grow h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                        <motion.div initial={{ width: 0 }} whileInView={{ width: `${course.percentage}%` }} className="h-full bg-indigo-500" />
                                                    </div>
                                                    <span className="text-xs font-bold text-slate-500 w-8 text-right">{course.percentage}%</span>
                                                </div>
                                            </div>
                                            <div className="text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all"><FaArrowRight /></div>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </SectionContainer>
                </div>

                {/* --- RIGHT COLUMN --- */}
                <div className="lg:col-span-4 flex flex-col gap-6 sticky top-8">
                    
                    {/* 1. Daily Streak */}
                    <div className={`rounded-2xl p-6 relative overflow-hidden shadow-sm border transition-all ${hasSolvedToday ? 'bg-emerald-50 border-emerald-200' : 'bg-indigo-50 border-indigo-200'}`}>
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                                    <FaFire className={hasSolvedToday ? "text-emerald-500" : "text-orange-500"} /> Daily Streak
                                </h3>
                                <p className="text-slate-600 text-xs mt-1">{hasSolvedToday ? "Streak active!" : "Solve 1 problem now"}</p>
                            </div>
                            <div className="text-right">
                                <span className="text-xl font-mono font-bold text-slate-900 block">{timeLeft}</span>
                                <span className="text-[10px] text-slate-500 uppercase tracking-wider">Reset in</span>
                            </div>
                        </div>
                        {hasSolvedToday ? (
                            <div className="w-full py-2.5 bg-emerald-100 border border-emerald-300 text-emerald-700 font-bold rounded-lg text-sm flex items-center justify-center gap-2"><FaCheckCircle /> Completed</div>
                        ) : (
                            <Link href="/problems">
                                <button className="w-full py-2.5 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 shadow-sm transition-colors text-sm flex items-center justify-center gap-2"><FaCode /> Solve Problem</button>
                            </Link>
                        )}
                    </div>

                    {/* 2. Recent Activity */}
                    <SectionContainer title="Recent Activity" noPadding>
                        <div className="divide-y divide-slate-100">
                            {recentActivity?.length > 0 ? (
                                recentActivity.slice(0, 5).map((sub, i) => {
                                    const { id: questionId, title } = getQuestionDetails(sub);
                                    
                                    const isDeleted = title === 'Deleted Question' || title === 'Data Missing';
                                    
                                    return (
                                        <div key={i} className="p-4 hover:bg-slate-50 transition-colors group">
                                            <div className="flex items-start gap-3">
                                                <div className={`mt-0.5 p-1.5 rounded-md shrink-0 ${sub.status === 'Accepted' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                                                    {sub.status === 'Accepted' ? <FaCheckCircle size={10} /> : <FaLock size={10} />}
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    {questionId && !isDeleted ? (
                                                        <Link href={`/problems/${questionId}`} className="block text-sm font-medium text-slate-800 group-hover:text-indigo-600 transition-colors truncate">
                                                            {title}
                                                        </Link>
                                                    ) : (
                                                        <span 
                                                            className="flex items-center gap-2 text-sm font-medium text-slate-500 italic cursor-not-allowed truncate"
                                                            title="This problem may have been deleted from the database"
                                                        >
                                                            {title} <FaExclamationTriangle className="text-amber-500 text-[10px]" />
                                                        </span>
                                                    )}
                                                    <div className="flex items-center gap-2 mt-1.5">
                                                        <DifficultyBadge level={sub.difficulty} small />
                                                        <span className="text-[10px] text-slate-500">{new Date(sub.createdAt).toLocaleDateString()}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="p-6 text-center text-xs text-slate-500">No recent activity.</div>
                            )}
                        </div>
                    </SectionContainer>

                </div>
            </div>

            <EditProfileModal isOpen={isEditProfileOpen} onClose={() => setIsEditProfileOpen(false)} user={user} />
        </div>
    );
};

/* --- SUB-COMPONENTS --- */

const SectionContainer = ({ title, children, noPadding }) => (
    <motion.div 
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden h-auto" 
    >
        <div className="px-6 pt-5 pb-2">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span> {title}
            </h3>
        </div>
        <div className={noPadding ? '' : 'p-6 pt-2'}>
            {children}
        </div>
    </motion.div>
);

const StatCard = ({ label, value, subValue, unit, trend, icon, delay }) => (
    <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay }}
        className="bg-white border border-slate-200 shadow-sm p-5 rounded-2xl relative overflow-hidden hover:border-indigo-300 transition-all"
    >
        <div className="flex justify-between items-start mb-2">
            <span className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">{label}</span>
            <div className="text-base opacity-90">{icon}</div>
        </div>
        <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold text-slate-900 tracking-tight">{value}</span>
            {unit && <span className="text-xs text-slate-500 font-medium">{unit}</span>}
        </div>
        {subValue && (
            <div className="mt-1 flex items-center gap-2 text-[10px] font-medium text-emerald-600">{subValue}</div>
        )}
    </motion.div>
);

const DifficultyBadge = ({ level, small }) => {
    const colors = {
        'Easy': 'text-emerald-700 bg-emerald-100 border-emerald-200',
        'Medium': 'text-amber-700 bg-amber-100 border-amber-200',
        'Hard': 'text-rose-700 bg-rose-100 border-rose-200',
    };
    return (
        <span className={`inline-block rounded border ${colors[level] || colors['Medium']} ${small ? 'px-1.5 py-0.5 text-[9px] font-semibold' : 'px-2 py-0.5 text-[10px] font-bold'}`}>
            {level}
        </span>
    );
};

export default Dashboard;