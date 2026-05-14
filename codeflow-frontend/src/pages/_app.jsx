import { AuthProvider } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import '../styles/globals.css';
import { Toaster } from 'react-hot-toast';
import { useRouter } from 'next/router';

function MyApp({ Component, pageProps }) {
    const router = useRouter();
    
    const isIdePage = router.pathname.startsWith('/problems/[id]') || router.pathname === '/playground';

    return (
        <AuthProvider>
            <div className="min-h-screen bg-gray-50">
                <Navbar />
                
                {/* FIX APPLIED: added 'pt-16' 
                    This pushes content down by 64px so the Fixed Navbar doesn't cover it.
                */}
                <main className={`
                    flex flex-col pt-16
                    ${isIdePage ? 'h-screen overflow-hidden' : 'min-h-screen w-full'}
                `}>
                    <Component {...pageProps} />
                </main>
            </div>
            <Toaster
                position="top-right"
                toastOptions={{
                    style: {
                        background: '#1e293b',
                        color: '#f8fafc',
                    },
                }}
            />
        </AuthProvider>
    );
}

export default MyApp;