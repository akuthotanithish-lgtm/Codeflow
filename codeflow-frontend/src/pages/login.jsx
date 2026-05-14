import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import useAuth from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import Spinner from '@/components/Spinner';
import { FaCode } from 'react-icons/fa';

const Login = () => {
    const [formData, setFormData] = useState({ email: '', password: '' });
    const { login, adminLogin, isAuthenticated, loading } = useAuth();
    const [isAdminLogin, setIsAdminLogin] = useState(false);
    const router = useRouter();

    useEffect(() => {
        if (!loading && isAuthenticated) {
            router.push('/courses');
        }
    }, [loading, isAuthenticated, router]);

    const { email, password } = formData;
    const onChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });
    
    const onSubmit = e => {
        e.preventDefault();
        if (isAdminLogin) adminLogin(email, password);
        else login(email, password);
    };

    if (loading || isAuthenticated) {
        return <div className="flex-grow flex items-center justify-center min-h-screen bg-white"><Spinner /></div>;
    }

    return (
        <div className="min-h-screen w-full flex bg-white">
            
            {/* LEFT SIDE: Form */}
            <div className="w-full lg:w-1/2 flex flex-col justify-center px-8 sm:px-16 lg:px-24 xl:px-32 relative z-10">
                <div className="mb-12">
                    <Link href="/" className="flex items-center gap-2 text-indigo-600 font-bold text-2xl tracking-tight">
                        <FaCode /> CodeFlow
                    </Link>
                </div>

                <div className="mb-8">
                    <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight mb-2">
                        {isAdminLogin ? 'Admin Portal' : 'Welcome back'}
                    </h1>
                    <p className="text-gray-500 text-lg">
                        {isAdminLogin ? 'Secure access for platform management.' : 'Please enter your details to sign in.'}
                    </p>
                </div>

                <form onSubmit={onSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
                        <input 
                            type="email" 
                            name="email" 
                            value={email} 
                            onChange={onChange} 
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 focus:bg-white focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-all outline-none"
                            placeholder="you@company.com"
                            required 
                        />
                    </div>
                    
                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <label className="block text-sm font-semibold text-gray-700">Password</label>
                            <Link href="#" className="text-sm font-semibold text-indigo-600 hover:text-indigo-500">
                                Forgot password?
                            </Link>
                        </div>
                        <input 
                            type="password" 
                            name="password" 
                            value={password} 
                            onChange={onChange} 
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 focus:bg-white focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-all outline-none"
                            placeholder="••••••••"
                            required 
                        />
                    </div>

                    <Button 
                        type="submit" 
                        className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg shadow-md hover:shadow-lg transition-all transform active:scale-[0.98] text-base"
                    >
                        {isAdminLogin ? 'Sign In as Admin' : 'Sign In'}
                    </Button>
                </form>

                <div className="mt-8 text-center">
                    <p className="text-gray-600">
                        {isAdminLogin ? "Not an admin?" : "Don't have an account?"}{" "}
                        <Link 
                            href={isAdminLogin ? "/login" : "/signup"} 
                            onClick={(e) => { if(isAdminLogin) { e.preventDefault(); setIsAdminLogin(false); }}}
                            className="font-bold text-indigo-600 hover:text-indigo-500"
                        >
                            {isAdminLogin ? 'Go to User Login' : 'Sign up for free'}
                        </Link>
                    </p>
                    <button 
                        onClick={() => setIsAdminLogin(!isAdminLogin)} 
                        className="mt-6 text-xs text-gray-400 font-medium hover:text-gray-600 uppercase tracking-wide"
                    >
                        {isAdminLogin ? '← Back to User Login' : 'Admin Access →'}
                    </button>
                </div>
            </div>

            {/* RIGHT SIDE: Visual / Artistic */}
            <div className="hidden lg:block w-1/2 bg-slate-50 relative overflow-hidden">
                {/* Decorative Gradient Background */}
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 to-purple-700"></div>
                
                {/* Abstract Pattern Overlay */}
                <div className="absolute inset-0 opacity-20" style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
                }}></div>

                {/* Content Overlay */}
                <div className="absolute inset-0 flex flex-col justify-center items-center text-white p-12 text-center">
                    <div className="w-24 h-24 bg-white/10 backdrop-blur-lg rounded-2xl flex items-center justify-center mb-8 border border-white/20 shadow-2xl">
                        <FaCode className="text-5xl text-white" />
                    </div>
                    <h2 className="text-3xl font-bold mb-4">Master Algorithms Today</h2>
                    <p className="text-indigo-100 text-lg max-w-md leading-relaxed">
                        Join thousands of developers practicing their coding skills with our advanced compiler and AI-powered assistance.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;