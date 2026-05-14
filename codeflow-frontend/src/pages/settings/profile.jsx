import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import useAuth from '@/hooks/useAuth';
import api from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getAvatarUrl } from '@/lib/utils';
import toast from 'react-hot-toast';
import Spinner from '@/components/Spinner';
import { Upload, Trash2 } from 'lucide-react';

const EditProfilePage = () => {
    const router = useRouter();
    const { user, refreshUser, loading: authLoading } = useAuth();
    const [loading, setLoading] = useState(false);
    const [imageLoading, setImageLoading] = useState(false);
    const fileInputRef = useRef(null);
    const [previewKey, setPreviewKey] = useState(Date.now()); // Force re-render of image
    
    const [formData, setFormData] = useState({
        name: '',
        bio: '',
        location: '',
        socialGithub: '',
        socialLinkedin: '',
        socialWebsite: ''
    });

    useEffect(() => {
        if (user) {
            setFormData({
                name: user.name || '',
                bio: user.bio || '',
                location: user.location || '',
                socialGithub: user.socials?.github || '',
                socialLinkedin: user.socials?.linkedin || '',
                socialWebsite: user.socials?.website || ''
            });
        } else if (!authLoading) {
            router.push('/login');
        }
    }, [user, authLoading, router]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleImageChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) return toast.error('Please select an image file.');
        if (file.size > 5 * 1024 * 1024) return toast.error('Image must be less than 5MB.');

        const uploadData = new FormData();
        uploadData.append('image', file);

        setImageLoading(true);
        try {
            const uploadRes = await api.post('/upload', uploadData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            
            // Update profile with new URL
            await api.put('/users/profile', { avatar: uploadRes.data.url });
            await refreshUser();
            setPreviewKey(Date.now()); // Force refresh
            toast.success("Profile picture updated!");
        } catch (error) {
            console.error(error);
            toast.error("Failed to upload image.");
        } finally {
            setImageLoading(false);
            if(fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleImageDelete = async () => {
        if(!confirm("Delete profile picture?")) return;
        setImageLoading(true);
        try {
            await api.put('/users/profile', { avatar: '' }); // Send empty string
            await refreshUser();
            setPreviewKey(Date.now());
            toast.success("Profile picture deleted.");
        } catch (error) {
            toast.error("Failed to delete picture.");
        } finally {
            setImageLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.put('/users/profile', formData);
            await refreshUser();
            toast.success("Profile updated successfully!");
            router.push(`/profile/${user._id}`);
        } catch (error) {
            toast.error("Failed to update profile.");
        } finally {
            setLoading(false);
        }
    };

    if (authLoading || !user) return <div className="min-h-screen flex items-center justify-center bg-[#F3F2EF]"><Spinner size="xl" /></div>;

    // Helper to bust cache
    const currentAvatarUrl = user.avatar ? `${getAvatarUrl(user.avatar)}?t=${previewKey}` : null;

    return (
        <div className="min-h-screen bg-[#F3F2EF] py-10 font-sans">
            <div className="max-w-2xl mx-auto px-4">
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
                    <h1 className="text-2xl font-bold text-slate-900 mb-6">Edit Profile</h1>
                    
                    <input type="file" ref={fileInputRef} onChange={handleImageChange} className="hidden" accept="image/*"/>

                    <div className="flex items-center gap-6 mb-8">
                        <div className="relative">
                            <Avatar className="h-24 w-24 border-2 border-slate-200">
                                <AvatarImage src={currentAvatarUrl} className="object-cover" />
                                <AvatarFallback className="text-2xl">{user.name?.[0]}</AvatarFallback>
                            </Avatar>
                            {imageLoading && (
                                <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                                    <Spinner color="white" size="sm" />
                                </div>
                            )}
                        </div>
                        <div className="flex gap-3">
                            <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()} disabled={imageLoading} className="gap-2 text-slate-700">
                                <Upload size={16}/> Change Picture
                            </Button>
                            <Button type="button" variant="ghost" onClick={handleImageDelete} disabled={imageLoading} className="text-red-500 hover:text-red-600 hover:bg-red-50 gap-2">
                                <Trash2 size={16}/> Delete
                            </Button>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                            <Input name="name" value={formData.name} onChange={handleChange} required className="text-slate-900 border-slate-300 focus:border-blue-500" />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Bio</label>
                            <Textarea name="bio" value={formData.bio} onChange={handleChange} rows={3} placeholder="Tell us about yourself" className="text-slate-900 border-slate-300 resize-none" />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Location</label>
                            <Input name="location" value={formData.location} onChange={handleChange} className="text-slate-900 border-slate-300" />
                        </div>

                        <div className="pt-4 border-t border-slate-100">
                            <h3 className="text-sm font-bold text-slate-900 mb-4">Social Links</h3>
                            <div className="grid gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-slate-500 mb-1">GitHub URL</label>
                                    <Input name="socialGithub" value={formData.socialGithub} onChange={handleChange} className="text-slate-900 border-slate-300" />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-500 mb-1">LinkedIn URL</label>
                                    <Input name="socialLinkedin" value={formData.socialLinkedin} onChange={handleChange} className="text-slate-900 border-slate-300" />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-500 mb-1">Website</label>
                                    <Input name="socialWebsite" value={formData.socialWebsite} onChange={handleChange} className="text-slate-900 border-slate-300" />
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-4">
                            <Button type="button" variant="ghost" onClick={() => router.back()} className="text-slate-600">Cancel</Button>
                            <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white min-w-[100px]">
                                {loading ? "Saving..." : "Save Changes"}
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default EditProfilePage;