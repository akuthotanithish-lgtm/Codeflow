import { createContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import { loadUser, login as loginService, signup as signupService, adminLogin as adminLoginService } from '@/services/authService';
import { setAuthToken } from '@/utils/setAuthToken';
import toast from 'react-hot-toast';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);
    const [loading, setLoading] = useState(true);

    const router = useRouter();

    // --- FIX: Apply Theme Effect ---
    // This watches the user object. Whenever it changes (e.g. after profile update),
    // it checks the theme preference and updates the DOM.
    useEffect(() => {
        if (user?.preferences?.theme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [user]);

    const logout = useCallback(() => {
        localStorage.removeItem('token');
        setAuthToken(null);
        setUser(null);
        setIsAuthenticated(false);
        setIsAdmin(false);
        setLoading(false);
        // Ensure theme resets on logout
        document.documentElement.classList.remove('dark'); 
        window.location.href = '/login'; 
    }, []);

    const loadUserData = useCallback(async () => {
        const token = localStorage.getItem('token');
        if (token) {
            setAuthToken(token);
        } else {
            setLoading(false);
            return;
        }

        try {
            const res = await loadUser();
            setUser(res);
            setIsAuthenticated(true);
            setIsAdmin(res.role === 'admin');
        } catch (error) {
            logout();
        } finally {
            setLoading(false);
        }
    }, [logout]);

    useEffect(() => {
        loadUserData();
    }, [loadUserData]);

    const refreshUser = async () => {
        await loadUserData();
    };

    const login = async (email, password) => {
        try {
            const data = await loginService({ email, password });
            localStorage.setItem('token', data.token);
            toast.success('Logged in successfully!');
            // Force a reload or redirect to trigger data fetch
            window.location.href = '/courses'; 
        } catch (error) {
            toast.error(error.response?.data?.msg || 'Login failed');
        }
    };
    
    const adminLogin = async (email, password) => {
        try {
            const data = await adminLoginService({ email, password });
            localStorage.setItem('token', data.token);
            toast.success('Admin login successful!');
            window.location.href = '/admin/dashboard';
        } catch (error) {
            toast.error(error.response?.data?.msg || 'Admin login failed');
        }
    };

    const signup = async (name, email, password) => {
        try {
            const data = await signupService({ name, email, password });
            localStorage.setItem('token', data.token);
            toast.success('Signup successful!');
            window.location.href = '/courses';
        } catch (error) {
            toast.error(error.response?.data?.msg || 'Signup failed');
        }
    };

    return (
        <AuthContext.Provider value={{ user, setUser, isAuthenticated, isAdmin, loading, login, signup, adminLogin, logout, refreshUser }}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthContext;