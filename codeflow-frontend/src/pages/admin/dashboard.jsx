import AdminLayout from '@/components/AdminLayout';
import useAuth from '@/hooks/useAuth';
import Link from 'next/link';
import { FaLayerGroup, FaQuestionCircle } from 'react-icons/fa';

const AdminDashboard = () => {
    const { user } = useAuth();

    return (
        <AdminLayout>
            <h1 className="text-4xl font-bold text-white">Admin Dashboard</h1>
            <p className="text-xl text-slate-400 mt-2">Welcome back, {user?.name}!</p>
            
            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* UPDATED: This card now correctly links to the new management page */}
                <Link href="/admin/management" className="bg-slate-700 p-8 rounded-lg hover:bg-slate-600 transition-colors">
                    <h2 className="text-2xl font-bold text-blue-400 flex items-center gap-3">
                        <FaLayerGroup /> Content Management
                    </h2>
                    <p className="mt-2 text-slate-400">Add, edit, or delete Courses and Topics.</p>
                </Link>
                {/* UPDATED: This card links to the questions page */}
                <Link href="/admin/questions" className="bg-slate-700 p-8 rounded-lg hover:bg-slate-600 transition-colors">
                    <h2 className="text-2xl font-bold text-blue-400 flex items-center gap-3">
                        <FaQuestionCircle /> Problem Management
                    </h2>
                    <p className="mt-2 text-slate-400">Create new coding problems and manage test cases.</p>
                </Link>
            </div>
        </AdminLayout>
    );
};

export default AdminDashboard;