import React, { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Link from 'next/link';
import api from '@/services/api';
import useAuth from '@/hooks/useAuth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import Spinner from '@/components/Spinner';
import {
    Heart, MessageSquare, Share2, ArrowLeft, Send, MoreHorizontal, Trash, Edit2, Globe, Eye, Info
} from 'lucide-react';
import dynamic from 'next/dynamic';
import { formatDistanceToNow } from 'date-fns';
import 'react-quill/dist/quill.bubble.css';
import 'react-quill/dist/quill.snow.css';
import { cn, getAvatarUrl } from '@/lib/utils'; // IMPORT SHARED UTILS
import toast from 'react-hot-toast';

// Dynamic import for ReactQuill (only for post editing now)
const ReactQuill = dynamic(() => import('react-quill'), {
  ssr: false,
  loading: () => <div className="min-h-[100px] bg-gray-50 animate-pulse rounded-lg"></div>
});

// --- REMOVED LOCAL getAvatarUrl FUNCTION ---

// 1. SSR Data Fetching
export async function getServerSideProps(context) {
    const { id } = context.params;
    let initialThread = null;
    try {
        // Ensure internal API calls use the full container/localhost URL if needed in production environments
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
        const res = await fetch(`${baseUrl}/discussions/${id}`);
        if (res.ok) initialThread = await res.json();
    } catch (err) { console.error("SSR Error:", err); }

    if (!initialThread) return { notFound: true };
    return { props: { initialThread } };
}

const ThreadDetailPage = ({ initialThread }) => {
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();

  const [thread, setThread] = useState(initialThread);
  const [trendingPosts, setTrendingPosts] = useState([]);
  
  // Comment State
  const [commentContent, setCommentContent] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  
  // UI State
  const [isEditingPost, setIsEditingPost] = useState(false);
  const [editPostContent, setEditPostContent] = useState(initialThread?.content || '');

  // --- Fetch Trending Posts (CodeFlow posts only, sorted by views) ---
  useEffect(() => {
      const fetchTrending = async () => {
          try {
              const res = await api.get('/discussions');
              // Sort by views descending and take top 5
              const sorted = res.data.sort((a, b) => (b.views || 0) - (a.views || 0)).slice(0, 5);
              setTrendingPosts(sorted);
          } catch(e) { console.error("Trending fetch error"); }
      };
      fetchTrending();
  }, []);

  const handleLike = async () => {
    if (!isAuthenticated) return toast.error("Please login");
    try {
      const { data } = await api.put(`/discussions/${thread._id}/like`);
      setThread(prev => ({ ...prev, likes: data }));
    } catch (error) { toast.error("Failed to like"); }
  };

  const handleCommentSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!isAuthenticated) return router.push('/login');
    if (!commentContent.trim()) return toast.error("Comment cannot be empty");

    setSubmittingComment(true);
    try {
      // Send simple text content. Backend should handle basic sanitization if needed.
      const { data } = await api.post(`/discussions/${thread._id}/comment`, { content: commentContent });
      setThread(data);
      setCommentContent('');
      toast.success("Posted");
    } catch (error) { toast.error("Failed"); }
    finally { setSubmittingComment(false); }
  };

  const handleUpdatePost = async () => {
    try {
      const { data } = await api.put(`/discussions/${thread._id}`, { content: editPostContent });
      setThread(data);
      setIsEditingPost(false);
      toast.success("Post updated");
    } catch (error) { toast.error("Failed to update"); }
  };

  const handleDeletePost = async () => {
    if (!confirm("Delete this post?")) return;
    try {
      await api.delete(`/discussions/${thread._id}`);
      router.push('/discuss');
    } catch (e) { toast.error("Failed"); }
  };

  const mainAuthorAvatar = getAvatarUrl(thread.author?.avatar);
  const isLiked = thread.likes?.includes(user?._id);
  const isOwner = user?._id === thread.author?._id;

  return (
    <>
      <Head>
        <title>{thread.title} | CodeFlow</title>
        <meta property="og:title" content={thread.title} />
        <meta property="og:image" content={mainAuthorAvatar} />
      </Head>

      <div className="min-h-screen bg-[#F3F2EF] pt-6 pb-20 font-sans">
        <div className="max-w-[1128px] mx-auto px-4">
          
          <button onClick={() => router.push('/discuss')} className="mb-4 flex items-center text-sm font-semibold text-gray-600 hover:text-gray-900 transition-colors">
             <ArrowLeft className="h-4 w-4 mr-1" /> Back to Feed
          </button>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* --- MAIN COLUMN (Post) --- */}
            <main className="lg:col-span-8">
              
              {/* Post Card */}
              <div className="bg-white rounded-xl border border-gray-300 shadow-sm overflow-hidden mb-4">
                
                {/* Header */}
                <div className="p-4 flex gap-3 relative">
                    <Link href={`/profile/${thread.author?._id}`}>
                        <Avatar className="h-12 w-12 border border-gray-100 cursor-pointer">
                            <AvatarImage src={mainAuthorAvatar} />
                            <AvatarFallback>{thread.author?.name?.[0]}</AvatarFallback>
                        </Avatar>
                    </Link>
                    <div className="flex-grow">
                        <Link href={`/profile/${thread.author?._id}`} className="font-bold text-gray-900 hover:text-[#0a66c2] hover:underline text-sm leading-tight block">
                            {thread.author?.name}
                        </Link>
                        <p className="text-xs text-gray-500 line-clamp-1">{thread.author?.bio || "CodeFlow Member"}</p>
                        <div className="flex items-center text-xs text-gray-500 mt-0.5">
                            <span>{formatDistanceToNow(new Date(thread.createdAt), { addSuffix: true })}</span>
                            <span className="mx-1">•</span>
                            <Globe className="h-3 w-3 mr-1" />
                            <span className="flex items-center ml-1"><Eye className="h-3 w-3 mr-1" /> {thread.views || 0} views</span>
                        </div>
                    </div>

                    {isOwner && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button className="text-gray-500 hover:bg-gray-100 p-1 rounded-full"><MoreHorizontal size={20}/></button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-white">
                                <DropdownMenuItem onClick={() => setIsEditingPost(true)}>Edit Post</DropdownMenuItem>
                                <DropdownMenuItem onClick={handleDeletePost} className="text-red-600">Delete Post</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}
                </div>

                {/* Content */}
                <div className="px-4 py-2">
                     <h1 className="text-lg font-bold text-gray-900 mb-3 leading-snug">{thread.title}</h1>
                     
                     {isEditingPost ? (
                        <div className="space-y-4">
                            <ReactQuill theme="snow" value={editPostContent} onChange={setEditPostContent} className="bg-white" />
                            <div className="flex gap-2 justify-end">
                                <Button variant="outline" onClick={() => setIsEditingPost(false)}>Cancel</Button>
                                <Button onClick={handleUpdatePost} className="bg-[#0a66c2] text-white">Save</Button>
                            </div>
                        </div>
                     ) : (
                        <div 
                            className="text-sm text-gray-900 break-words prose-a:text-[#0a66c2] prose-a:font-semibold prose-a:no-underline hover:prose-a:underline"
                            dangerouslySetInnerHTML={{ __html: thread.content }} 
                        />
                     )}
                </div>

                {/* Stats Footer */}
                <div className="px-4 py-2 flex items-center justify-between border-b border-gray-100 mt-2">
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                        {thread.likes?.length > 0 && (
                            <>
                                <img src="https://static.licdn.com/aero-v1/sc/h/8ekq8gho1ruafha9bawy8zzli" alt="Like" className="w-4 h-4" />
                                <span className="hover:text-[#0a66c2] hover:underline cursor-pointer ml-1">{thread.likes.length}</span>
                            </>
                        )}
                    </div>
                    <div className="text-xs text-gray-500 hover:text-[#0a66c2] hover:underline cursor-pointer">
                        {thread.comments?.length || 0} comments
                    </div>
                </div>

                {/* Actions */}
                <div className="px-2 py-1 flex items-center justify-between">
                    <Button variant="ghost" onClick={handleLike} className={cn("flex-1 text-gray-500 font-semibold gap-2 hover:bg-gray-100", isLiked && "text-[#0a66c2]")}>
                        <Heart className={cn("h-5 w-5", isLiked && "fill-current")} /> Like
                    </Button>
                    <Button variant="ghost" className="flex-1 text-gray-500 font-semibold gap-2 hover:bg-gray-100">
                        <MessageSquare className="h-5 w-5" /> Comment
                    </Button>
                    <Button variant="ghost" className="flex-1 text-gray-500 font-semibold gap-2 hover:bg-gray-100">
                        <Share2 className="h-5 w-5" /> Repost
                    </Button>
                    <Button variant="ghost" className="flex-1 text-gray-500 font-semibold gap-2 hover:bg-gray-100">
                        <Send className="h-5 w-5" /> Send
                    </Button>
                </div>
              </div>

              {/* --- COMMENTS SECTION --- */}
              <div className="bg-white rounded-xl border border-gray-300 shadow-sm p-4">
                  <h3 className="text-sm font-bold text-gray-900 mb-4">Comments</h3>
                  
                  {/* NEW: Simple Inline Comment Input Design */}
                  <div className="flex gap-3 mb-6 items-center">
                      <Avatar className="h-10 w-10">
                          <AvatarImage src={getAvatarUrl(user?.avatar)} />
                          <AvatarFallback>{user?.name?.[0]}</AvatarFallback>
                      </Avatar>
                      {/* Simple, rounded input field container */}
                      <form onSubmit={handleCommentSubmit} className="flex-grow border border-gray-300 rounded-full px-4 py-2 bg-white flex items-center focus-within:border-gray-500 focus-within:ring-1 focus-within:ring-gray-400 transition-all">
                          <input
                              type="text"
                              value={commentContent}
                              onChange={(e) => setCommentContent(e.target.value)}
                              placeholder="Add a comment..."
                              className="flex-grow outline-none text-sm bg-transparent text-gray-900 placeholder:text-gray-500"
                          />
                          {commentContent.trim() && (
                              <Button
                                  type="submit"
                                  size="sm"
                                  disabled={submittingComment}
                                  className="bg-[#0a66c2] hover:bg-[#004182] text-white rounded-full font-semibold h-8 px-4 ml-2"
                              >
                                  {submittingComment ? "..." : "Post"}
                              </Button>
                          )}
                      </form>
                  </div>

                  {/* List Comments */}
                  <div className="space-y-5">
                      {thread.comments?.map(comment => (
                          <div key={comment._id} className="flex gap-2">
                              <Link href={`/profile/${comment.author?._id}`}>
                                  <Avatar className="h-10 w-10 cursor-pointer">
                                      <AvatarImage src={getAvatarUrl(comment.author?.avatar)} />
                                      <AvatarFallback>{comment.author?.name?.[0]}</AvatarFallback>
                                  </Avatar>
                              </Link>
                              
                              <div className="flex-grow">
                                  <div className="bg-[#F2F2F2] rounded-tr-2xl rounded-bl-2xl rounded-br-2xl p-3 inline-block min-w-[200px]">
                                      <div className="flex justify-between items-start">
                                          <div>
                                              <Link href={`/profile/${comment.author?._id}`} className="text-sm font-bold text-gray-900 hover:underline hover:text-[#0a66c2]">
                                                  {comment.author?.name}
                                              </Link>
                                              <p className="text-xs text-gray-500 line-clamp-1">{comment.author?.bio || "Member"}</p>
                                          </div>
                                          <span className="text-xs text-gray-400 ml-2">
                                              {formatDistanceToNow(new Date(comment.createdAt))}
                                          </span>
                                      </div>
                                      {/* Render comment content safely */}
                                      <div 
                                          className="text-sm text-gray-900 mt-1 prose-a:text-[#0a66c2] prose-a:font-semibold"
                                          dangerouslySetInnerHTML={{ __html: comment.content }} 
                                      />
                                  </div>
                                  
                                  <div className="flex gap-3 mt-1 ml-2 text-xs text-gray-500 font-semibold">
                                      <button className="hover:bg-gray-100 px-1 rounded">Like</button>
                                      <button className="hover:bg-gray-100 px-1 rounded">Reply</button>
                                  </div>
                              </div>
                          </div>
                      ))}
                  </div>
              </div>

            </main>

            {/* --- RIGHT SIDEBAR (Trending) --- */}
            <aside className="hidden lg:block lg:col-span-4 space-y-3">
                <div className="bg-white rounded-xl border border-gray-300 shadow-sm p-4 sticky top-24">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-gray-900 text-sm">Trending on CodeFlow</h3>
                        <Info className="h-3 w-3 text-gray-500" />
                    </div>
                    
                    {trendingPosts.length > 0 ? (
                        <ul className="space-y-4">
                            {trendingPosts.map((post) => (
                                <li key={post._id} className="cursor-pointer group">
                                    <Link href={`/discuss/${post._id}`}>
                                        <div className="flex items-start gap-2">
                                            <span className="text-gray-400 mt-1.5 text-[6px] flex-shrink-0">●</span>
                                            <div>
                                                <h4 className="text-sm font-semibold text-gray-700 group-hover:text-[#0a66c2] group-hover:underline line-clamp-2">
                                                    {post.title}
                                                </h4>
                                                <p className="text-xs text-gray-400 mt-0.5">
                                                    {formatDistanceToNow(new Date(post.createdAt))} ago • {post.views || 0} readers
                                                </p>
                                            </div>
                                        </div>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-sm text-gray-500">No trending posts yet.</p>
                    )}
                    
                    <Button variant="ghost" className="mt-4 text-sm font-semibold text-gray-500 hover:bg-gray-100 w-fit px-2 h-8">
                        Show more <ArrowLeft className="h-3 w-3 ml-1 rotate-[-90deg]" />
                    </Button>
                </div>
            </aside>

          </div>
        </div>
        
        <style jsx global>{`
            .ql-editor { font-size: 14px; min-height: 40px; color: #1f2937; }
            .ql-container.ql-snow { border: none !important; }
            .ql-toolbar.ql-snow { border: none !important; border-bottom: 1px solid #eee !important; background: white; }
            .prose-a { color: #0a66c2 !important; text-decoration: none; }
            .prose-a:hover { text-decoration: underline; }
        `}</style>
      </div>
    </>
  );
};

export default ThreadDetailPage;