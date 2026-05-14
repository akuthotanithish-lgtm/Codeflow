import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ThumbsUp, MessageSquare, Share2, Send, MoreHorizontal, Bookmark, Copy, X, Trash, Image as ImageIcon, Smile, Loader2, Link as LinkIcon } from 'lucide-react';
import api from '@/services/api';
import toast from 'react-hot-toast';
import { FaGlobeAmericas } from 'react-icons/fa';
import { getAvatarUrl } from '@/lib/utils';
import useAuth from '@/hooks/useAuth';
import EmojiPicker from 'emoji-picker-react';

const REACTIONS = [
    { id: 'like', icon: '👍', name: 'Like', color: 'text-blue-600' },
    { id: 'celebrate', icon: '👏', name: 'Celebrate', color: 'text-green-600' },
    { id: 'support', icon: '🤝', name: 'Support', color: 'text-purple-600' },
    { id: 'love', icon: '❤️', name: 'Love', color: 'text-red-600' },
    { id: 'insightful', icon: '💡', name: 'Insightful', color: 'text-amber-500' },
    { id: 'funny', icon: '😂', name: 'Funny', color: 'text-cyan-600' }
];

// --- LINKEDIN STYLE STACKED REACTION COUNTER ---
const ReactionStack = ({ likes }) => {
    if (!likes || likes.length === 0) return null;
    
    // Count how many times each reaction was used
    const typeCounts = likes.reduce((acc, like) => {
        const type = typeof like === 'string' ? 'like' : (like.type || 'like');
        acc[type] = (acc[type] || 0) + 1;
        return acc;
    }, {});

    // Sort to show the most popular reactions first (Max 3 icons)
    const sortedTypes = Object.keys(typeCounts).sort((a, b) => typeCounts[b] - typeCounts[a]).slice(0, 3);
    
    return (
        <div className="flex items-center gap-1 ml-2 text-gray-500 hover:text-blue-600 font-normal cursor-pointer hover:underline transition-all">
            <div className="flex -space-x-1">
                {sortedTypes.map((type, i) => {
                    const reaction = REACTIONS.find(r => r.id === type) || REACTIONS[0];
                    return (
                        <span 
                            key={type} 
                            className="bg-white rounded-full w-[16px] h-[16px] flex items-center justify-center text-[9px] ring-1 ring-white shadow-sm border border-gray-100 emoji-font relative" 
                            style={{ zIndex: 3 - i }}
                        >
                            {reaction.icon}
                        </span>
                    );
                })}
            </div>
            <span className="text-[11px] leading-none">{likes.length}</span>
        </div>
    );
};


