import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import toast from 'react-hot-toast';
import { FaEdit, FaTrash, FaPlus, FaFileUpload, FaCopy } from 'react-icons/fa';

import AdminLayout from '@/components/AdminLayout';
import { Button } from '@/components/ui/button';
// FIX: Import createBulkQuestions
import { getAllQuestions, createQuestion, updateQuestion, deleteQuestion, getQuestionByIdForAdmin, createBulkQuestions } from '@/services/problemService';
import { getAllCourses } from '@/services/courseService';
import { getAllTopics } from '@/services/topicService';
import Spinner from '@/components/Spinner';

const initialFormState = {
    title: '',
    description: '',
    difficulty: 'Easy',
    course: '',
    topic: '',
    sampleTestCases: '[]',
    hiddenTestCases: '[]',
    starter_cpp: '',
    starter_java: '',
    starter_python: '',
    driver_cpp: '',
    driver_java: '',
    driver_python: '',
    solutions: [],
};

const AdminQuestions = () => {
    const [questions, setQuestions] = useState([]);
    
    // Modal states
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isBulkModalOpen, setIsBulkModalOpen] = useState(false); // NEW: State for bulk modal
    
    const [currentQuestion, setCurrentQuestion] = useState(initialFormState);
    const [bulkJson, setBulkJson] = useState(''); // NEW: State for JSON input
    
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(true);

    const [allCourses, setAllCourses] = useState([]);
    const [allTopics, setAllTopics] = useState([]);
    const [filteredTopics, setFilteredTopics] = useState([]);

    const router = useRouter();

    const fetchQuestions = async () => {
        setLoading(true);
        try {
            const res = await getAllQuestions();
            // Using fallback to empty array to prevent crashes
            setQuestions(res.data || []);
        } catch (error) {
            toast.error('Failed to fetch questions.');
            setQuestions([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchQuestions();
    }, []);

    useEffect(() => {
        const fetchDropdownData = async () => {
            if (isModalOpen) {
                try {
                    const [coursesRes, topicsRes] = await Promise.all([
                        getAllCourses(),
                        getAllTopics(),
                    ]);
                    setAllCourses(coursesRes.data);
                    setAllTopics(topicsRes.data);

                    if (currentQuestion.course) {
                        setFilteredTopics(topicsRes.data.filter(t => t.course === currentQuestion.course));
                    }
                } catch (error) {
                    toast.error("Failed to load courses or topics.");
                }
            }
        };
        fetchDropdownData();
    }, [isModalOpen, currentQuestion.course]);
    
    useEffect(() => {
        if (router.isReady && router.query.edit && questions.length > 0) {
            const questionToEdit = questions.find(q => q._id === router.query.edit);
            if (questionToEdit) {
                handleOpenModal(questionToEdit);
            }
        }
    }, [router.isReady, router.query, questions]);


    const handleOpenModal = async (question = null) => {
        if (question) {
            try {
                const res = await getQuestionByIdForAdmin(question._id);
                const fullQuestionData = res.data;

                setIsEditing(true);
                setCurrentQuestion({
                    ...initialFormState,
                    ...fullQuestionData,
                    course: fullQuestionData.course?._id || '',
                    topic: fullQuestionData.topic?._id || '',
                    sampleTestCases: JSON.stringify(fullQuestionData.sampleTestCases || [], null, 2),
                    hiddenTestCases: JSON.stringify(fullQuestionData.hiddenTestCases || [], null, 2),
                    solutions: fullQuestionData.solutions || [],
                });
                setIsModalOpen(true);
            } catch (error) {
                toast.error("Failed to fetch full question details.");
            }
        } else {
            setIsEditing(false);
            setCurrentQuestion(initialFormState);
            setIsModalOpen(true);
        }
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        router.push('/admin/questions', undefined, { shallow: true });
    };

    const handleChange = (e) => setCurrentQuestion({ ...currentQuestion, [e.target.name]: e.target.value });

    const handleCourseChange = (e) => {
        const courseId = e.target.value;
        setCurrentQuestion({ ...currentQuestion, course: courseId, topic: '' });
        setFilteredTopics(allTopics.filter(topic => topic.course === courseId));
    };

    const handleTopicChange = (e) => {
        const topicId = e.target.value;
        const selectedTopic = allTopics.find(t => t._id === topicId);
        if (selectedTopic && selectedTopic.course !== currentQuestion.course) {
            setCurrentQuestion({ ...currentQuestion, topic: topicId, course: selectedTopic.course });
            setFilteredTopics(allTopics.filter(t => t.course === selectedTopic.course));
        } else {
            setCurrentQuestion({ ...currentQuestion, topic: topicId });
        }
    };

    const handleSolutionChange = (index, field, value) => {
        const updatedSolutions = [...currentQuestion.solutions];
        updatedSolutions[index][field] = value;
        setCurrentQuestion({ ...currentQuestion, solutions: updatedSolutions });
    };

    const addSolution = () => {
        setCurrentQuestion({
            ...currentQuestion,
            solutions: [...currentQuestion.solutions, { language: 'cpp', approach: 'Bruteforce', explanation: '', code: '' }]
        });
    };

    const removeSolution = (index) => {
        const updatedSolutions = currentQuestion.solutions.filter((_, i) => i !== index);
        setCurrentQuestion({ ...currentQuestion, solutions: updatedSolutions });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!currentQuestion.course || !currentQuestion.topic) {
            return toast.error("Please select both a course and a topic.");
        }
        try {
            const payload = {
                ...currentQuestion,
                sampleTestCases: JSON.parse(currentQuestion.sampleTestCases),
                hiddenTestCases: JSON.parse(currentQuestion.hiddenTestCases),
            };
            
            if (isEditing) {
                await updateQuestion(currentQuestion._id, payload);
                toast.success('Question updated successfully!');
            } else {
                await createQuestion(payload);
                toast.success('Question created successfully!');
            }
            fetchQuestions();
            handleCloseModal();
        } catch (error) {
            toast.error('Failed to save question. Check JSON format for test cases.');
            console.error("Save question error:", error);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this question?')) {
            try {
                await deleteQuestion(id);
                toast.success('Question deleted successfully!');
                fetchQuestions();
            } catch (error) {
                toast.error('Failed to delete question.');
            }
        }
    };

const handleBulkSubmit = async () => {
        try {
            const parsedData = JSON.parse(bulkJson);
            if (!Array.isArray(parsedData)) {
                return toast.error("JSON must be an array of objects: [...]");
            }
            
            const loadingToast = toast.loading("Processing & Uploading...");
            await createBulkQuestions(parsedData);
            
            toast.dismiss(loadingToast);
            toast.success(`Successfully uploaded ${parsedData.length} questions!`);
            
            setBulkJson('');
            setIsBulkModalOpen(false);
            fetchQuestions();
        } catch (error) {
            console.error(error);
            const errorData = error.response?.data;
            
            // FIX: Show specific lookup errors (e.g., "Course 'Java' not found")
            if (errorData?.errors && Array.isArray(errorData.errors)) {
                toast.error(
                    <div>
                        <p className="font-bold">Upload Failed:</p>
                        <ul className="list-disc pl-4 text-xs">
                            {errorData.errors.slice(0, 3).map((e, i) => <li key={i}>{e}</li>)}
                            {errorData.errors.length > 3 && <li>...and more</li>}
                        </ul>
                    </div>, 
                    { duration: 6000 }
                );
            } else {
                toast.error(errorData?.msg || "Invalid JSON or Server Error.");
            }
        }
    };

    // Helper to copy a template
    const copyTemplate = () => {
        const template = [
            {
                "title": "Example Title",
                "description": "Description here...",
                "difficulty": "Easy",
                "course": "COURSE_ID_HERE",
                "topic": "TOPIC_ID_HERE",
                "sampleTestCases": [{"input": {"nums": [1]}, "output": 1}],
                "hiddenTestCases": [{"input": {"nums": [2]}, "output": 2}],
                "starter_cpp": "// code",
                "driver_cpp": "// driver",
                "solutions": []
            }
        ];
        navigator.clipboard.writeText(JSON.stringify(template, null, 2));
        toast.success("Template copied to clipboard!");
    };

    const difficultyColor = { 'Easy': 'text-green-400', 'Medium': 'text-yellow-400', 'Hard': 'text-red-400' };
    
    if (loading) {
        return <AdminLayout><Spinner /></AdminLayout>;
    }

    return (
        <AdminLayout>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-white">Problem Management</h1>
                <div className="flex gap-3">
                    {/* NEW: Bulk Upload Button */}
                    <Button variant="outline" onClick={() => setIsBulkModalOpen(true)} className="border-blue-500 text-blue-400 hover:bg-blue-500/10">
                        <FaFileUpload className="mr-2"/> Import JSON
                    </Button>
                    <Button onClick={() => handleOpenModal()}>
                        <FaPlus className="mr-2"/> Add New Question
                    </Button>
                </div>
            </div>
            
            <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700">
                <table className="w-full text-left">
                    <thead className="border-b border-slate-700">
                        <tr>
                            <th className="p-4 text-sm font-semibold text-slate-300">Title</th>
                            <th className="p-4 text-sm font-semibold text-slate-300">Difficulty</th>
                            <th className="p-4 text-sm font-semibold text-slate-300">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {questions.map(q => (
                            <tr key={q._id} className="border-b border-slate-800">
                                <td className="p-4 text-slate-200">{q.title}</td>
                                <td className={`p-4 font-semibold ${difficultyColor[q.difficulty]}`}>{q.difficulty}</td>
                                <td className="p-4 flex space-x-4">
                                    <button onClick={() => handleOpenModal(q)} className="text-yellow-400 hover:text-yellow-300"><FaEdit size={18} /></button>
                                    <button onClick={() => handleDelete(q._id)} className="text-red-500 hover:text-red-400"><FaTrash size={18} /></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* --- NEW: Bulk Import Modal --- */}
            {isBulkModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50 p-4">
                    <div className="bg-slate-800 p-6 rounded-lg shadow-xl w-full max-w-4xl border border-slate-700 flex flex-col h-[80vh]">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-2xl font-bold text-white">Bulk Import Questions</h2>
                            <Button variant="outline" size="sm" onClick={copyTemplate} className="text-xs">
                                <FaCopy className="mr-2"/> Copy JSON Template
                            </Button>
                        </div>
                        
                        <p className="text-slate-400 text-sm mb-2">
                            Paste a JSON array of question objects below. Ensure you use valid <strong>Course IDs</strong> and <strong>Topic IDs</strong> from your database.
                        </p>

                        <textarea 
                            className="flex-grow w-full p-4 bg-slate-900 border border-slate-600 rounded font-mono text-sm text-slate-300 resize-none focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder='[
  {
    "title": "Problem 1",
    "description": "...",
    "course": "65f...",
    ...
  },
  ...
]'
                            value={bulkJson}
                            onChange={(e) => setBulkJson(e.target.value)}
                        ></textarea>

                        <div className="flex justify-end gap-3 mt-4">
                            <Button variant="secondary" onClick={() => setIsBulkModalOpen(false)}>Cancel</Button>
                            <Button onClick={handleBulkSubmit} disabled={!bulkJson.trim()}>Upload Questions</Button>
                        </div>
                    </div>
                </div>
            )}

            {/* --- Existing Create/Edit Modal --- */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50 p-4">
                    <form onSubmit={handleSubmit} className="bg-slate-800 p-6 rounded-lg shadow-xl w-full max-w-7xl h-[95vh] flex flex-col border border-slate-700">
                        <h2 className="text-2xl font-bold mb-4 text-white flex-shrink-0">{isEditing ? 'Edit Question' : 'Add New Question'}</h2>
                        <div className="overflow-y-auto pr-4 grid grid-cols-1 md:grid-cols-3 gap-x-6">
                            {/* --- Column 1: Core Details --- */}
                            <div className="flex flex-col gap-4">
                                <h3 className="text-xl text-blue-400 font-semibold border-b border-slate-700 pb-2">Categorization</h3>
                                <div>
                                    <label className="block mb-1 text-sm text-slate-400">Course</label>
                                    <select name="course" value={currentQuestion.course} onChange={handleCourseChange} className="w-full p-2 bg-slate-700 border border-slate-600 rounded text-white" required>
                                        <option value="">-- Select Course --</option>
                                        {allCourses.map(course => (<option key={course._id} value={course._id}>{course.title}</option>))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block mb-1 text-sm text-slate-400">Topic</label>
                                    <select name="topic" value={currentQuestion.topic} onChange={handleTopicChange} className="w-full p-2 bg-slate-700 border border-slate-600 rounded text-white" required disabled={!currentQuestion.course && filteredTopics.length === 0}>
                                        <option value="">-- Select Topic --</option>
                                        {filteredTopics.map(topic => (<option key={topic._id} value={topic._id}>{topic.title}</option>))}
                                    </select>
                                </div>
                                <h3 className="text-xl text-blue-400 font-semibold border-b border-slate-700 pb-2 mt-4">Problem Details</h3>
                                <div><label className="block mb-1 text-sm text-slate-400">Title</label><input type="text" name="title" value={currentQuestion.title} onChange={handleChange} className="w-full p-2 bg-slate-700 border border-slate-600 rounded text-white" required /></div>
                                <div><label className="block mb-1 text-sm text-slate-400">Difficulty</label><select name="difficulty" value={currentQuestion.difficulty} onChange={handleChange} className="w-full p-2 bg-slate-700 border border-slate-600 rounded text-white"><option>Easy</option><option>Medium</option><option>Hard</option></select></div>
                                <div><label className="block mb-1 text-sm text-slate-400">Description (Markdown/HTML)</label><textarea name="description" value={currentQuestion.description} onChange={handleChange} className="w-full p-2 bg-slate-700 border border-slate-600 rounded text-white" rows="12" required></textarea></div>
                            </div>
                            {/* --- Column 2: Technical Details --- */}
                            <div className="flex flex-col gap-4">
                                <h3 className="text-xl text-blue-400 font-semibold border-b border-slate-700 pb-2">Test Cases</h3>
                                <div><label className="block mb-1 text-sm text-slate-400">Sample Test Cases (JSON)</label><textarea name="sampleTestCases" value={currentQuestion.sampleTestCases} onChange={handleChange} className="w-full p-2 bg-slate-900 border border-slate-600 rounded font-mono text-xs text-slate-300" rows="6"></textarea></div>
                                <div><label className="block mb-1 text-sm text-slate-400">Hidden Test Cases (JSON)</label><textarea name="hiddenTestCases" value={currentQuestion.hiddenTestCases} onChange={handleChange} className="w-full p-2 bg-slate-900 border border-slate-600 rounded font-mono text-xs text-slate-300" rows="6"></textarea></div>
                                <h3 className="text-xl text-blue-400 font-semibold border-b border-slate-700 pb-2 mt-4">Code Templates</h3>
                                <div><label className="block mb-1 text-sm text-slate-400">C++ Starter</label><textarea name="starter_cpp" value={currentQuestion.starter_cpp} onChange={handleChange} className="w-full p-2 bg-slate-900 border border-slate-600 rounded font-mono text-xs text-slate-300" rows="4"></textarea></div>
                                <div><label className="block mb-1 text-sm text-slate-400">Java Starter</label><textarea name="starter_java" value={currentQuestion.starter_java} onChange={handleChange} className="w-full p-2 bg-slate-900 border border-slate-600 rounded font-mono text-xs text-slate-300" rows="4"></textarea></div>
                                <div><label className="block mb-1 text-sm text-slate-400">Python Starter</label><textarea name="starter_python" value={currentQuestion.starter_python} onChange={handleChange} className="w-full p-2 bg-slate-900 border border-slate-600 rounded font-mono text-xs text-slate-300" rows="4"></textarea></div>
                                <div><label className="block mb-1 text-sm text-slate-400">C++ Driver</label><textarea name="driver_cpp" value={currentQuestion.driver_cpp} onChange={handleChange} className="w-full p-2 bg-slate-900 border border-slate-600 rounded font-mono text-xs text-slate-300" rows="4"></textarea></div>
                                <div><label className="block mb-1 text-sm text-slate-400">Java Driver</label><textarea name="driver_java" value={currentQuestion.driver_java} onChange={handleChange} className="w-full p-2 bg-slate-900 border border-slate-600 rounded font-mono text-xs text-slate-300" rows="4"></textarea></div>
                                <div><label className="block mb-1 text-sm text-slate-400">Python Driver</label><textarea name="driver_python" value={currentQuestion.driver_python} onChange={handleChange} className="w-full p-2 bg-slate-900 border border-slate-600 rounded font-mono text-xs text-slate-300" rows="4"></textarea></div>
                            </div>
                            {/* --- Column 3: Solutions --- */}
                            <div className="flex flex-col gap-4">
                                <div className="flex justify-between items-center border-b border-slate-700 pb-2">
                                    <h3 className="text-xl text-blue-400 font-semibold">Official Solutions</h3>
                                    <Button type="button" size="sm" onClick={addSolution}><FaPlus className="mr-2"/>Add</Button>
                                </div>
                                <div className="space-y-4 max-h-[70vh] overflow-y-auto">
                                    {currentQuestion.solutions.map((sol, index) => (
                                        <div key={index} className="bg-slate-900/50 p-3 rounded-lg border border-slate-600">
                                            <div className="flex justify-between items-center mb-2">
                                                <h4 className="font-bold text-slate-300">Solution #{index + 1}</h4>
                                                <Button type="button" variant="destructive" size="sm" onClick={() => removeSolution(index)}><FaTrash/></Button>
                                            </div>
                                            <div className="grid grid-cols-2 gap-2 mb-2">
                                                <select value={sol.language} onChange={(e) => handleSolutionChange(index, 'language', e.target.value)} className="w-full p-2 bg-slate-700 border border-slate-600 rounded text-sm text-white"><option value="cpp">C++</option><option value="java">Java</option><option value="python">Python</option></select>
                                                <select value={sol.approach} onChange={(e) => handleSolutionChange(index, 'approach', e.target.value)} className="w-full p-2 bg-slate-700 border border-slate-600 rounded text-sm text-white"><option>Bruteforce</option><option>Better</option><option>Optimal</option></select>
                                            </div>
                                            <label className="block mb-1 text-sm text-slate-400">Explanation</label>
                                            <textarea value={sol.explanation} onChange={(e) => handleSolutionChange(index, 'explanation', e.target.value)} className="w-full p-2 bg-slate-700 border border-slate-600 rounded font-mono text-xs text-slate-300" rows="3"></textarea>
                                            <label className="block mb-1 mt-2 text-sm text-slate-400">Code</label>
                                            <textarea value={sol.code} onChange={(e) => handleSolutionChange(index, 'code', e.target.value)} className="w-full p-2 bg-slate-700 border border-slate-600 rounded font-mono text-xs text-slate-300" rows="8"></textarea>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div className="flex justify-end space-x-4 pt-4 flex-shrink-0">
                            <Button type="button" variant="secondary" onClick={handleCloseModal}>Cancel</Button>
                            <Button type="submit">{isEditing ? 'Update Question' : 'Create Question'}</Button>
                        </div>
                    </form>
                </div>
            )}
        </AdminLayout>
    );
};

export default AdminQuestions;