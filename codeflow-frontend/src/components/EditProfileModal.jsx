import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FaGithub, FaLinkedin, FaGlobe, FaCamera, FaSpinner, FaTrash } from 'react-icons/fa';
import api from '@/services/api';
import toast from 'react-hot-toast';
import useAuth from '@/hooks/useAuth';

const EditProfileModal = ({ isOpen, onClose, user }) => {
    const { refreshUser } = useAuth();
    const [saving, setSaving] = useState(false);
    const fileInputRef = useRef(null);
    
    // Form State
    const [formData, setFormData] = useState({
        name: '',
        bio: '',
        location: '',
        socials: { github: '', linkedin: '', website: '' },
        preferences: { theme: 'light', emailNotifications: true }, 
        avatar: '' 
    });

    useEffect(() => {
        if (isOpen && user) {
            setFormData({
                name: user.name || '',
                bio: user.bio || '',
                location: user.location || '',
                socials: {
                    github: user.socials?.github || '',
                    linkedin: user.socials?.linkedin || '',
                    website: user.socials?.website || ''
                },
                preferences: {
                    theme: 'light', 
                    emailNotifications: user.preferences?.emailNotifications ?? true
                },
                avatar: user.avatar || ''
            });
        }
    }, [isOpen, user]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name.startsWith('socials.')) {
            const field = name.split('.')[1];
            setFormData(prev => ({ ...prev, socials: { ...prev.socials, [field]: value } }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handlePreferenceChange = (key, value) => {
        setFormData(prev => ({
            ...prev,
            preferences: { ...prev.preferences, [key]: value }
        }));
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 2 * 1024 * 1024) return toast.error("Image too large. Max 2MB.");
            const reader = new FileReader();
            reader.onloadend = () => setFormData(prev => ({ ...prev, avatar: reader.result }));
            reader.readAsDataURL(file);
        }
    };

    const handleRemoveImage = () => setFormData(prev => ({ ...prev, avatar: '' }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            await api.put('/users/profile', formData);
            window.location.reload(); 
            toast.success("Profile updated!");
            onClose();
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to update profile.");
            setSaving(false);
        }
    };

    const inputClasses = "bg-white border-gray-300 text-gray-900 placeholder:text-gray-400";

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[600px] bg-white text-gray-900 border border-gray-200 p-0 overflow-hidden shadow-2xl h-[85vh] flex flex-col light">
                <DialogHeader className="px-6 pt-6 pb-4 bg-gray-50 border-b border-gray-100 flex-shrink-0">
                    <DialogTitle className="text-xl font-bold text-gray-800">Edit Profile</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="px-6 py-6 space-y-6 overflow-y-auto flex-grow custom-scrollbar text-gray-900">
                    
                    {/* Avatar Section */}
                    <div className="flex flex-col items-center gap-3">
                        <div 
                            className="relative w-24 h-24 rounded-full border-4 border-white shadow-md cursor-pointer group overflow-hidden bg-gray-100"
                            onClick={() => fileInputRef.current.click()}
                        >
                            {formData.avatar ? (
                                <img src={formData.avatar} alt="Preview" className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-indigo-100 text-indigo-500 text-2xl font-bold">
                                    {formData.name?.[0]?.toUpperCase()}
                                </div>
                            )}
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <FaCamera className="text-white text-xl" />
                            </div>
                        </div>
                        {formData.avatar && (
                            <button type="button" onClick={handleRemoveImage} className="text-xs text-red-500 flex items-center gap-1 hover:text-red-600">
                                <FaTrash size={10} /> Remove Photo
                            </button>
                        )}
                        <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
                    </div>

                    {/* Basic Info */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <Label className="text-xs font-bold text-gray-500 uppercase">Full Name</Label>
                            <Input name="name" value={formData.name} onChange={handleChange} className={inputClasses} />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-xs font-bold text-gray-500 uppercase">Location</Label>
                            <Input name="location" value={formData.location} onChange={handleChange} placeholder="City, Country" className={inputClasses} />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <Label className="text-xs font-bold text-gray-500 uppercase">Bio</Label>
                        <Textarea name="bio" value={formData.bio} onChange={handleChange} placeholder="Tell us about yourself..." className={`resize-none h-24 ${inputClasses}`} />
                    </div>

                    {/* Social Links */}
                    <div className="space-y-3 pt-2 border-t border-gray-100">
                        <Label className="text-xs font-bold text-gray-500 uppercase">Social Links (Optional)</Label>
                        <div className="relative">
                            <FaGithub className="absolute left-3 top-2.5 text-gray-400" />
                            <Input name="socials.github" value={formData.socials.github} onChange={handleChange} placeholder="GitHub URL" className={`pl-9 ${inputClasses}`} />
                        </div>
                        <div className="relative">
                            <FaLinkedin className="absolute left-3 top-2.5 text-blue-500" />
                            <Input name="socials.linkedin" value={formData.socials.linkedin} onChange={handleChange} placeholder="LinkedIn URL" className={`pl-9 ${inputClasses}`} />
                        </div>
                        <div className="relative">
                            <FaGlobe className="absolute left-3 top-2.5 text-green-500" />
                            <Input name="socials.website" value={formData.socials.website} onChange={handleChange} placeholder="Website URL" className={`pl-9 ${inputClasses}`} />
                        </div>
                    </div>

                    {/* Preferences (Theme Removed) */}
                    <div className="space-y-3 pt-2 border-t border-gray-100">
                        <Label className="text-xs font-bold text-gray-500 uppercase">Preferences</Label>
                        <div className="grid grid-cols-1 gap-4">
                            <div className="space-y-1.5">
                                <Label className="text-xs text-gray-400">Email Notifications</Label>
                                <Select 
                                    value={formData.preferences.emailNotifications ? 'true' : 'false'} 
                                    onValueChange={(val) => handlePreferenceChange('emailNotifications', val === 'true')}
                                >
                                    <SelectTrigger className={inputClasses}>
                                        <SelectValue placeholder="Notifications" className="text-gray-900" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-white border-gray-200 text-gray-900">
                                        <SelectItem value="true" className="focus:bg-gray-100 cursor-pointer bg-white text-gray-900 hover:text-gray-900">Enabled</SelectItem>
                                        <SelectItem value="false" className="focus:bg-gray-100 cursor-pointer bg-white text-gray-900 hover:text-gray-900">Disabled</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>
                </form>

                <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3 flex-shrink-0">
                    <Button variant="outline" onClick={onClose} className="border-gray-300 text-gray-700 hover:bg-gray-100">Cancel</Button>
                    <Button onClick={handleSubmit} disabled={saving} className="bg-black hover:bg-gray-800 text-white min-w-[100px]">
                        {saving ? <FaSpinner className="animate-spin" /> : "Save Changes"}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default EditProfileModal;