const DiscussionCard = ({ post, currentUser: propUser }) => {
    const { user: authUser, refreshUser } = useAuth();
    const currentUser = authUser || propUser; 

    const [likes, setLikes] = useState(post.likes || []);
    const [likesModalOpen, setLikesModalOpen] = useState(false);
    
    const [isLiked, setIsLiked] = useState(likes.some(like => (like._id || like) === currentUser?._id));
    const [activeReaction, setActiveReaction] = useState(isLiked ? REACTIONS[0] : null);
    
    const [comments, setComments] = useState(post.comments || []);
    const [showComments, setShowComments] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);
    const [isOverflowing, setIsOverflowing] = useState(false);
    const contentRef = useRef(null);

    const isSaved = currentUser?.savedPosts?.some(id => id.toString() === post._id.toString()) || false;

    useEffect(() => {
        if (contentRef.current) setIsOverflowing(contentRef.current.scrollHeight > 100);
    }, [post.content]);

    useEffect(() => {
        if(post.comments) setComments(post.comments);
        if(post.likes) setLikes(post.likes);
    }, [post]);

    const handleReaction = async (reaction = REACTIONS[0]) => {
        if(!currentUser) return toast.error("Please login");
        
        const currentlyLiked = isLiked;
        setIsLiked(!currentlyLiked);
        setActiveReaction(!currentlyLiked ? reaction : null);
        
        if (!currentlyLiked) {
            setLikes(prev => [...prev, { _id: currentUser._id, name: currentUser.name, avatar: currentUser.avatar, bio: currentUser.bio }]);
        } else {
            setLikes(prev => prev.filter(like => (like._id || like) !== currentUser._id));
        }

        try {
            const res = await api.put(`/discussions/${post._id}/like`);
            setLikes(res.data); 
        } catch (error) {
            toast.error("Failed to react");
            setIsLiked(currentlyLiked); 
        }
    };

    const renderLikesText = () => {
        if (!likes || likes.length === 0) return null;

        const myConnIds = new Set(
            currentUser?.connections?.filter(c => c.status === 'connected')
            .map(c => typeof c.user === 'object' ? c.user._id : c.user) || []
        );

        const friendLikes = likes.filter(like => typeof like === 'object' && myConnIds.has(like._id));

        if (friendLikes.length > 0) {
            const names = friendLikes.slice(0, 3).map(u => u.name); 
            const remaining = likes.length - names.length;
            
            return (
                <span className="text-xs text-gray-500 hover:text-blue-600 hover:underline cursor-pointer flex-grow text-left leading-tight" onClick={() => setLikesModalOpen(true)}>
                    {names.map((name, i) => (
                        <span key={i}>
                            <span className="font-semibold text-gray-700 hover:text-blue-600">{name}</span>
                            {i < names.length - 1 && i !== names.length - 2 ? ", " : ""}
                            {i === names.length - 2 && remaining === 0 ? " and " : ""}
                            {i === names.length - 2 && remaining > 0 ? ", " : ""}
                        </span>
                    ))}
                    {remaining > 0 && <span> and {remaining} other{remaining !== 1 ? 's' : ''}</span>}
                </span>
            );
        }

        return (
            <span className="text-xs text-gray-500 hover:text-blue-600 hover:underline cursor-pointer" onClick={() => setLikesModalOpen(true)}>
                {likes.length} reaction{likes.length !== 1 ? 's' : ''}
            </span>
        );
    };

    const handleSavePost = async () => {
        if(!currentUser) return toast.error("Please login");
        try {
            await api.post(`/discussions/${post._id}/save`);
            await refreshUser(); 
            toast.success(isSaved ? "Post removed from saved" : "Post saved");
        } catch (error) { toast.error("Failed to save"); }
    };

    const handleDeletePost = async () => {
        if(!confirm("Are you sure you want to delete this post?")) return;
        try {
            await api.delete(`/discussions/${post._id}`);
            window.location.reload(); 
        } catch (error) { toast.error("Failed to delete"); }
    };

    const authorAvatarUrl = getAvatarUrl(post.author?.avatar);
    const isOwner = currentUser?._id === post.author?._id;

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-300 mb-2">
            <div className="p-3 pb-1 flex gap-3 relative">
                <Link href={`/profile/${post.author?._id}`}>
                    <Avatar className="h-12 w-12 cursor-pointer border border-gray-100">
                        <AvatarImage src={authorAvatarUrl} />
                        <AvatarFallback>{post.author?.name?.[0]}</AvatarFallback>
                    </Avatar>
                </Link>

                <div className="flex flex-col justify-center flex-grow">
                    <Link href={`/profile/${post.author?._id}`}>
                        <h3 className="text-sm font-bold text-gray-900 hover:text-[#0a66c2] hover:underline cursor-pointer leading-tight">
                            {post.author?.name || "Unknown User"}
                        </h3>
                    </Link>
                    <p className="text-xs text-gray-500 line-clamp-1 leading-tight mt-0.5">
                        {post.author?.bio || "CodeFlow Member"}
                    </p>
                    <div className="flex items-center gap-1 text-xs text-gray-400 mt-0.5">
                        <span>{formatDistanceToNow(new Date(post.createdAt))} ago</span>
                        <span>•</span>
                        <FaGlobeAmericas className="text-gray-500 text-[10px]" />
                    </div>
                </div>

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button className="absolute top-3 right-3 text-gray-500 hover:bg-gray-100 p-1 rounded-full transition-colors outline-none">
                            <MoreHorizontal size={20} />
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48 bg-white z-50 border-gray-200 shadow-lg">
                        <DropdownMenuItem onClick={handleSavePost} className="cursor-pointer gap-2 py-2.5 text-gray-700">
                            <Bookmark size={16} className={isSaved ? "fill-black text-black" : ""} /> 
                            {isSaved ? "Unsave post" : "Save post"}
                        </DropdownMenuItem>
                        {isOwner && (
                            <DropdownMenuItem onClick={handleDeletePost} className="cursor-pointer gap-2 py-2.5 text-red-600">
                                <Trash size={16} /> Delete post
                            </DropdownMenuItem>
                        )}
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            <div className="px-4 py-2 text-sm text-gray-900 break-words">
                <div ref={contentRef} className={`relative overflow-hidden transition-all duration-300 ${!isExpanded ? 'max-h-[500px]' : ''}`}>
                    <div className="post-content" dangerouslySetInnerHTML={{ __html: post.content }} />
                </div>
                {isOverflowing && !isExpanded && (
                    <button onClick={() => setIsExpanded(true)} className="text-gray-500 hover:text-[#0a66c2] hover:underline text-xs font-semibold mt-1 float-right">
                        ...see more
                    </button>
                )}
            </div>

            <div className="px-4 py-2 flex justify-between items-center text-xs text-gray-500 border-b border-gray-100 mx-0 mt-1">
                <div className="flex items-center gap-1.5 flex-grow">
                    {likes.length > 0 && (
                        <>
                            <ReactionStack likes={likes} />
                            {renderLikesText()}
                        </>
                    )}
                </div>
                <div onClick={() => setShowComments(!showComments)} className="hover:text-[#0a66c2] hover:underline cursor-pointer flex-shrink-0">
                    {comments.length} comments
                </div>
            </div>

            <div className="px-2 py-1 flex justify-between items-center relative">
                <div className="relative group/reaction flex-1">
                    <div className="absolute bottom-full left-0 mb-1 bg-white border border-gray-200 shadow-[0_4px_12px_rgba(0,0,0,0.15)] rounded-full px-2 py-1 flex gap-2 opacity-0 invisible group-hover/reaction:opacity-100 group-hover/reaction:visible transition-all duration-300 z-50 transform translate-y-2 group-hover/reaction:translate-y-0">
                        {REACTIONS.map((reaction) => (
                            <button 
                                key={reaction.id}
                                onClick={() => handleReaction(reaction)}
                                className="w-10 h-10 flex flex-col items-center justify-center hover:bg-gray-100 rounded-full transition-transform hover:scale-125 transform origin-bottom"
                                title={reaction.name}
                            >
                                <span className="text-xl emoji-font">{reaction.icon}</span>
                            </button>
                        ))}
                    </div>

                    <button 
                        onClick={() => handleReaction(REACTIONS[0])} 
                        className={`w-full flex items-center justify-center gap-2 py-3 rounded-md hover:bg-gray-100 transition-colors ${activeReaction ? activeReaction.color : 'text-gray-500'}`}
                    >
                        {activeReaction ? (
                            <span className="text-lg emoji-font">{activeReaction.icon}</span>
                        ) : (
                            <ThumbsUp size={18} className="group-hover:text-gray-600" />
                        )}
                        <span className="text-sm font-semibold">{activeReaction ? activeReaction.name : 'Like'}</span>
                    </button>
                </div>

                <ActionButton Icon={MessageSquare} text="Comment" onClick={() => setShowComments(!showComments)} />
                <ActionButton Icon={Share2} text="Repost" />
                <ActionButton Icon={Send} text="Send" />
            </div>

            {showComments && (
                <div className="bg-gray-50/50 p-4 border-t border-gray-100 animate-in slide-in-from-top-2 duration-200">
                    {currentUser && (
                        <CommentInput postId={post._id} currentUser={currentUser} onCommentAdded={(c) => setComments(prev => [...prev, c])} />
                    )}

                    <div className="mt-4 space-y-4">
                        {comments.map((comment, idx) => (
                            <CommentItem 
                                key={comment._id || idx} 
                                comment={comment} 
                                postId={post._id} 
                                currentUser={currentUser} 
                            />
                        ))}
                    </div>
                </div>
            )}

            <Dialog open={likesModalOpen} onOpenChange={setLikesModalOpen}>
                <DialogContent className="sm:max-w-[400px] bg-white p-0 overflow-hidden border-none shadow-2xl">
                    <DialogHeader className="px-6 py-4 border-b border-gray-100">
                        <DialogTitle className="text-lg font-bold text-gray-900">Reactions</DialogTitle>
                    </DialogHeader>
                    <div className="max-h-[400px] overflow-y-auto p-2 custom-scrollbar">
                        {likes.map((likeUser, idx) => {
                            if (typeof likeUser !== 'object') return null; 
                            return (
                                <Link href={`/profile/${likeUser._id}`} key={idx} onClick={() => setLikesModalOpen(false)}>
                                    <div className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-xl transition-colors cursor-pointer">
                                        <Avatar className="h-10 w-10 border border-gray-100">
                                            <AvatarImage src={getAvatarUrl(likeUser.avatar)} />
                                            <AvatarFallback>{likeUser.name?.[0]}</AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <h4 className="font-bold text-sm text-gray-900 hover:text-blue-600 hover:underline">{likeUser.name}</h4>
                                            <p className="text-xs text-gray-500 line-clamp-1">{likeUser.bio || "CodeFlow Member"}</p>
                                        </div>
                                    </div>
                                </Link>
                            )
                        })}
                    </div>
                </DialogContent>
            </Dialog>

            <style jsx global>{`
                .emoji-font { font-family: "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji" !important; }
                .post-content a { color: #0a66c2 !important; text-decoration: none; font-weight: 600; }
                .post-content a:hover { text-decoration: underline; }
                .post-content { line-height: 1.4; word-wrap: break-word; }
                .post-content img { max-width: 100%; height: auto; border-radius: 8px; margin-top: 8px; max-height: 250px; object-fit: contain; }
                .post-content, .comment-input-area { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji" !important; color: #111827 !important; }
            `}</style>
        </div>
    );
};

