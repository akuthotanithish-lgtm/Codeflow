import { useEffect } from 'react';
import { useRouter } from 'next/router';
import useAuth from '../hooks/useAuth';
import Spinner from './Spinner';
import Link from 'next/link';
import { FaTachometerAlt, FaLayerGroup, FaQuestionCircle } from 'react-icons/fa';

const AdminLayout = ({ children }) => {
    const { isAuthenticated, isAdmin, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && (!isAuthenticated || !isAdmin)) {
            router.push('/login');
        }
    }, [loading, isAuthenticated, isAdmin, router]);

    if (loading || !isAuthenticated || !isAdmin) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <Spinner />
            </div>
        );
    }

    return (
        <div className="flex min-h-[calc(100vh-64px)] bg-gray-50 pt-6 px-6 gap-6">
            {/* Sidebar */}
            <aside className="w-64 flex-shrink-0">
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm sticky top-24 p-4">
                    <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 px-2">Admin Menu</h2>
                    <nav className="space-y-1">
                        <AdminLink href="/admin/dashboard" icon={<FaTachometerAlt />} active={router.pathname === '/admin/dashboard'}>
                            Dashboard
                        </AdminLink>
                        <AdminLink href="/admin/management" icon={<FaLayerGroup />} active={router.pathname.startsWith('/admin/management')}>
                            Content Management
                        </AdminLink>
                        <AdminLink href="/admin/questions" icon={<FaQuestionCircle />} active={router.pathname.startsWith('/admin/questions')}>
                            Questions Database
                        </AdminLink>
                    </nav>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 bg-white rounded-xl border border-gray-200 shadow-sm p-8 mb-6 overflow-hidden">
                {children}
            </main>
        </div>
    );
};

const AdminLink = ({ href, icon, children, active }) => (
    <Link 
        href={href} 
        className={`flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${
            active 
                ? 'bg-indigo-50 text-indigo-700' 
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
        }`}
    >
        <span className={`mr-3 ${active ? 'text-indigo-600' : 'text-gray-400'}`}>{icon}</span>
        {children}
    </Link>
);

export default AdminLayout;