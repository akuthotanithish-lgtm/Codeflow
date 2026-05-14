import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import useAuth from '@/hooks/useAuth';
import api from '@/services/api';
import Spinner from '@/components/Spinner';
import DiscussionCard from '@/components/discuss/DiscussionCard';
import IdentityCard from '@/components/discuss/IdentityCard';
import NewsWidget from '@/components/discuss/NewsWidget';
import CreatePostModal from '@/components/discuss/CreatePostModal';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { FaImage, FaVideo, FaNewspaper } from 'react-icons/fa6'; 

const DiscussPage = () => {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    
    // Feed State
    const [posts, setPosts] = useState([]);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [loading, setLoading] = useState(false);
    
    // Modal State
    const [isPostModalOpen, setIsPostModalOpen] = useState(false);
    const [modalMediaType, setModalMediaType] = useState(null); 

    // --- INFINITE SCROLL OBSERVER ---
    const observer = useRef();
    const lastPostElementRef = useCallback(node => {
        if (loading) return;
        if (observer.current) observer.current.disconnect();
        
        observer.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && hasMore) {
                setPage(prevPage => prevPage + 1);
            }
        });
        
        if (node) observer.current.observe(node);
    }, [loading, hasMore]);

    // --- FETCH POSTS ---
    const fetchPosts = async () => {
        setLoading(true);
        try {
            // Pass page parameter
            const res = await api.get(`/discussions?page=${page}`);
            const newPosts = res.data;
            
            setPosts(prev => {
                // Prevent duplicates if ranking shifts
                const existingIds = new Set(prev.map(p => p._id));
                const uniqueNew = newPosts.filter(p => !existingIds.has(p._id));
                return [...prev, ...uniqueNew];
            });

            // If we get fewer than expected (e.g. 10), no more posts
            if (newPosts.length < 10) setHasMore(false);
        } catch (err) {
            console.error("Failed to fetch posts", err);
        } finally {
            setLoading(false);
        }
    };

    // Effect for page changes
    useEffect(() => {
        if (!authLoading) {
            fetchPosts();
        }
    }, [page, authLoading]);

    // Refetch handler for new posts (reset list)
    const handlePostCreated = () => {
        setPage(1);
        setPosts([]);
        setHasMore(true);
        fetchPosts(); // Will run due to page reset or explicit call
    };

    // --- HANDLERS ---
    const handleStartPost = () => { setModalMediaType(null); setIsPostModalOpen(true); };
    const handlePhotoClick = () => { setModalMediaType('photo'); setIsPostModalOpen(true); };
    const handleVideoClick = () => { setModalMediaType('video'); setIsPostModalOpen(true); };
    const handleWriteArticle = () => { router.push('/discuss/create'); };

    if (authLoading) {
        return <div className="min-h-screen bg-[#F3F2EF] flex items-center justify-center"><Spinner /></div>;
    }

    return (
        <div className="min-h-screen bg-[#F3F2EF] pt-6 pb-10 font-sans">
            <div className="max-w-[1128px] mx-auto px-0 sm:px-4 lg:px-6">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                    
                    {/* LEFT SIDEBAR */}
                    <div className="hidden lg:block lg:col-span-3 space-y-2">
                        <IdentityCard user={user} />
                    </div>

                    {/* CENTER FEED */}
                    <main className="lg:col-span-6 space-y-2">
                        
                        {/* --- CREATE POST WIDGET --- */}
                        <div className="bg-white rounded-lg shadow-sm border border-gray-300 px-4 pt-3 pb-1">
                            <div className="flex gap-3 mb-1">
                                <Link href="/profile">
                                    <Avatar className="h-12 w-12 cursor-pointer border border-gray-100">
                                        <AvatarImage src={user?.avatar} />
                                        <AvatarFallback>{user?.name?.[0]}</AvatarFallback>
                                    </Avatar>
                                </Link>
                                <button 
                                    onClick={handleStartPost}
                                    className="flex-grow h-12 rounded-[35px] border border-gray-400 bg-white hover:bg-gray-100 text-left px-5 text-sm font-semibold text-gray-500 transition-colors"
                                >
                                    Start a post
                                </button>
                            </div>
                            
                            <div className="flex justify-between items-center -mx-2">
                                <InputOption Icon={FaImage} title="Photo" color="#378FE9" onClick={handlePhotoClick} />
                                <InputOption Icon={FaVideo} title="Video" color="#5F9B41" onClick={handleVideoClick} />
                                <InputOption Icon={FaNewspaper} title="Write article" color="#E06847" onClick={handleWriteArticle} />
                            </div>
                        </div>

                        {/* Divider */}
                        <div className="flex items-center justify-between px-1 my-2">
                            <div className="h-[1px] bg-gray-300 flex-grow mr-2"></div>
                            <span className="text-xs text-gray-500">Sort by: <span className="font-bold text-gray-900 cursor-pointer">Top</span></span>
                        </div>

                        {/* Posts List */}
                        <div className="space-y-2 pb-10">
                            {posts.map((post, index) => {
                                if (posts.length === index + 1) {
                                    return (
                                        <div ref={lastPostElementRef} key={post._id}>
                                            <DiscussionCard post={post} currentUser={user} />
                                        </div>
                                    );
                                } else {
                                    return <DiscussionCard key={post._id} post={post} currentUser={user} />;
                                }
                            })}
                        </div>

                        {loading && (
                            <div className="py-4 flex justify-center">
                                <Spinner size="md" />
                            </div>
                        )}

                        {!hasMore && posts.length > 0 && (
                            <div className="text-center text-gray-400 py-4 text-sm font-medium">
                                You're all caught up! 🎉
                            </div>
                        )}
                    </main>

                    {/* RIGHT SIDEBAR */}
                    <div className="hidden lg:block lg:col-span-3 space-y-2">
                        <NewsWidget />
                    </div>
                </div>
            </div>

            {/* Modal */}
            <CreatePostModal 
                isOpen={isPostModalOpen} 
                onClose={() => setIsPostModalOpen(false)} 
                user={user}
                initialMediaType={modalMediaType} 
                onPostCreated={handlePostCreated}
            />
        </div>
    );
};

const InputOption = ({ Icon, title, color, onClick }) => (
    <div onClick={onClick} className="flex items-center justify-center gap-3 p-3 flex-1 hover:bg-gray-100 rounded-md cursor-pointer transition-colors">
        <Icon style={{ color: color }} className="text-xl" />
        <h4 className="text-sm font-semibold text-gray-500">{title}</h4>
    </div>
);

export default DiscussPage;