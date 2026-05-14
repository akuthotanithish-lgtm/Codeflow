import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getAvatarUrl } from '@/lib/utils';
import { Bookmark } from 'lucide-react';

const IdentityCard = ({ user }) => {
    // Prevent crash if user data isn't loaded yet
    if (!user) return null;

    const avatarUrl = getAvatarUrl(user.avatar);

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-300 overflow-hidden sticky top-20">
            {/* Banner */}
            <div className="h-16 bg-gradient-to-r from-blue-600 to-indigo-700"></div>

            {/* Profile Info */}
            <div className="px-4 pb-4 text-center relative">
                <div className="relative -mt-8 mb-3 inline-block">
                    <Link href={`/profile/${user._id}`}>
                        <Avatar className="h-16 w-16 border-2 border-white cursor-pointer">
                            <AvatarImage src={avatarUrl} className="object-cover" />
                            <AvatarFallback>{user.name?.[0]}</AvatarFallback>
                        </Avatar>
                    </Link>
                </div>

                <Link href={`/profile/${user._id}`}>
                    <h3 className="font-bold text-gray-900 hover:underline cursor-pointer">
                        {user.name}
                    </h3>
                </Link>
                <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                    {user.bio || "CodeFlow Member"}
                </p>
            </div>

            <div className="border-t border-gray-100 py-3 px-4">
    <Link href="/network/connections" className="flex justify-between items-center mb-1 group cursor-pointer">
        <span className="text-xs text-gray-500 font-medium group-hover:text-blue-600 group-hover:underline">Connections</span>
        <span className="text-xs font-bold text-blue-600">
            {user.connections?.filter(c => c.status === 'connected').length || 0}
        </span>
    </Link>
    <Link href="/network" className="text-xs font-semibold text-blue-600 hover:underline block mt-1">
        Grow your network
    </Link>
</div>

            <div className="border-t border-gray-100 p-3 hover:bg-gray-50 transition-colors cursor-pointer">
                <Link href="/discuss/saved" className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
                    <Bookmark size={16} />
                    <span className="text-xs font-semibold">My saved items</span>
                </Link>
            </div>
        </div>
    );
};

export default IdentityCard;