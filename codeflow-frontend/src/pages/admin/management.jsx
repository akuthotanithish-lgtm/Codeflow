import { useState, useEffect } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from '@/components/ui/button';
import { FaEdit, FaTrash } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { getAllCourses, createCourse, updateCourse, deleteCourse } from '@/services/courseService';
import { getAllTopics, createTopic, updateTopic, deleteTopic } from '@/services/topicService';
import { getAllQuestions, deleteQuestion } from '@/services/problemService';
import api from '@/services/api';
import Link from 'next/link';

const AdminManagement = () => {
    // State for displaying lists of existing content
    const [courses, setCourses] = useState([]);
    const [topics, setTopics] = useState([]);
    const [questions, setQuestions] = useState([]);
    const [loading, setLoading] = useState(true);

    // State for the reusable modal
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState('course'); // Determines if modal is for 'course' or 'topic'
    const [isEditing, setIsEditing] = useState(false);
    const [currentItem, setCurrentItem] = useState(null);
    const [imageFile, setImageFile] = useState(null);

    // Fetches all data required for the management page
const fetchData = async () => {
        setLoading(true);
        try {
            const [coursesRes, topicsRes, questionsRes] = await Promise.all([
                getAllCourses(),
                getAllTopics(),
                getAllQuestions()
            ]);
            // FIX: Add a fallback to an empty array for each state update.
            setCourses(coursesRes.data || []);
            setTopics(topicsRes.data || []);
            setQuestions(questionsRes.data || []);
        } catch (error) {
            toast.error("Failed to load management data.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // Opens the modal for creating or editing an item
    const handleOpenModal = (type, item = null) => {
        setModalMode(type);
        if (item) {
            setIsEditing(true);
            setCurrentItem({ ...item }); // Use a copy to avoid direct state mutation
        } else {
            setIsEditing(false);
            // Set initial state for a new item
            setCurrentItem(type === 'course' ? { title: '', description: '' } : { title: '', description: '', course: '' });
        }
        setIsModalOpen(true);
    };

    // Closes the modal and resets its state
    const handleCloseModal = () => {
        setIsModalOpen(false);
        setCurrentItem(null);
        setImageFile(null);
        setIsEditing(false);
    };

    // Generic handler for form input changes
    const handleChange = (e) => {
        setCurrentItem({ ...currentItem, [e.target.name]: e.target.value });
    };
    
    // Generic handler for deleting any type of content
    const handleDelete = async (type, id) => {
        const typeName = type.charAt(0).toUpperCase() + type.slice(1);
        if (confirm(`Are you sure you want to delete this ${typeName}? This may also delete its children (e.g., topics, problems).`)) {
            try {
                if (type === 'course') await deleteCourse(id);
                else if (type === 'topic') await deleteTopic(id);
                else if (type === 'question') await deleteQuestion(id);
                toast.success(`${typeName} deleted successfully!`);
                fetchData(); // Refresh all data
            } catch (error) {
                toast.error(`Failed to delete ${typeName}.`);
            }
        }
    };
    
    // Handles the form submission for both creating and editing
    const handleSubmit = async (e) => {
        e.preventDefault();
        let data = { ...currentItem };

        // Handle image upload if a course is being created/edited and a file is selected
        if (modalMode === 'course' && imageFile) {
            const formData = new FormData();
            formData.append('image', imageFile);
            try {
                // THE DEFINITIVE FIX: Explicitly set the Content-Type header to override
                // any global axios defaults. This is crucial for file uploads.
                const res = await api.post('/upload/image', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                data.imageUrl = res.data.filePath;
            } catch (error) {
                console.error("Upload error:", error.response?.data || error.message);
                const errorMsg = error.response?.data?.msg || "Image upload failed! The server rejected the request.";
                return toast.error(errorMsg);
            }
        }

        try {
            if (isEditing) { // Update logic
                if (modalMode === 'course') await updateCourse(data._id, data);
                else if (modalMode === 'topic') await updateTopic(data._id, data);
            } else { // Create logic
                if (modalMode === 'course') await createCourse(data);
                else if (modalMode === 'topic') await createTopic(data);
            }
            toast.success(`${modalMode.charAt(0).toUpperCase() + modalMode.slice(1)} ${isEditing ? 'updated' : 'created'} successfully!`);
            handleCloseModal();
            fetchData(); // Refresh data on success
        } catch (error) {
            toast.error(`Failed to save ${modalMode}.`);
        }
    };

    return (
        <AdminLayout>
            <h1 className="text-3xl font-bold text-white mb-6">Content Management</h1>
            <Tabs defaultValue="courses" className="w-full">
                <TabsList className="bg-slate-900/50">
                    <TabsTrigger value="courses">Courses</TabsTrigger>
                    <TabsTrigger value="topics">Topics</TabsTrigger>
                    <TabsTrigger value="questions">Questions</TabsTrigger>
                </TabsList>

                {[
                    { type: 'course', items: courses, title: 'Courses' },
                    { type: 'topic', items: topics, title: 'Topics' },
                    { type: 'question', items: questions, title: 'Questions' }
                ].map(tab => (
                    <TabsContent key={tab.type} value={tab.type + 's'} className="mt-4">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-2xl font-semibold text-slate-200">Existing {tab.title} ({tab.items.length})</h2>
                            {tab.type !== 'question' && <Button onClick={() => handleOpenModal(tab.type)}>Add New {tab.title.slice(0, -1)}</Button>}
                        </div>
                        <div className="space-y-2 max-h-[70vh] overflow-y-auto p-2 bg-slate-800 rounded-lg border border-slate-700">
                            {tab.items.map(item => (
                                <div key={item._id} className="p-3 bg-slate-700 rounded text-slate-200 flex justify-between items-center">
                                    <span>{item.title}</span>
                                    <div className="flex gap-2">
                                        {tab.type === 'question' ? (
                                            <Link href={`/admin/questions?edit=${item._id}`}><Button variant="outline" size="sm" className="text-yellow-400 border-yellow-400 hover:bg-yellow-400/10"><FaEdit/></Button></Link>
                                        ) : (
                                            <Button variant="outline" size="sm" onClick={() => handleOpenModal(tab.type, item)} className="text-yellow-400 border-yellow-400 hover:bg-yellow-400/10"><FaEdit/></Button>
                                        )}
                                        <Button variant="destructive" size="sm" onClick={() => handleDelete(tab.type, item._id)}><FaTrash/></Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </TabsContent>
                ))}
            </Tabs>
            
            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50 p-4">
                    <form onSubmit={handleSubmit} className="bg-slate-800 p-6 rounded-lg shadow-xl w-full max-w-lg border border-slate-700 space-y-4">
                        <h2 className="text-2xl font-bold text-white">{isEditing ? 'Edit' : 'Create'} {modalMode.charAt(0).toUpperCase() + modalMode.slice(1)}</h2>
                        
                        <input type="text" placeholder="Title" name="title" value={currentItem?.title || ''} onChange={handleChange} className="w-full p-2 bg-slate-700 rounded border border-slate-600 text-white" required />
                        <textarea placeholder="Description" name="description" value={currentItem?.description || ''} onChange={handleChange} className="w-full p-2 bg-slate-700 rounded border border-slate-600 text-white" rows="3"></textarea>
                        
                        {modalMode === 'topic' && (
                            <select name="course" value={currentItem?.course || ''} onChange={handleChange} className="w-full p-2 bg-slate-700 rounded border border-slate-600 text-white" required>
                                <option value="">-- Select Parent Course --</option>
                                {courses.map(c => <option key={c._id} value={c._id}>{c.title}</option>)}
                            </select>
                        )}
                        {modalMode === 'course' && (
                            <div>
                                <label className="text-sm text-slate-400 mb-1 block">Course Image (Optional)</label>
                                <input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files[0])} className="w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-slate-600 file:text-slate-200 hover:file:bg-slate-500 cursor-pointer"/>
                            </div>
                        )}

                        <div className="flex justify-end gap-2 pt-4">
                            <Button type="button" variant="secondary" onClick={handleCloseModal}>Cancel</Button>
                            <Button type="submit">{isEditing ? 'Save Changes' : 'Create'}</Button>
                        </div>
                    </form>
                </div>
            )}
        </AdminLayout>
    );
};

export default AdminManagement;

