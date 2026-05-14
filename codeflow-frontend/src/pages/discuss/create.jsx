import React, { useState, useRef, useMemo } from 'react';
import { useRouter } from 'next/router';
import dynamic from 'next/dynamic';
import api from '@/services/api';
import useAuth from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import Spinner from '@/components/Spinner';
import { ArrowLeft, Image as ImageIcon } from 'lucide-react';
import 'react-quill/dist/quill.bubble.css'; // Use Bubble theme for cleaner look (or keep snow but style it minimal)

// Use 'bubble' or 'snow'. LinkedIn uses a very clean inline style.
// Let's stick to 'snow' but hide the toolbar until needed or style it minimally.
const ReactQuill = dynamic(() => import('react-quill'), { ssr: false });
import 'react-quill/dist/quill.snow.css';

const CreateArticle = () => {
    const router = useRouter();
    const { isAuthenticated, user } = useAuth();
    
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [coverImage, setCoverImage] = useState(null);
    const [loading, setLoading] = useState(false);
    const fileInputRef = useRef(null);

    const handlePublish = async () => {
        if (!title.trim() || !content.trim()) return;
        setLoading(true);
        try {
            await api.post('/discussions', { 
                title, 
                content, 
                category: "Article" // Tag as article
            });
            router.push('/discuss');
        } catch (error) {
            console.error('Failed to publish:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCoverImage = (e) => {
        const file = e.target.files[0];
        if (file) {
            setCoverImage(URL.createObjectURL(file));
        }
    };

    // Minimal Toolbar configuration
    const quillModules = useMemo(() => ({
        toolbar: [
            [{ 'header': [1, 2, false] }],
            ['bold', 'italic', 'underline', 'blockquote'],
            [{ 'list': 'ordered'}, { 'list': 'bullet' }],
            ['link', 'image', 'code-block'],
        ]
    }), []);

    return (
        <div className="min-h-screen bg-white text-gray-900 font-sans">
            {/* Top Navigation Bar */}
            <nav className="border-b border-gray-200 px-4 py-3 sticky top-0 bg-white z-50 flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                         <div className="bg-[#0a66c2] text-white p-1 rounded font-bold text-xs">CF</div>
                         <span className="font-semibold text-gray-700">CodeFlow Publishing</span>
                    </div>
                    <span className="text-gray-300">|</span>
                    <span className="text-sm text-gray-500">Draft saved</span>
                </div>
                
                <div className="flex items-center gap-4">
                     <Button 
                        variant="ghost" 
                        onClick={() => router.back()}
                        className="text-gray-500 hover:text-gray-900"
                     >
                        Cancel
                    </Button>
                    <Button 
                        onClick={handlePublish} 
                        disabled={loading || !title || !content}
                        className="bg-[#0a66c2] hover:bg-[#004182] text-white font-semibold rounded-full px-6"
                    >
                        {loading ? "Publishing..." : "Publish"}
                    </Button>
                </div>
            </nav>

            {/* Main Editor Container */}
            <div className="max-w-[740px] mx-auto pt-10 pb-20 px-4">
                
                {/* Cover Image Placeholder */}
                <div 
                    onClick={() => fileInputRef.current.click()}
                    className={`
                        w-full h-[250px] bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 
                        flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors mb-8 overflow-hidden
                        ${coverImage ? 'border-none' : ''}
                    `}
                >
                    <input type="file" ref={fileInputRef} className="hidden" onChange={handleCoverImage} />
                    {coverImage ? (
                        <img src={coverImage} alt="Cover" className="w-full h-full object-cover" />
                    ) : (
                        <>
                            <ImageIcon className="text-gray-400 mb-2" size={32} />
                            <p className="text-gray-500 font-medium text-sm">Add a cover image</p>
                        </>
                    )}
                </div>

                {/* Headline Input */}
                <input 
                    type="text" 
                    placeholder="Headline" 
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full text-4xl font-bold text-gray-900 placeholder:text-gray-300 border-none outline-none focus:ring-0 px-0 mb-6 bg-transparent"
                    autoFocus
                />

                {/* Rich Text Editor */}
                <div className="linkedin-editor">
                    <ReactQuill
                        theme="snow"
                        value={content}
                        onChange={setContent}
                        modules={quillModules}
                        placeholder="Write here. Add images or a video for visual impact."
                        className="text-lg text-gray-800"
                    />
                </div>
            </div>
            
            <style jsx global>{`
                /* LinkedIn Style Editor Overrides */
                .linkedin-editor .ql-container {
                    border: none !important;
                    font-size: 18px;
                    font-family: -apple-system, system-ui, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", "Fira Sans", Ubuntu, Oxygen, "Oxygen Sans", Cantarell, "Droid Sans", "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Lucida Grande", Helvetica, Arial, sans-serif;
                }
                .linkedin-editor .ql-toolbar {
                    border: none !important;
                    border-bottom: 1px solid #eee !important;
                    position: sticky;
                    top: 60px; /* Below the main nav */
                    background: white;
                    z-index: 40;
                    margin-bottom: 20px;
                }
                .linkedin-editor .ql-editor {
                    padding: 0 !important;
                    min-height: 300px;
                    line-height: 1.75;
                }
                .linkedin-editor .ql-editor.ql-blank::before {
                    color: #bfbfbf;
                    font-style: normal;
                }
            `}</style>
        </div>
    );
};

export default CreateArticle;