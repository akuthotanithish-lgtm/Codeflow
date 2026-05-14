import { useState, useEffect } from 'react';
import api from '@/services/api';
import { Skeleton } from "@/components/ui/skeleton";

const LinkPreviewCard = ({ url }) => {
    const [meta, setMeta] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        if (!url) return;
        let isMounted = true;

        const fetchMeta = async () => {
            try {
                const res = await api.get(`/utils/metadata?url=${encodeURIComponent(url)}`);
                if (isMounted) {
                    if (res.data.title || res.data.image) {
                        setMeta(res.data);
                    } else {
                        setError(true);
                    }
                }
            } catch (err) {
                if (isMounted) setError(true);
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        fetchMeta();
        return () => { isMounted = false; };
    }, [url]);

    if (error || !url) return null;

    if (loading) {
        return (
            <div className="mt-3 rounded-lg border border-gray-200 overflow-hidden max-w-[550px]">
                <Skeleton className="h-[180px] w-full" />
                <div className="p-3 bg-[#F3F4F6] space-y-2">
                    <Skeleton className="h-4 w-3/4 bg-gray-300" />
                    <Skeleton className="h-3 w-1/4 bg-gray-300" />
                </div>
            </div>
        );
    }

    return (
        <a 
            href={url} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="block mt-3 rounded-lg border border-gray-300 overflow-hidden group max-w-[550px] hover:bg-[#F3F4F6] transition-colors no-underline cursor-pointer"
        >
            {/* 1. Image Section */}
            {meta.image ? (
                <div className="h-[200px] w-full overflow-hidden bg-gray-100 border-b border-gray-200">
                    <img 
                        src={meta.image} 
                        alt="Preview" 
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
                    />
                </div>
            ) : null}

            {/* 2. Text Section (LinkedIn Style) */}
            <div className="p-3 bg-[#F3F4F6] group-hover:bg-[#EBEBEB] transition-colors">
                <h3 className="text-[14px] font-semibold text-[#191919] leading-snug line-clamp-2 mb-1 group-hover:text-blue-700 group-hover:underline">
                    {meta.title}
                </h3>
                <p className="text-[12px] text-[#666666] leading-none">
                    {meta.domain} • {meta.description ? meta.description.substring(0, 30) + "..." : "Link"}
                </p>
            </div>
        </a>
    );
};

export default LinkPreviewCard;