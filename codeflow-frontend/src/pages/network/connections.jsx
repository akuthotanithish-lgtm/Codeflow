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
import { MessageSquare, UserMinus, Search, MapPin, X } from 'lucide-react';
import { getAvatarUrl } from '@/lib/utils';
import toast from 'react-hot-toast';

const MyConnections = () => {
    const { user, loading: authLoading } = useAuth();
    const [connections, setConnections] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        const fetchConnections = async () => {
            try {
                // Fetch connected users
                const res = await api.get('/users/connections');
                setConnections(res.data);
            } catch (err) {
                console.error(err);
                toast.error("Failed to load connections.");
            } finally {
                setLoading(false);
            }
        };
        if (user) fetchConnections();
    }, [user]);

    const handleRemove = async (targetId) => {
        if (!confirm("Are you sure you want to remove this connection?")) return;
        try {
            await api.delete(`/users/connections/${targetId}`);
            setConnections(prev => prev.filter(c => c._id !== targetId));
            toast.success("Connection removed.");
        } catch (error) {
            toast.error("Failed to remove connection.");
        }
    };

    // Filter based on search
    const filteredConnections = connections.filter(c => 
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.username && c.username.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    if (authLoading || loading) return <div className="min-h-screen flex items-center justify-center bg-[#F3F2EF]"><Spinner size="xl" /></div>;

    return (
        <div className="min-h-screen bg-[#F3F2EF] py-8 font-sans">
            <Head><title>My Connections | CodeFlow</title></Head>
            
            <div className="max-w-[1200px] mx-auto px-4 grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Left Sidebar */}
                <div className="hidden lg:block lg:col-span-3">
                    <IdentityCard user={user} />
                </div>

                {/* Main Content */}
                <div className="lg:col-span-9">
                    {/* Header & Search */}
                    <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6 shadow-sm flex flex-col sm:flex-row justify-between items-center gap-4">
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">{connections.length} Connections</h2>
                            <p className="text-sm text-gray-500 mt-1">Teammates, mentors, and friends.</p>
                        </div>
                        
                        <div className="relative w-full sm:w-72">
                            <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
                            <Input 
                                placeholder="Search by name" 
                                className="pl-10 bg-gray-50 border-gray-200 focus:bg-white"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                        {filteredConnections.map((person) => (
                            <div key={person._id} className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:border-gray-300 transition-all duration-300 flex flex-col relative overflow-hidden group">
                                
                                {/* 1. Banner & Options */}
                                <div className="h-16 bg-gradient-to-r from-emerald-500 to-teal-600 relative">
                                    {/* Optional: Add a 3-dot menu here later */}
                                </div>

                                {/* 2. Profile Picture */}
                                <div className="px-4 flex justify-center -mt-10 mb-3">
                                    <Link href={`/profile/${person._id}`}>
                                        <Avatar className="h-24 w-24 border-4 border-white shadow-md cursor-pointer transition-transform group-hover:scale-105">
                                            <AvatarImage src={getAvatarUrl(person.avatar)} className="object-cover" />
                                            <AvatarFallback className="text-2xl bg-slate-100 text-slate-500 font-bold">
                                                {person.name?.[0]}
                                            </AvatarFallback>
                                        </Avatar>
                                    </Link>
                                </div>

                                {/* 3. User Info */}
                                <div className="px-4 text-center flex-grow">
                                    <Link href={`/profile/${person._id}`}>
                                        <h3 className="font-bold text-gray-900 text-lg truncate hover:underline cursor-pointer">
                                            {person.name}
                                        </h3>
                                    </Link>
                                    <p className="text-xs text-gray-500 mt-1 line-clamp-2 h-8 leading-tight px-1">
                                        {person.bio || "CodeFlow Developer"}
                                    </p>
                                    
                                    <div className="mt-3 flex items-center justify-center gap-1.5 text-xs text-gray-400">
                                        <p>Connected {new Date(person.connectedAt).toLocaleDateString()}</p>
                                    </div>
                                </div>

                                {/* 4. Action Buttons */}
                                <div className="p-4 mt-2 flex gap-2">
                                    <Link href={`/messages?userId=${person._id}`} className="flex-1">
                                        <Button 
                                            className="w-full rounded-full font-semibold bg-indigo-600 hover:bg-indigo-700 text-white border-0"
                                        >
                                            <MessageSquare size={16} className="mr-2"/> Message
                                        </Button>
                                    </Link>
                                    <Button 
                                        variant="outline"
                                        className="rounded-full w-10 px-0 border-gray-300 text-gray-500 hover:text-red-600 hover:border-red-200 hover:bg-red-50"
                                        onClick={() => handleRemove(person._id)}
                                        title="Remove Connection"
                                    >
                                        <UserMinus size={16} />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {filteredConnections.length === 0 && (
                        <div className="text-center py-20 bg-white rounded-xl border border-gray-200">
                            <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Search size={32} className="text-gray-400" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900">No connections found</h3>
                            <p className="text-gray-500 max-w-sm mx-auto mt-2">
                                {searchQuery ? "Try a different search term." : "You haven't connected with anyone yet."}
                            </p>
                            {!searchQuery && (
                                <Link href="/network">
                                    <Button variant="link" className="text-indigo-600 font-bold mt-2">
                                        Grow your network &rarr;
                                    </Button>
                                </Link>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MyConnections;