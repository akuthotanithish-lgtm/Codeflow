import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import useAuth from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import Spinner from '@/components/Spinner';
import { FaCode, FaCheck } from 'react-icons/fa';

const Signup = () => {
    const [formData, setFormData] = useState({ name: '', email: '', password: '', password2: '' });
    const { signup, isAuthenticated, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && isAuthenticated) router.push('/courses');
    }, [loading, isAuthenticated, router]);

    const onChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });
    
    const onSubmit = e => {
        e.preventDefault();
        // Add your validation logic here
        signup(formData.name, formData.email, formData.password);
    };

    if (loading || isAuthenticated) return <div className="min-h-screen flex items-center justify-center bg-white"><Spinner /></div>;

    return (
        <div className="min-h-screen w-full flex bg-white">
            {/* LEFT SIDE: Form */}
            <div className="w-full lg:w-1/2 flex flex-col justify-center px-8 sm:px-16 lg:px-24 xl:px-32 py-12 relative z-10">
                <div className="mb-8">
                    <Link href="/" className="flex items-center gap-2 text-indigo-600 font-bold text-2xl tracking-tight">
                        <FaCode /> CodeFlow
                    </Link>
                </div>

                <div className="mb-8">
                    <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight mb-2">
                        Create your account
                    </h1>
                    <p className="text-gray-500">
                        Start your journey to mastering algorithms today.
                    </p>
                </div>

                <form onSubmit={onSubmit} className="space-y-5">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Full Name</label>
                        <input type="text" name="name" onChange={onChange} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 focus:bg-white focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-all outline-none" placeholder="John Doe" required />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email</label>
                        <input type="email" name="email" onChange={onChange} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 focus:bg-white focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-all outline-none" placeholder="you@company.com" required />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Password</label>
                            <input type="password" name="password" onChange={onChange} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 focus:bg-white focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-all outline-none" placeholder="••••••••" required />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Confirm</label>
                            <input type="password" name="password2" onChange={onChange} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 focus:bg-white focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-all outline-none" placeholder="••••••••" required />
                        </div>
                    </div>

                    <Button type="submit" className="w-full h-11 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg shadow-md hover:shadow-lg transition-all text-base mt-2">
                        Create Account
                    </Button>
                </form>

                <p className="mt-8 text-center text-gray-600 text-sm">
                    Already have an account?{" "}
                    <Link href="/login" className="font-bold text-indigo-600 hover:text-indigo-500">
                        Sign in
                    </Link>
                </p>
            </div>

            {/* RIGHT SIDE: Visual/Features */}
            <div className="hidden lg:flex w-1/2 bg-gray-50 relative overflow-hidden flex-col justify-center px-16">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-700 to-indigo-800"></div>
                <div className="absolute inset-0 opacity-10 bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>
                
                <div className="relative z-10 text-white max-w-lg">
                    <h2 className="text-3xl font-bold mb-6">Join the community</h2>
                    <ul className="space-y-4">
                        {['Practice with 500+ curated problems', 'Real-time code execution engine', 'AI-powered debugging assistance', 'Track your progress and rank up'].map((item, i) => (
                            <li key={i} className="flex items-center gap-3 text-indigo-100 text-lg">
                                <span className="bg-white/20 p-1 rounded-full"><FaCheck size={12}/></span>
                                {item}
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default Signup;