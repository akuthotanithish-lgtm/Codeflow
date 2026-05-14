import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import api from '@/services/api';
import useAuth from '@/hooks/useAuth';
import IdentityCard from '@/components/discuss/IdentityCard';
import Spinner from '@/components/Spinner';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from '@/components/ui/button';
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { UserPlus, Sparkles, X, Clock, Search, Check, UserMinus } from 'lucide-react';
import { getAvatarUrl } from '@/lib/utils';
import toast from 'react-hot-toast';

const GrowNetwork = () => {
    const { user, loading: authLoading } = useAuth();
    
    // Data State
    const [suggestions, setSuggestions] = useState([]);
    const [requests, setRequests] = useState([]); // Incoming requests
    const [loading, setLoading] = useState(true);
    
    // UI State
    const [searchQuery, setSearchQuery] = useState("");
    const [sentRequests, setSentRequests] = useState(new Set());
    
    // Modal States
    const [mutualsModalOpen, setMutualsModalOpen] = useState(false);
    const [selectedMutuals, setSelectedMutuals] = useState([]);
    const [selectedCandidateName, setSelectedCandidateName] = useState("");
    
    const [withdrawModalOpen, setWithdrawModalOpen] = useState(false);
    const [userToWithdraw, setUserToWithdraw] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // 1. Fetch Suggestions (The Algorithm)
                const suggestionsRes = await api.get('/users/suggestions');
                setSuggestions(suggestionsRes.data);

                // 2. Fetch Incoming Requests (Pending Invitations)
                const requestsRes = await api.get('/users/connections/requests');
                setRequests(requestsRes.data);
            } catch (err) {
                console.error(err);
                toast.error("Failed to load network data.");
            } finally {
                setLoading(false);
            }
        };
        if (user) fetchData();
    }, [user]);

    // --- ACTIONS ---

    const handleConnect = async (targetId) => {
        try {
            await api.post(`/users/connect/${targetId}`);
            setSentRequests(prev => new Set(prev).add(targetId));
            toast.success("Request sent!");
        } catch (error) {
            toast.error("Failed to send request");
        }
    };

    const handleAccept = async (targetId) => {
        try {
            await api.post(`/users/connect/accept/${targetId}`);
            setRequests(prev => prev.filter(r => r._id !== targetId));
            toast.success("Connection accepted!");
            // Optional: Refresh suggestions to remove the new friend if they were there
        } catch (error) {
            toast.error("Failed to accept request");
        }
    };

    const handleIgnore = async (targetId) => {
        try {
            await api.delete(`/users/connections/${targetId}`); // Reusing remove logic
            setRequests(prev => prev.filter(r => r._id !== targetId));
            toast.success("Request ignored");
        } catch (error) {
            toast.error("Failed to ignore request");
        }
    };

    const handleWithdraw = async () => {
        if (!userToWithdraw) return;
        try {
            await api.delete(`/users/connections/${userToWithdraw._id}`);
            setSentRequests(prev => {
                const newSet = new Set(prev);
                newSet.delete(userToWithdraw._id);
                return newSet;
            });
            toast.success("Invitation withdrawn");
            setWithdrawModalOpen(false);
            setUserToWithdraw(null);
        } catch (error) {
            toast.error("Failed to withdraw invitation");
        }
    };

    // --- HELPERS ---

    const handleButtonClick = (person) => {
        if (sentRequests.has(person._id)) {
            setUserToWithdraw(person);
            setWithdrawModalOpen(true);
        } else {
            handleConnect(person._id);
        }
    };

    const openMutualsModal = (e, candidateName, mutualUsers) => {
        e.preventDefault();
        e.stopPropagation(); 
        setSelectedCandidateName(candidateName);
        setSelectedMutuals(mutualUsers);
        setMutualsModalOpen(true);
    };

    // Filter suggestions based on search
    const filteredSuggestions = suggestions.filter(p => 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.bio && p.bio.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    if (authLoading || loading) return <div className="min-h-screen flex items-center justify-center bg-[#F3F2EF]"><Spinner size="xl" /></div>;

    return (
        <div className="min-h-screen bg-[#F3F2EF] py-8 font-sans">
            <Head><title>Grow Your Network | CodeFlow</title></Head>
            
            <div className="max-w-[1200px] mx-auto px-4 grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Left Sidebar */}
                <div className="hidden lg:block lg:col-span-3">
                    <IdentityCard user={user} />
                </div>

                {/* Main Content */}
                <div className="lg:col-span-9 space-y-6">
                    
                    {/* 1. INVITATIONS SECTION (Only if requests exist) */}
                    {requests.length > 0 && (
                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                            <div className="px-5 py-4 border-b border-gray-100 flex justify-between items-center">
                                <h2 className="text-lg font-bold text-gray-900">Invitations ({requests.length})</h2>
                                <Link href="/network/connections" className="text-sm font-semibold text-gray-500 hover:text-gray-900">Manage</Link>
                            </div>
                            <div className="divide-y divide-gray-100">
                                {requests.map((req) => (
                                    <div key={req._id} className="p-4 flex items-center gap-4 hover:bg-gray-50 transition-colors">
                                        <Link href={`/profile/${req._id}`}>
                                            <Avatar className="h-16 w-16 border border-gray-100 cursor-pointer">
                                                <AvatarImage src={getAvatarUrl(req.avatar)} />
                                                <AvatarFallback>{req.name[0]}</AvatarFallback>
                                            </Avatar>
                                        </Link>
                                        
                                        <div className="flex-grow">
                                            <Link href={`/profile/${req._id}`}>
                                                <h3 className="font-bold text-gray-900 hover:underline cursor-pointer">{req.name}</h3>
                                            </Link>
                                            <p className="text-xs text-gray-500 line-clamp-1">{req.bio || "CodeFlow User"}</p>
                                            <div className="flex items-center gap-1 mt-1 text-xs text-gray-400">
                                                <Sparkles size={12} className="text-indigo-500"/>
                                                <span>Invited you to connect</span>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <Button 
                                                variant="ghost" 
                                                className="text-gray-500 hover:text-gray-700 font-semibold"
                                                onClick={() => handleIgnore(req._id)}
                                            >
                                                Ignore
                                            </Button>
                                            <Button 
                                                className="rounded-full border-indigo-600 text-indigo-600 hover:bg-indigo-50 hover:text-indigo-700 bg-white border px-6 font-bold"
                                                onClick={() => handleAccept(req._id)}
                                            >
                                                Accept
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* 2. SUGGESTIONS HEADER & SEARCH */}
                    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm flex flex-col sm:flex-row justify-between items-center gap-4">
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">People you may know</h2>
                            <p className="text-sm text-gray-500 mt-1">Based on your activity and connections</p>
                        </div>
                        <div className="relative w-full sm:w-64">
                            <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
                            <Input 
                                placeholder="Search people..." 
                                className="pl-10 bg-gray-50 border-gray-200 focus:bg-white"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* 3. SUGGESTIONS GRID */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                        {filteredSuggestions.map((person) => (
                            <div key={person._id} className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col relative overflow-hidden group">
                                {/* Banner */}
                                <div className="h-16 bg-gradient-to-r from-blue-600 to-indigo-600 relative">
                                    <button className="absolute top-2 right-2 p-1 rounded-full bg-black/20 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/40">
                                        <X size={14} />
                                    </button>
                                </div>

                                {/* Avatar */}
                                <div className="px-4 flex justify-center -mt-10 mb-3">
                                    <Link href={`/profile/${person._id}`}>
                                        <Avatar className="h-24 w-24 border-4 border-white shadow-md cursor-pointer transition-transform group-hover:scale-105">
                                            <AvatarImage src={getAvatarUrl(person.avatar)} className="object-cover" />
                                            <AvatarFallback className="text-2xl bg-slate-100 text-slate-500 font-bold">{person.name?.[0]}</AvatarFallback>
                                        </Avatar>
                                    </Link>
                                </div>

                                {/* Info */}
                                <div className="px-4 text-center flex-grow">
                                    <Link href={`/profile/${person._id}`}>
                                        <h3 className="font-bold text-gray-900 text-lg truncate hover:underline cursor-pointer">{person.name}</h3>
                                    </Link>
                                    <p className="text-xs text-gray-500 mt-1 line-clamp-2 h-8 leading-tight px-1">
                                        {person.bio || "CodeFlow Developer"}
                                    </p>

                                    {/* Mutuals Logic */}
                                    <div className="mt-4 h-10 flex items-center justify-center">
                                        {person.mutualUsers && person.mutualUsers.length > 0 ? (
                                            <button onClick={(e) => openMutualsModal(e, person.name, person.mutualUsers)} className="flex items-center gap-2 group/mutual cursor-pointer">
                                                <div className="flex -space-x-2">
                                                    {person.mutualUsers.slice(0, 2).map((m) => (
                                                        <Avatar key={m._id} className="h-6 w-6 border-2 border-white ring-1 ring-gray-100">
                                                            <AvatarImage src={getAvatarUrl(m.avatar)} />
                                                            <AvatarFallback className="text-[8px] bg-gray-100">{m.name[0]}</AvatarFallback>
                                                        </Avatar>
                                                    ))}
                                                </div>
                                                <span className="text-xs text-gray-500 group-hover/mutual:text-blue-600 group-hover/mutual:underline text-left leading-tight">
                                                    {person.mutualCount === 1 ? <span className="font-medium">{person.mutualUsers[0].name}</span> : <span>{person.mutualCount} mutual connections</span>}
                                                </span>
                                            </button>
                                        ) : (
                                            <div className="flex items-center gap-1.5 text-xs text-gray-400 bg-gray-50 px-2 py-1 rounded-full">
                                                <Sparkles size={10} className="text-amber-500"/>
                                                <span>{person.reason || "Suggested for you"}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Connect Button */}
                                <div className="p-4 mt-1">
                                    <Button 
                                        variant={sentRequests.has(person._id) ? "outline" : "default"}
                                        className={`w-full rounded-full font-semibold transition-all ${
                                            sentRequests.has(person._id) 
                                                ? 'border-gray-300 text-gray-500 bg-transparent hover:bg-gray-50 hover:text-gray-700' 
                                                : 'bg-transparent border border-blue-600 text-blue-600 hover:bg-blue-50'
                                        }`}
                                        onClick={() => handleButtonClick(person)}
                                    >
                                        {sentRequests.has(person._id) ? (
                                            <span className="flex items-center gap-2"><Clock size={14}/> Pending</span>
                                        ) : 'Connect'}
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {filteredSuggestions.length === 0 && (
                        <div className="text-center py-20 bg-white rounded-xl border border-gray-200">
                            <p className="text-gray-500">No suggestions match your search.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* MUTUALS MODAL */}
            <Dialog open={mutualsModalOpen} onOpenChange={setMutualsModalOpen}>
                <DialogContent className="sm:max-w-[480px] bg-white p-0 gap-0 overflow-hidden border-none shadow-2xl">
                    <DialogHeader className="px-6 py-4 border-b border-gray-100 bg-white sticky top-0 z-10">
                        <DialogTitle className="text-lg font-bold text-gray-900">{selectedMutuals.length} Mutual Connections</DialogTitle>
                        <p className="text-sm text-gray-500">You and {selectedCandidateName} both know these people.</p>
                    </DialogHeader>
                    <div className="max-h-[400px] overflow-y-auto p-2 custom-scrollbar">
                        {selectedMutuals.map((mutual) => (
                            <div key={mutual._id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-xl transition-colors group">
                                <Link href={`/profile/${mutual._id}`} className="flex items-center gap-3 flex-grow">
                                    <Avatar className="h-12 w-12 border border-gray-100">
                                        <AvatarImage src={getAvatarUrl(mutual.avatar)} />
                                        <AvatarFallback>{mutual.name?.[0]}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <h4 className="font-bold text-sm text-gray-900 group-hover:text-blue-600 group-hover:underline">{mutual.name}</h4>
                                        <p className="text-xs text-gray-500">Connected</p>
                                    </div>
                                </Link>
                            </div>
                        ))}
                    </div>
                </DialogContent>
            </Dialog>

            {/* WITHDRAW MODAL */}
            <Dialog open={withdrawModalOpen} onOpenChange={setWithdrawModalOpen}>
                <DialogContent className="sm:max-w-[400px] bg-white border-gray-200 shadow-xl">
                    <DialogHeader>
                        <DialogTitle>Withdraw Invitation</DialogTitle>
                        <DialogDescription className="pt-2">
                            If you withdraw now, you won't be able to resend an invitation to <strong>{userToWithdraw?.name}</strong> for 3 weeks.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="mt-4 gap-2 sm:gap-0">
                        <Button variant="outline" onClick={() => setWithdrawModalOpen(false)}>Cancel</Button>
                        <Button variant="destructive" onClick={handleWithdraw}>Withdraw</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default GrowNetwork;