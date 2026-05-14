import { useEffect } from 'react';
import { useRouter } from 'next/router';
import useAuth from '@/hooks/useAuth';
import Spinner from '@/components/Spinner';

const ProfileIndex = () => {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    // Wait until auth check is complete
    if (!loading) {
      if (user) {
        // Redirect to the dynamic profile page (e.g., /profile/65a3d...)
        router.replace(`/profile/${user._id}`);
      } else {
        // If not logged in, send to login
        router.replace('/login');
      }
    }
  }, [user, loading, router]);

  // Show loading spinner while redirecting
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F3F2EF]">
      <Spinner size="xl" />
    </div>
  );
};

export default ProfileIndex;