import React, { useState, useEffect, useMemo } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import api from '@/services/api';
import useAuth from '@/hooks/useAuth';
import { getAvatarUrl } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import Spinner from '@/components/Spinner';
import { 
    MapPin, Calendar, Github, Trophy, Star, Flame, 
    Activity, Edit2, Share2, Eye, MessageSquare, 
    ChevronDown, Check, Link as LinkIcon,
    UserPlus, UserCheck, Clock 
} from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { format, startOfYear, endOfYear, eachDayOfInterval, getDay, getMonth } from 'date-fns';
import toast from 'react-hot-toast';

export async function getServerSideProps(context) {
    const { id } = context.params;
    let profileData = null;
    try {
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
        const res = await fetch(`${baseUrl}/users/${id}`);
        if (res.ok) profileData = await res.json();
    } catch (err) { console.error("SSR Error:", err); }
    return { props: { initialProfile: profileData || null } };
}

const ProfilePage = ({ initialProfile }) => {
    const router = useRouter();
    const { id } = router.query;
    const { user: currentUser } = useAuth();
    
    const [profile, setProfile] = useState(initialProfile);
    const [loading, setLoading] = useState(!initialProfile);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

    // --- NEW: Connection States ---
    const [connectionStatus, setConnectionStatus] = useState('none'); // 'none', 'sent', 'pending', 'connected'
    const [actionLoading, setActionLoading] = useState(false);

    // --- Fetch Profile ---
    useEffect(() => {
        if (!profile && id) {
            const fetchProfile = async () => {
                try {
                    setLoading(true);
                    const { data } = await api.get(`/users/${id}`);
                    setProfile(data);
                } catch (err) {
                    toast.error("User not found");
                } finally {
                    setLoading(false);
                }
            };
            fetchProfile();
        }
    }, [id, profile]);

    // --- NEW: Fetch Connection Status ---
    useEffect(() => {
        if (currentUser && id && currentUser._id !== id) {
            const checkStatus = async () => {
                try {
                    // Assuming endpoint returns { status: 'none' | 'sent' | 'pending' | 'connected' }
                    const res = await api.get(`/users/connect/status/${id}`);
                    setConnectionStatus(res.data.status);
                } catch (e) { 
                    // Silent fail or default to none
                    console.error("Status check failed", e); 
                }
            };
            checkStatus();
        }
    }, [id, currentUser]);

    // --- NEW: Handle Connection Actions ---
    const handleConnectionAction = async () => {
        setActionLoading(true);
        try {
            if (connectionStatus === 'none') {
                // Send Request
                await api.post(`/users/connect/${id}`);
                setConnectionStatus('sent');
                toast.success("Request sent!");
            } else if (connectionStatus === 'pending') {
                // Accept Request
                await api.post(`/users/connect/accept/${id}`);
                setConnectionStatus('connected');
                toast.success("You are now connected!");
            }
        } catch (error) {
            toast.error(error.response?.data?.msg || "Action failed");
        } finally {
            setActionLoading(false);
        }
    };

    const handleMessage = () => {
        if (connectionStatus !== 'connected') {
            return toast.error("You must be connected to message this user.");
        }
        // Redirect to chat
        router.push(`/messages?userId=${id}`);
    };

    const handleShare = () => {
        navigator.clipboard.writeText(window.location.href);
        toast.success("Profile link copied!");
    };

    // --- Existing Data Processing ---
    const activityMap = useMemo(() => profile?.stats?.activity || {}, [profile]);
    const availableYears = useMemo(() => {
        const years = new Set([new Date().getFullYear()]);
        Object.keys(activityMap).forEach(date => {
            const y = new Date(date).getFullYear();
            if (!isNaN(y)) years.add(y);
        });
        return Array.from(years).sort((a, b) => b - a);
    }, [activityMap]);

    const joinedYear = useMemo(() => {
        const createdYear = profile?.createdAt ? new Date(profile.createdAt).getFullYear() : new Date().getFullYear();
        const activityYears = availableYears.length > 0 ? Math.min(...availableYears) : createdYear;
        return Math.min(createdYear, activityYears);
    }, [profile, availableYears]);

    const yearlyTotal = useMemo(() => {
        let total = 0;
        Object.entries(activityMap).forEach(([date, count]) => {
            if (new Date(date).getFullYear() === selectedYear) total += count;
        });
        return total;
    }, [activityMap, selectedYear]);

    const difficultyStats = profile?.stats?.difficulty || { Easy: { solved: 0, total: 0 }, Medium: { solved: 0, total: 0 }, Hard: { solved: 0, total: 0 } };
    const totalQuestions = (difficultyStats.Easy.total || 0) + (difficultyStats.Medium.total || 0) + (difficultyStats.Hard.total || 0);
    const base = Math.max(totalQuestions, 1); 

    const donutGradient = useMemo(() => {
        const easyPct = (difficultyStats.Easy.solved / base) * 100;
        const medPct = (difficultyStats.Medium.solved / base) * 100;
        const hardPct = (difficultyStats.Hard.solved / base) * 100;
        const totalFilled = easyPct + medPct + hardPct;

        if (totalFilled === 0) return 'conic-gradient(#f1f5f9 0% 100%)';

        return `conic-gradient(
            #10b981 0% ${easyPct}%, 
            #f59e0b ${easyPct}% ${easyPct + medPct}%, 
            #ef4444 ${easyPct + medPct}% ${totalFilled}%,
            #f1f5f9 ${totalFilled}% 100%
        )`;
    }, [difficultyStats, base]);

    if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#F3F2EF]"><Spinner size="xl" /></div>;
    if (!profile) return <div className="min-h-screen flex items-center justify-center">User not found</div>;

    const isOwnProfile = currentUser?._id === profile._id;
    const stats = profile.stats || {};
    const avatarUrl = profile.avatar ? `${getAvatarUrl(profile.avatar)}?t=${new Date().getTime()}` : null;

    return (
        <>
            <Head><title>{profile.name} | CodeFlow</title></Head>

            <div className="min-h-screen bg-[#fafafa] py-8 font-sans text-slate-800">
                <div className="max-w-6xl mx-auto px-4">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                        
                        {/* LEFT COLUMN */}
                        <div className="lg:col-span-4 space-y-6">
                            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 relative overflow-hidden">
                                {isOwnProfile && (
                                    <button onClick={() => router.push('/settings/profile')} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition">
                                        <Edit2 size={16} />
                                    </button>
                                )}
                                <div className="flex flex-col items-center text-center">
                                    <Avatar className="h-28 w-28 border-4 border-white shadow-lg mb-4">
                                        <AvatarImage src={avatarUrl} className="object-cover" />
                                        <AvatarFallback className="text-3xl bg-slate-100">{profile.name?.[0]}</AvatarFallback>
                                    </Avatar>
                                    <h1 className="text-xl font-bold text-slate-900">{profile.name}</h1>
                                    <p className="text-slate-500 text-sm mb-4">@{profile.username}</p>
                                    
                                    {/* BIO SECTION */}
                                    {profile.bio && <p className="text-sm text-slate-600 mb-4 px-4">{profile.bio}</p>}

                                    <div className="w-full bg-amber-50 text-amber-700 py-2 rounded-lg font-bold text-sm mb-6 flex items-center justify-center gap-2">
                                        <Trophy size={16} /> Rank #{stats.rank || 'N/A'}
                                    </div>
                                    <div className="w-full space-y-3 text-sm text-slate-600">
                                        {profile.location && <div className="flex items-center gap-3"><MapPin size={16} className="text-slate-400" /><span>{profile.location}</span></div>}
                                        <div className="flex items-center gap-3"><Calendar size={16} className="text-slate-400" /><span>Joined {joinedYear}</span></div>
                                        {profile.socials?.github && <a href={profile.socials.github} target="_blank" className="flex items-center gap-3 hover:text-blue-600"><Github size={16} className="text-slate-400" /><span>Github</span></a>}
                                        {profile.socials?.linkedin && <a href={profile.socials.linkedin} target="_blank" className="flex items-center gap-3 hover:text-blue-600"><LinkIcon size={16} className="text-slate-400" /><span>LinkedIn</span></a>}
                                        {profile.socials?.website && <a href={profile.socials.website} target="_blank" className="flex items-center gap-3 hover:text-blue-600"><LinkIcon size={16} className="text-slate-400" /><span>Website</span></a>}
                                    </div>
                                    
                                    {/* --- NEW: Dynamic Action Buttons --- */}
                                    {!isOwnProfile && (
                                        <div className="mt-6 w-full flex gap-3">
                                            {connectionStatus === 'connected' ? (
                                                <Button 
                                                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-xl gap-2"
                                                    onClick={handleMessage}
                                                >
                                                    <MessageSquare size={18} /> Message
                                                </Button>
                                            ) : (
                                                <Button 
                                                    className={`flex-1 rounded-xl gap-2 text-white ${
                                                        connectionStatus === 'sent' ? 'bg-gray-400 cursor-not-allowed' : 
                                                        connectionStatus === 'pending' ? 'bg-green-600 hover:bg-green-700' : 
                                                        'bg-blue-600 hover:bg-blue-700'
                                                    }`}
                                                    onClick={handleConnectionAction}
                                                    disabled={connectionStatus === 'sent' || actionLoading}
                                                >
                                                    {actionLoading ? <Spinner size="sm" color="white" /> : (
                                                        <>
                                                            {connectionStatus === 'none' && <><UserPlus size={18} /> Connect</>}
                                                            {connectionStatus === 'sent' && <><Clock size={18} /> Pending</>}
                                                            {connectionStatus === 'pending' && <><UserCheck size={18} /> Accept Request</>}
                                                        </>
                                                    )}
                                                </Button>
                                            )}
                                            
                                            <Button variant="outline" className="rounded-xl" size="icon" onClick={handleShare}>
                                                <Share2 size={18} />
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Community Stats</h3>
                                <div className="space-y-4">
                                    <StatRow icon={<Eye size={16}/>} label="Views" value={stats.views} />
                                    <StatRow icon={<Check size={16}/>} label="Solutions" value={stats.solvedCount} />
                                    <StatRow icon={<MessageSquare size={16}/>} label="Discuss" value={stats.discuss} />
                                    <div className="flex justify-between items-center pt-2 border-t border-slate-50">
                                        <span className="text-sm text-slate-600 font-semibold">Reputation</span>
                                        <span className="font-bold text-yellow-600">{stats.points}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* RIGHT COLUMN */}
                        <div className="lg:col-span-8 space-y-6">
                            
                            {/* Solved Problems */}
                            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
                                <h2 className="text-sm font-bold text-slate-400 uppercase mb-6">Solved Problems</h2>
                                <div className="flex flex-col md:flex-row items-center gap-10">
                                    <div className="relative h-32 w-32 rounded-full flex items-center justify-center transition-all duration-500" style={{ background: donutGradient }}>
                                        <div className="absolute inset-2 bg-white rounded-full flex flex-col items-center justify-center">
                                            <span className="text-3xl font-bold text-slate-900">{stats.solvedCount}</span>
                                            <span className="text-xs text-slate-400">Solved</span>
                                        </div>
                                    </div>
                                    <div className="flex-grow space-y-4 w-full">
                                        <DifficultyBar label="Easy" color="bg-emerald-500" solved={stats.difficulty?.Easy?.solved} total={stats.difficulty?.Easy?.total} />
                                        <DifficultyBar label="Medium" color="bg-amber-500" solved={stats.difficulty?.Medium?.solved} total={stats.difficulty?.Medium?.total} />
                                        <DifficultyBar label="Hard" color="bg-red-500" solved={stats.difficulty?.Hard?.solved} total={stats.difficulty?.Hard?.total} />
                                    </div>
                                </div>
                            </div>

                            {/* Stat Badges */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <StatCard icon={<Star className="text-yellow-500" />} label="Skill Score" value={stats.points || 0} />
                                <StatCard icon={<Flame className="text-orange-500" />} label="Max Streak" value={stats.maxStreak || 0} />
                                <StatCard icon={<Activity className="text-green-500" />} label="Active Days" value={stats.totalActiveDays || 0} />
                            </div>

                            {/* Submissions Graph */}
                            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
                                <div className="flex justify-between items-center mb-6">
                                    <h2 className="text-sm font-bold text-slate-400 uppercase">
                                        Submissions <span className="text-slate-300 font-normal ml-1">{selectedYear}</span>
                                    </h2>
                                    <div className="flex items-center gap-4">
                                        <div className="text-xs text-slate-500">Total: <span className="font-bold text-slate-900">{yearlyTotal}</span></div>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="outline" size="sm" className="h-8 gap-1 text-xs font-semibold bg-white border-slate-200 text-slate-700 hover:bg-slate-50">
                                                    {selectedYear} <ChevronDown size={12}/>
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="bg-white border-slate-200">
                                                {availableYears.map(year => (
                                                    <DropdownMenuItem key={year} onClick={() => setSelectedYear(year)} className="text-slate-700 hover:bg-slate-50 cursor-pointer">
                                                        {year}
                                                    </DropdownMenuItem>
                                                ))}
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </div>
                                <ContributionGraph year={selectedYear} data={activityMap} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

// ... Sub Components ...
const ContributionGraph = ({ year, data }) => {
    const { months, monthLabels } = useMemo(() => {
        const start = startOfYear(new Date(year, 0, 1));
        const end = endOfYear(new Date(year, 0, 1));
        const days = eachDayOfInterval({ start, end });
        const monthBlocks = [];
        let currentMonth = -1;
        let currentBlock = null;
        let currentWeek = new Array(7).fill(null);
        const startDayIdx = getDay(days[0]);
        for(let i=0; i<startDayIdx; i++) currentWeek[i] = null;

        days.forEach((day, i) => {
            const m = getMonth(day);
            const dIdx = getDay(day);
            if (m !== currentMonth) {
                if (currentBlock) {
                    if(currentWeek.some(x=>x!==null)) currentBlock.weeks.push([...currentWeek]);
                    monthBlocks.push(currentBlock);
                }
                currentBlock = { name: format(day, 'MMM'), weeks: [] };
                currentMonth = m;
                currentWeek = new Array(7).fill(null);
                for(let k=0; k<dIdx; k++) currentWeek[k] = null;
            }
            currentWeek[dIdx] = day;
            if (dIdx === 6 || i === days.length - 1) {
                currentBlock.weeks.push([...currentWeek]);
                currentWeek = new Array(7).fill(null);
            }
        });
        if(currentBlock) monthBlocks.push(currentBlock);
        return { months: monthBlocks };
    }, [year]);

    const getColor = (count) => {
        if (!count) return 'bg-slate-100'; 
        if (count <= 2) return 'bg-emerald-200';
        if (count <= 4) return 'bg-emerald-400';
        return 'bg-emerald-600';
    };

    return (
        <div className="w-full overflow-x-auto pb-2 custom-scrollbar">
            <div className="flex min-w-max pt-6">
                {months.map((month, mIdx) => (
                    <div key={mIdx} className="relative mr-4">
                        <span className="absolute -top-5 left-0 text-xs text-slate-400 font-medium">{month.name}</span>
                        <div className="flex gap-[3px]">
                            {month.weeks.map((week, wIdx) => (
                                <div key={wIdx} className="flex flex-col gap-[3px]">
                                    {week.map((day, dIdx) => {
                                        if (!day) return <div key={dIdx} className="w-3 h-3" />;
                                        const dateStr = format(day, 'yyyy-MM-dd');
                                        const count = data[dateStr] || 0;
                                        return <div key={dateStr} title={`${dateStr}: ${count}`} className={`w-3 h-3 rounded-[2px] ${getColor(count)}`} />;
                                    })}
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const StatRow = ({ icon, label, value }) => (
    <div className="flex justify-between items-center">
        <span className="flex items-center gap-2 text-sm text-slate-600">{icon} {label}</span>
        <span className="font-bold text-slate-900">{value}</span>
    </div>
);
const DifficultyBar = ({ label, color, solved = 0, total = 0 }) => {
    const safeTotal = total || 1; 
    const percent = (solved / safeTotal) * 100;
    return (
        <div className="flex items-center text-sm">
            <span className={`w-16 font-medium ${label === 'Easy' ? 'text-emerald-600' : label === 'Medium' ? 'text-amber-600' : 'text-red-600'}`}>{label}</span>
            <div className="flex-grow h-2 bg-slate-100 rounded-full mx-3 overflow-hidden">
                <div className={`h-full rounded-full ${color} transition-all duration-500`} style={{ width: `${percent}%` }}></div>
            </div>
            <span className="text-slate-600 font-mono text-xs w-12 text-right">
                <span className="font-bold text-slate-900">{solved}</span><span className="text-slate-400">/{total}</span>
            </span>
        </div>
    );
};
const StatCard = ({ icon, label, value }) => (
    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
        <div className="p-3 bg-slate-50 rounded-xl">{icon}</div>
        <div>
            <div className="text-2xl font-bold text-slate-900">{value}</div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wide">{label}</div>
        </div>
    </div>
);

export default ProfilePage;