const ActionButton = ({ Icon, text, onClick }) => (
    <button onClick={onClick} className="flex-1 flex items-center justify-center gap-2 py-3 rounded-md hover:bg-gray-100 transition-colors text-gray-500 group">
        <Icon size={18} className="group-hover:text-gray-600" />
        <span className="text-sm font-semibold group-hover:text-gray-600">{text}</span>
    </button>
);


// --- NEW: NESTED REPLY COMPONENT (Handles its own likes and hover bars) ---
const NestedReplyItem = ({ reply, postId, parentCommentId, currentUser, onReplyClick }) => {
    const [likes, setLikes] = useState(reply.likes || []);
    
    const userLike = likes.find(like => (like.user?._id || like._id || like) === currentUser?._id);
    const isLiked = !!userLike;
    
    const [activeReaction, setActiveReaction] = useState(
        userLike?.type ? REACTIONS.find(r => r.id === userLike.type) : (isLiked ? REACTIONS[0] : null)
    );

    const repAuthor = typeof reply.author === 'object' ? reply.author : null;

    const handleReaction = async (reaction = REACTIONS[0]) => {
        if (!currentUser) return toast.error("Please login");
        
        const currentlyLiked = isLiked;
        const previousReaction = activeReaction;
        const previousLikes = [...likes];
        
        const isRemoving = currentlyLiked && activeReaction?.id === reaction.id;
        setActiveReaction(isRemoving ? null : reaction);
        
        if (!currentlyLiked) {
            setLikes(prev => [...prev, { _id: currentUser._id, type: reaction.id }]);
        } else if (isRemoving) {
            setLikes(prev => prev.filter(like => (like.user?._id || like._id || like) !== currentUser._id));
        } else {
            setLikes(prev => prev.map(like => 
                (like.user?._id || like._id || like) === currentUser._id ? { ...like, type: reaction.id } : like
            ));
        }

        try {
            // Note: Make sure this route exists in your backend to like a nested reply!
            const res = await api.put(`/discussions/${postId}/comments/${parentCommentId}/replies/${reply._id}/like`, { type: reaction.id });
            if(res.data && res.data.likes) setLikes(res.data.likes);
            else setLikes(res.data);
        } catch (error) {
            toast.error("Failed to react. Check backend route.");
            setLikes(previousLikes);
            setActiveReaction(previousReaction);
        }
    };

    return (
        <div className="flex gap-2 mt-2 group">
            <Link href={`/profile/${repAuthor?._id || '#'}`}>
                <Avatar className="h-6 w-6 mt-1 border border-gray-200 bg-white cursor-pointer">
                    <AvatarImage src={getAvatarUrl(repAuthor?.avatar)} />
                    <AvatarFallback>{repAuthor?.name?.[0]}</AvatarFallback>
                </Avatar>
            </Link>
            <div className="flex-grow">
                <div className="bg-gray-100 rounded-b-xl rounded-tr-xl p-2.5 inline-block w-full max-w-[calc(100%-2rem)]">
                    <div className="flex justify-between items-start">
                        <div>
                            <Link href={`/profile/${repAuthor?._id || '#'}`}>
                                <h4 className="text-xs font-bold text-gray-900 cursor-pointer hover:underline hover:text-[#0a66c2]">{repAuthor?.name || "Unknown"}</h4>
                            </Link>
                        </div>
                        <span className="text-[10px] text-gray-400 ml-2 whitespace-nowrap">{formatDistanceToNow(new Date(reply.createdAt || Date.now()))}</span>
                    </div>
                    <div className="text-xs text-gray-800 mt-0.5 post-content" dangerouslySetInnerHTML={{ __html: reply.content }} />
                </div>

                {/* Nested Reply Action Bar */}
                <div className="flex items-center gap-2 mt-0.5 ml-2 text-[11px] font-semibold text-gray-500 relative">
                    <div className="relative group/reply-reaction flex items-center">
                        <div className="absolute bottom-full left-0 mb-1 bg-white border border-gray-200 shadow-[0_4px_12px_rgba(0,0,0,0.15)] rounded-full px-1.5 py-1 flex gap-1 opacity-0 invisible group-hover/reply-reaction:opacity-100 group-hover/reply-reaction:visible transition-all duration-200 z-50">
                            {REACTIONS.map((reaction) => (
                                <button
                                    key={reaction.id}
                                    onClick={() => handleReaction(reaction)}
                                    className="w-6 h-6 flex items-center justify-center hover:bg-gray-100 rounded-full transition-transform hover:scale-125 transform origin-bottom"
                                    title={reaction.name}
                                >
                                    <span className="text-sm emoji-font">{reaction.icon}</span>
                                </button>
                            ))}
                        </div>

                        <button 
                            onClick={() => handleReaction(activeReaction || REACTIONS[0])} 
                            className={`hover:bg-gray-200 px-1.5 py-0.5 rounded transition flex items-center gap-1 ${activeReaction ? activeReaction.color : ''}`}
                        >
                            {activeReaction ? <span className="emoji-font text-[10px]">{activeReaction.icon}</span> : null}
                            <span>{activeReaction ? activeReaction.name : 'Like'}</span>
                        </button>
                    </div>

                    <span className="text-gray-300">|</span>
                    <button onClick={onReplyClick} className="hover:bg-gray-200 px-1.5 py-0.5 rounded transition">
                        Reply
                    </button>

                    <ReactionStack likes={likes} />
                </div>
            </div>
        </div>
    );
};


