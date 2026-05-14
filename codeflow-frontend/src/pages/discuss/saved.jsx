import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import api from '@/services/api';
import useAuth from '@/hooks/useAuth';
import DiscussionCard from '@/components/discuss/DiscussionCard';
import IdentityCard from '@/components/discuss/IdentityCard'; // Re-use sidebar
import Spinner from '@/components/Spinner';
import { Bookmark, ArrowLeft } from 'lucide-react';

const SavedPostsPage = () => {
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
            return;
        }

        const fetchSavedPosts = async () => {
            try {
                // Fetch saved posts from backend
                const { data } = await api.get('/discussions/saved');
                setPosts(data);
            } catch (err) {
                console.error("Failed to fetch saved posts", err);
            } finally {
                setLoading(false);
            }
        };

        if (user) {
            fetchSavedPosts();
        }
    }, [user, authLoading, router]);

    if (authLoading || loading) {
        return <div className="min-h-screen flex items-center justify-center bg-[#F3F2EF]"><Spinner size="xl" /></div>;
    }

    return (
        <>
            <Head>
                <title>Saved Items | CodeFlow</title>
            </Head>

            <div className="min-h-screen bg-[#F3F2EF] py-6 font-sans">
                <div className="max-w-[1128px] mx-auto px-4">
                    
                    {/* Header */}
                    <div className="mb-4 flex items-center gap-2">
                        <button onClick={() => router.back()} className="p-2 hover:bg-gray-200 rounded-full transition">
                            <ArrowLeft size={20} className="text-gray-600"/>
                        </button>
                        <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                            <Bookmark className="fill-current" size={24}/> My Saved Items
                        </h1>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                        
                        {/* Left Sidebar (Identity) */}
                        <div className="hidden lg:block lg:col-span-3">
                            <IdentityCard user={user} />
                        </div>

                        {/* Main Feed (Saved Posts) */}
                        <div className="lg:col-span-6">
                            {posts.length > 0 ? (
                                <div className="space-y-2">
                                    {posts.map(post => (
                                        <DiscussionCard 
                                            key={post._id} 
                                            post={post} 
                                            currentUser={user} 
                                        />
                                    ))}
                                </div>
                            ) : (
                                <div className="bg-white rounded-lg shadow-sm border border-gray-300 p-8 text-center">
                                    <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <Bookmark size={32} className="text-gray-400" />
                                    </div>
                                    <h3 className="text-lg font-bold text-gray-900">No saved items yet</h3>
                                    <p className="text-gray-500 mt-2 mb-6">Posts you save will appear here for easy access.</p>
                                    <button 
                                        onClick={() => router.push('/discuss')}
                                        className="text-blue-600 font-semibold hover:underline"
                                    >
                                        Go to Feed
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Right Sidebar (Optional) */}
                        <div className="hidden lg:block lg:col-span-3">
                            <div className="bg-white rounded-lg shadow-sm border border-gray-300 p-4">
                                <p className="text-xs text-gray-500">
                                    Saved items are private and only visible to you.
                                </p>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </>
    );
};

export default SavedPostsPage;