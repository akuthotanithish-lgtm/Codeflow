import { useState, useEffect } from 'react';
import { Info } from 'lucide-react';
import api from '@/services/api';
import { Skeleton } from "@/components/ui/skeleton";
import useAuth from '@/hooks/useAuth';

const NewsWidget = () => {
    const { user } = useAuth(); // Get auth state
    const [newsItems, setNewsItems] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) {
            setLoading(false);
            return;
        }

        const fetchNews = async () => {
            try {
                const res = await api.get('/discussions/news');
                setNewsItems(res.data);
            } catch (error) {
                console.error("Failed to fetch news");
            } finally {
                setLoading(false);
            }
        };
        fetchNews();
    }, [user]);

    if (!user) return null; // Don't show if not logged in
    if (loading) return <div className="bg-white p-4 rounded-lg border border-gray-300"><Skeleton className="h-20 w-full"/></div>;

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-300 p-4">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-sm font-bold text-gray-900">News for you</h2>
                <Info size={14} className="text-gray-500 cursor-pointer" />
            </div>

            <ul className="space-y-4">
                {newsItems.length > 0 ? newsItems.map((item, index) => (
                    <li key={index} className="cursor-pointer group">
                        <div className="flex items-start gap-2">
                            <span className="text-gray-400 mt-1.5 text-[6px] flex-shrink-0">●</span>
                            <div>
                                <h3 className="text-xs font-semibold text-gray-800 group-hover:text-indigo-600 group-hover:underline line-clamp-2">
                                    {item.title}
                                </h3>
                                <div className="flex gap-2 text-[10px] text-gray-400 mt-0.5">
                                    <span>{item.time}</span>
                                    <span>•</span>
                                    <span>{item.readers}</span>
                                </div>
                            </div>
                        </div>
                    </li>
                )) : (
                    <p className="text-xs text-gray-500">Interact with posts to see personalized news.</p>
                )}
            </ul>
        </div>
    );
};

export default NewsWidget;