const CommentItem = ({ comment, postId, currentUser }) => {
    const [likes, setLikes] = useState(comment.likes || []);
    const [replies, setReplies] = useState(comment.replies || []);
    const [isReplying, setIsReplying] = useState(false);
    
    const userLike = likes.find(like => (like.user?._id || like._id || like) === currentUser?._id);
    const isLiked = !!userLike;
    
    const [activeReaction, setActiveReaction] = useState(
        userLike?.type ? REACTIONS.find(r => r.id === userLike.type) : (isLiked ? REACTIONS[0] : null)
    );

    const author = typeof comment.author === 'object' ? comment.author : null;
    const authorName = author?.name || "Unknown User";
    const authorAvatar = getAvatarUrl(author?.avatar);

    const handleReaction = async (reaction = REACTIONS[0]) => {
        if (!currentUser) return toast.error("Please login");
        
        const currentlyLiked = isLiked;
        const previousReaction = activeReaction;
        const previousLikes = [...likes];
        
        const isRemoving = currentlyLiked && activeReaction?.id === reaction.id;
        setActiveReaction(isRemoving ? null : reaction);
        
        if (!currentlyLiked) {
            setLikes(prev => [...prev, { _id: currentUser._id, type: reaction.id }]);
        } else if (isRemoving) {
            setLikes(prev => prev.filter(like => (like.user?._id || like._id || like) !== currentUser._id));
        } else {
            setLikes(prev => prev.map(like => 
                (like.user?._id || like._id || like) === currentUser._id ? { ...like, type: reaction.id } : like
            ));
        }

        try {
            const res = await api.put(`/discussions/${postId}/comments/${comment._id}/like`, { type: reaction.id });
            setLikes(res.data);
        } catch (error) {
            toast.error("Failed to react to comment");
            setLikes(previousLikes);
            setActiveReaction(previousReaction);
        }
    };

    const handleReplyAdded = (newReply) => {
        setReplies(prev => [...prev, newReply]);
        setIsReplying(false); 
    };

    return (
        <div className="flex gap-2 group mt-2">
            <Link href={`/profile/${author?._id || '#'}`}>
                <Avatar className="h-8 w-8 cursor-pointer mt-1 border border-gray-200 bg-white">
                    <AvatarImage src={authorAvatar} />
                    <AvatarFallback>{authorName[0]}</AvatarFallback>
                </Avatar>
            </Link>
            
            <div className="flex-grow">
                <div className="bg-gray-100 rounded-b-xl rounded-tr-xl p-3 inline-block min-w-[200px] w-full max-w-[calc(100%-2rem)]">
                    <div className="flex justify-between items-start">
                        <div>
                            <Link href={`/profile/${author?._id || '#'}`}>
                                <h4 className="text-xs font-bold text-gray-900 hover:underline hover:text-[#0a66c2] cursor-pointer">
                                    {authorName}
                                </h4>
                            </Link>
                            <p className="text-[10px] text-gray-500 line-clamp-1">{author?.bio || "Member"}</p>
                        </div>
                        <span className="text-[10px] text-gray-400 ml-2 whitespace-nowrap">
                            {formatDistanceToNow(new Date(comment.createdAt || Date.now()))}
                        </span>
                    </div>
                    <div className="text-sm text-gray-800 mt-1 post-content" dangerouslySetInnerHTML={{ __html: comment.content }} />
                </div>

                <div className="flex items-center gap-3 mt-1 ml-2 text-xs font-semibold text-gray-500 relative">
                    
                    <div className="relative group/comment-reaction flex items-center">
                        <div className="absolute bottom-full left-0 mb-1 bg-white border border-gray-200 shadow-[0_4px_12px_rgba(0,0,0,0.15)] rounded-full px-1.5 py-1 flex gap-1 opacity-0 invisible group-hover/comment-reaction:opacity-100 group-hover/comment-reaction:visible transition-all duration-200 z-50">
                            {REACTIONS.map((reaction) => (
                                <button
                                    key={reaction.id}
                                    onClick={() => handleReaction(reaction)}
                                    className="w-7 h-7 flex items-center justify-center hover:bg-gray-100 rounded-full transition-transform hover:scale-125 transform origin-bottom"
                                    title={reaction.name}
                                >
                                    <span className="text-sm emoji-font">{reaction.icon}</span>
                                </button>
                            ))}
                        </div>

                        <button 
                            onClick={() => handleReaction(activeReaction || REACTIONS[0])} 
                            className={`hover:bg-gray-200 px-1.5 py-0.5 rounded transition flex items-center gap-1 ${activeReaction ? activeReaction.color : ''}`}
                        >
                            {activeReaction ? <span className="emoji-font text-[10px]">{activeReaction.icon}</span> : null}
                            <span>{activeReaction ? activeReaction.name : 'Like'}</span>
                        </button>
                    </div>

                    <span className="text-gray-300">|</span>
                    <button 
                        onClick={() => setIsReplying(!isReplying)} 
                        className="hover:bg-gray-200 px-1.5 py-0.5 rounded transition"
                    >
                        Reply
                    </button>

                    {/* NEW: Displays the Stacked Icons! */}
                    <ReactionStack likes={likes} />
                </div>

                {isReplying && (
                    <div className="mt-3 ml-2 border-l-2 border-gray-200 pl-3">
                        {currentUser ? (
                            <CommentInput 
                                postId={postId} 
                                currentUser={currentUser} 
                                onCommentAdded={handleReplyAdded} 
                                isReply={true}
                                commentId={comment._id} 
                            />
                        ) : (
                            <p className="text-xs text-gray-500">Please log in to reply.</p>
                        )}
                    </div>
                )}

                {/* NEW: Map through nested replies using the updated component */}
                {replies.length > 0 && (
                    <div className="mt-2 space-y-3">
                        {replies.map((reply, rIdx) => (
                            <NestedReplyItem 
                                key={reply._id || rIdx} 
                                reply={reply} 
                                postId={postId} 
                                parentCommentId={comment._id}
                                currentUser={currentUser} 
                                onReplyClick={() => setIsReplying(true)}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

const CommentInput = ({ postId, currentUser, onCommentAdded, isReply = false, commentId = null }) => {
    const [commentHtml, setCommentHtml] = useState("");
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [showLinkPrompt, setShowLinkPrompt] = useState(false);
    const [linkUrl, setLinkUrl] = useState("");
    const [loading, setLoading] = useState(false);
    const [imageUploading, setImageUploading] = useState(false);
    
    const editorRef = useRef(null);
    const fileInputRef = useRef(null);

    const onEmojiClick = (emojiObject) => {
        if (editorRef.current) {
            editorRef.current.innerHTML += emojiObject.emoji;
            setCommentHtml(editorRef.current.innerHTML);
            
            const range = document.createRange();
            const sel = window.getSelection();
            range.selectNodeContents(editorRef.current);
            range.collapse(false);
            sel.removeAllRanges();
            sel.addRange(range);
            editorRef.current.focus();
        }
    };

    const handleApplyLink = () => {
        if (!linkUrl.trim()) {
            setShowLinkPrompt(false);
            return;
        }
        
        let formattedUrl = linkUrl.trim();
        if (!/^https?:\/\//i.test(formattedUrl)) {
            formattedUrl = 'https://' + formattedUrl;
        }

        const linkHtml = `&nbsp;<a href="${formattedUrl}" target="_blank" rel="noopener noreferrer" style="color: #0a66c2; text-decoration: underline; font-weight: 600;">${formattedUrl}</a>&nbsp;`;
        
        if (editorRef.current) {
            editorRef.current.innerHTML += linkHtml;
            setCommentHtml(editorRef.current.innerHTML);
            
            const range = document.createRange();
            const sel = window.getSelection();
            range.selectNodeContents(editorRef.current);
            range.collapse(false);
            sel.removeAllRanges();
            sel.addRange(range);
            editorRef.current.focus();
        }
        setLinkUrl("");
        setShowLinkPrompt(false);
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setImageUploading(true);
        try {
            const formData = new FormData();
            formData.append('image', file);
            const res = await api.post('/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
            
            const imageUrl = `${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5000'}${res.data.url}`;
            const imageHtml = `<br/><img src="${imageUrl}" alt="Comment Image" style="max-width: 200px; border-radius: 8px; margin-top: 8px;" /><br/>`;
            
            if (editorRef.current) {
                editorRef.current.innerHTML += imageHtml;
                setCommentHtml(editorRef.current.innerHTML);
            }
        } catch (error) { toast.error("Failed to upload image"); } 
        finally { setImageUploading(false); }
    };

    const handleSubmit = async () => {
        const plainText = editorRef.current?.innerText || "";
        if (!plainText.trim() && !commentHtml.includes('<img') && !commentHtml.includes('<a')) return;

        setLoading(true);
        try {
            let res;
            if (isReply && commentId) {
                res = await api.post(`/discussions/${postId}/comments/${commentId}/reply`, { content: commentHtml });
                onCommentAdded(res.data); 
            } else {
                res = await api.post(`/discussions/${postId}/comment`, { content: commentHtml });
                let newComment = res.data.comments ? res.data.comments[res.data.comments.length - 1] : { content: commentHtml, author: currentUser, createdAt: new Date() };
                onCommentAdded(newComment);
            }
            
            setCommentHtml("");
            if (editorRef.current) editorRef.current.innerHTML = "";
            toast.success(isReply ? "Reply posted" : "Comment posted");
        } catch (error) { 
            toast.error("Failed to post"); 
        } finally { 
            setLoading(false); 
        }
    };

    return (
        <div className="flex gap-2 items-start relative">
            <Avatar className="h-8 w-8 mt-1 border border-gray-200">
                <AvatarImage src={getAvatarUrl(currentUser?.avatar)} />
                <AvatarFallback>{currentUser?.name?.[0]}</AvatarFallback>
            </Avatar>
            <div className="flex-grow relative">
                <div
                    ref={editorRef}
                    contentEditable
                    onInput={(e) => setCommentHtml(e.currentTarget.innerHTML)}
                    className="comment-input-area w-full min-h-[40px] border border-gray-300 rounded-2xl px-4 py-2 text-sm focus:outline-none focus:border-gray-500 bg-white cursor-text text-gray-900 empty:before:content-[attr(placeholder)] empty:before:text-gray-500 pb-10"
                    placeholder="Add a comment..."
                />
                
                <div className="absolute bottom-2 left-4 flex gap-2">
                    <button onClick={() => setShowEmojiPicker(!showEmojiPicker)} className="p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-800 rounded-full transition" title="Add Emoji">
                        <Smile size={18} />
                    </button>
                    
                    <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
                    <button onClick={() => fileInputRef.current?.click()} disabled={imageUploading} className="p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-800 rounded-full transition" title="Add Image">
                        {imageUploading ? <Loader2 size={18} className="animate-spin text-blue-600" /> : <ImageIcon size={18} />}
                    </button>

                    <button onClick={() => setShowLinkPrompt(!showLinkPrompt)} className="p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-800 rounded-full transition" title="Add Link">
                        <LinkIcon size={18} />
                    </button>
                </div>

                {commentHtml && (
                    <div className="absolute bottom-2 right-2">
                        <Button size="sm" onClick={handleSubmit} disabled={loading} className="bg-[#0a66c2] hover:bg-[#004182] text-white rounded-full px-4 h-7 text-xs font-semibold shadow-sm">
                            {loading ? "..." : "Post"}
                        </Button>
                    </div>
                )}

                {showLinkPrompt && (
                    <div className="absolute bottom-12 left-10 z-50 bg-white border border-gray-200 rounded-lg shadow-xl p-2 flex items-center gap-2 animate-in fade-in zoom-in-95 duration-200">
                        <LinkIcon size={16} className="text-gray-400 ml-1" />
                        <input 
                            type="text" 
                            placeholder="Paste or type a link..."
                            className="text-sm border border-gray-300 rounded px-2 py-1.5 w-48 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-gray-800"
                            value={linkUrl}
                            onChange={(e) => setLinkUrl(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleApplyLink()}
                            autoFocus
                        />
                        <Button size="sm" onClick={handleApplyLink} className="bg-[#0a66c2] hover:bg-[#004182] text-white h-8 px-4 font-semibold">
                            Apply
                        </Button>
                    </div>
                )}

                {showEmojiPicker && (
                    <div className="absolute top-12 left-0 z-50 shadow-2xl rounded-lg border border-gray-200 bg-white">
                        <div className="flex justify-between items-center p-2 border-b border-gray-100">
                            <span className="text-xs font-semibold text-gray-500 ml-2">Emojis</span>
                            <button onClick={() => setShowEmojiPicker(false)} className="text-gray-400 hover:text-red-500 p-1">
                                <X size={16}/>
                            </button>
                        </div>
                        <EmojiPicker 
                            theme="light" 
                            emojiStyle="native"
                            onEmojiClick={onEmojiClick} 
                            searchDisabled={false}       
                            skinTonesDisabled={false}    
                            previewConfig={{ showPreview: false }} 
                            width={320}
                            height={400}
                        />
                    </div>
                )}
            </div>
        </div>
    );
};

export default DiscussionCard;