import { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { 
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { 
    FaGlobeAmericas, FaUserFriends, FaImage, FaVideo, FaTimes, 
    FaCalendarAlt, FaEllipsisH, FaLink 
} from 'react-icons/fa';
import api from '@/services/api';
import toast from 'react-hot-toast';

const CreatePostModal = ({ isOpen, onClose, user, onPostCreated, initialMediaType }) => {
    const [htmlContent, setHtmlContent] = useState("");
    const [media, setMedia] = useState(null);
    const [mediaPreview, setMediaPreview] = useState(null);
    const [mediaType, setMediaType] = useState(null); 
    const [visibility, setVisibility] = useState("anyone"); 
    const [showLinkInput, setShowLinkInput] = useState(false);
    const [linkUrl, setLinkUrl] = useState("");
    const [loading, setLoading] = useState(false);
    
    const fileInputRef = useRef(null);
    const editorRef = useRef(null);

    useEffect(() => {
        if (isOpen) {
            setMediaType(null);
            setMedia(null);
            setMediaPreview(null);
            setHtmlContent("");
            setVisibility("anyone");
            if (editorRef.current) editorRef.current.innerHTML = "";

            setTimeout(() => {
                if (editorRef.current) editorRef.current.focus();
            }, 100);

            if (initialMediaType && fileInputRef.current) {
                setTimeout(() => {
                    fileInputRef.current.click();
                }, 200);
            }
        }
    }, [isOpen, initialMediaType]);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const isVideo = file.type.startsWith('video/');
            const isImage = file.type.startsWith('image/');

            if (initialMediaType === 'video' && !isVideo) return toast.error("Please select a video file.");
            if (initialMediaType === 'photo' && !isImage) return toast.error("Please select an image file.");

            setMediaType(isVideo ? 'video' : 'image');
            setMedia(file);
            setMediaPreview(URL.createObjectURL(file));
        }
    };

    const handleAddLink = () => {
        if (!linkUrl) return;
        let finalUrl = linkUrl;
        if (!/^https?:\/\//i.test(linkUrl)) finalUrl = 'http://' + linkUrl;

        const linkHTML = `&nbsp;<a href="${finalUrl}" target="_blank" style="color: #0a66c2; text-decoration: underline; font-weight: 600;">${finalUrl}</a>&nbsp;`;
        
        if (editorRef.current) {
            editorRef.current.innerHTML += linkHTML;
            setHtmlContent(editorRef.current.innerHTML);
            setLinkUrl("");
            setShowLinkInput(false);
            placeCaretAtEnd(editorRef.current);
        }
    };

    const placeCaretAtEnd = (el) => {
        el.focus();
        if (typeof window.getSelection != "undefined" && typeof document.createRange != "undefined") {
            var range = document.createRange();
            range.selectNodeContents(el);
            range.collapse(false);
            var sel = window.getSelection();
            sel.removeAllRanges();
            sel.addRange(range);
        }
    };

    const handleInput = (e) => {
        setHtmlContent(e.currentTarget.innerHTML);
    };

    const removeMedia = () => {
        setMedia(null);
        setMediaPreview(null);
        setMediaType(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const handleSubmit = async () => {
        const plainText = editorRef.current?.innerText || "";
        if (!plainText.trim() && !media && !htmlContent.includes('<a')) return;
        
        setLoading(true);
        try {
            let finalContent = htmlContent;

            // 1. Upload Media if exists
            if (media) {
                const formData = new FormData();
                formData.append('file', media); // Backend expects 'file'

                // Need custom headers for multipart
                const uploadRes = await api.post('/upload/media', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });

                const fileUrl = `http://localhost:5000${uploadRes.data.filePath}`;
                
                // 2. Embed Media HTML
                if (mediaType === 'video') {
                    finalContent += `<br/><div class="media-container"><video controls src="${fileUrl}" style="width: 100%; border-radius: 8px; margin-top: 10px;"></video></div>`;
                } else {
                    finalContent += `<br/><div class="media-container"><img src="${fileUrl}" alt="Post Image" style="width: 100%; border-radius: 8px; margin-top: 10px;" /></div>`;
                }
            }

            // 3. Create Post with embedded content
            await api.post('/discussions', { 
                title: "Post",
                content: finalContent, 
                category: "General",
                visibility: visibility 
            });

            toast.success("Post successful!");
            if (onPostCreated) onPostCreated();
            onClose();
        } catch (error) {
            console.error(error);
            toast.error("Failed to post. Check connection.");
        } finally {
            setLoading(false);
        }
    };

    const getAcceptType = () => {
        if (initialMediaType === 'video') return "video/mp4,video/x-m4v,video/*";
        if (initialMediaType === 'photo') return "image/jpeg,image/png,image/gif,image/webp";
        return "image/*,video/*";
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[552px] p-0 gap-0 bg-white border-none shadow-2xl rounded-xl flex flex-col max-h-[90vh] overflow-visible">
                <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100">
                    <h2 className="text-xl font-medium text-gray-900">
                        {initialMediaType === 'video' ? 'Select/Edit Video' : 'Create a post'}
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <FaTimes className="text-gray-500" />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto custom-scrollbar flex-grow min-h-[300px]">
                    <div className="flex items-center gap-3 mb-4">
                        <Avatar className="h-12 w-12">
                            <AvatarImage src={user?.avatar} />
                            <AvatarFallback>{user?.name?.[0]}</AvatarFallback>
                        </Avatar>
                        <div>
                            <h3 className="font-bold text-gray-900 text-base">{user?.name}</h3>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <button className="flex items-center gap-1.5 px-3 py-1 mt-0.5 rounded-full border border-gray-500 text-gray-600 hover:bg-gray-100 hover:border-gray-800 transition-colors text-sm font-bold transition-all outline-none">
                                        {visibility === 'anyone' ? <FaGlobeAmericas size={12} /> : <FaUserFriends size={12} />}
                                        {visibility === 'anyone' ? 'Anyone' : 'Connections only'}
                                        <span className="text-[10px] ml-1">▼</span>
                                    </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="start" className="w-[220px] bg-white border border-gray-200 shadow-xl z-[9999]">
                                    <DropdownMenuItem onClick={() => setVisibility('anyone')} className="gap-3 cursor-pointer py-3 px-4 hover:bg-gray-100 text-gray-700 font-medium">
                                        <FaGlobeAmericas className="text-gray-500 text-lg" /> 
                                        <div className="flex flex-col">
                                            <span>Anyone</span>
                                            <span className="text-xs text-gray-400 font-normal">Anyone on or off CodeFlow</span>
                                        </div>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => setVisibility('connections')} className="gap-3 cursor-pointer py-3 px-4 hover:bg-gray-100 text-gray-700 font-medium">
                                        <FaUserFriends className="text-gray-500 text-lg" /> 
                                        <div className="flex flex-col">
                                            <span>Connections only</span>
                                            <span className="text-xs text-gray-400 font-normal">Connections on CodeFlow</span>
                                        </div>
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>

                    <div
                        ref={editorRef}
                        contentEditable={true}
                        onInput={handleInput}
                        className="w-full min-h-[120px] outline-none text-lg text-gray-900 empty:before:content-[attr(placeholder)] empty:before:text-gray-500 cursor-text whitespace-pre-wrap break-words"
                        placeholder="What do you want to talk about?"
                    />

                    {showLinkInput && (
                        <div className="flex items-center gap-2 mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200 animate-in fade-in zoom-in-95 duration-200 shadow-sm relative z-50">
                            <FaLink className="text-gray-400" />
                            <Input 
                                value={linkUrl}
                                onChange={(e) => setLinkUrl(e.target.value)}
                                placeholder="Paste or type a link..."
                                className="h-9 text-sm bg-white border-gray-300 focus-visible:ring-indigo-500 text-black"
                                autoFocus
                                onKeyDown={(e) => e.key === 'Enter' && handleAddLink()}
                            />
                            <Button size="sm" onClick={handleAddLink} className="h-9 bg-[#0a66c2] hover:bg-[#004182] text-white">Apply</Button>
                            <Button size="sm" variant="ghost" onClick={() => setShowLinkInput(false)} className="h-9 w-9 p-0 hover:bg-gray-200"><FaTimes /></Button>
                        </div>
                    )}

                    {mediaPreview && (
                        <div className="relative mt-4 rounded-lg overflow-hidden border border-gray-200 bg-black group">
                            <button 
                                onClick={removeMedia}
                                className="absolute top-3 right-3 bg-gray-900/80 hover:bg-black text-white p-2 rounded-full transition-colors z-20 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <FaTimes size={14} />
                            </button>
                            
                            {mediaType === 'video' ? (
                                <video 
                                    src={mediaPreview} 
                                    controls 
                                    className="w-full max-h-[400px] object-contain mx-auto" 
                                />
                            ) : (
                                <img 
                                    src={mediaPreview} 
                                    alt="Preview" 
                                    className="w-full object-contain max-h-[400px] mx-auto" 
                                />
                            )}
                        </div>
                    )}
                </div>

                <div className="px-6 py-4 flex items-center justify-between mt-auto border-t border-gray-100 bg-white rounded-b-xl">
                    <div className="flex items-center gap-1">
                        <input type="file" ref={fileInputRef} accept={getAcceptType()} className="hidden" onChange={handleFileChange} />
                        <ToolbarButton icon={<FaImage size={20} />} tooltip="Add Photo" onClick={() => { fileInputRef.current.accept = "image/jpeg,image/png,image/gif"; fileInputRef.current.click(); }} disabled={initialMediaType === 'video' || !!media} />
                        <ToolbarButton icon={<FaVideo size={22} />} tooltip="Add Video" onClick={() => { fileInputRef.current.accept = "video/mp4,video/x-m4v,video/*"; fileInputRef.current.click(); }} disabled={initialMediaType === 'photo' || !!media} />
                        <ToolbarButton icon={<FaCalendarAlt size={18} />} tooltip="Create Event" />
                        <ToolbarButton icon={<FaEllipsisH size={20} />} tooltip="More" />
                        <div className="w-[1px] h-6 bg-gray-300 mx-2"></div>
                        <button onClick={() => setShowLinkInput(!showLinkInput)} className={`p-2 rounded-full transition-colors ${showLinkInput ? 'bg-indigo-50 text-indigo-600' : 'text-gray-500 hover:bg-gray-100'}`} title="Add Link"><FaLink size={18} /></button>
                    </div>
                    <div className="flex items-center gap-4">
                        <Button onClick={handleSubmit} disabled={(!htmlContent.trim() && !media && !editorRef.current?.innerText.trim()) || loading} className={`rounded-full font-semibold px-6 py-1.5 transition-all ${ (!htmlContent.trim() && !media && !editorRef.current?.innerText.trim()) ? 'bg-gray-100 text-gray-400 hover:bg-gray-100 shadow-none cursor-not-allowed' : 'bg-[#0a66c2] hover:bg-[#004182] text-white shadow-sm' }`}>{loading ? "Posting..." : "Post"}</Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

const ToolbarButton = ({ icon, onClick, disabled, active, tooltip }) => (
    <button onClick={onClick} disabled={disabled} title={tooltip} className={`p-2.5 rounded-full transition-colors relative group ${ disabled ? 'text-gray-300 cursor-not-allowed' : active ? 'bg-gray-100 text-gray-900' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700' }`}>{icon}</button>
);

export default CreatePostModal;