import Link from 'next/link';
import useAuth from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/router';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { FaUserCircle, FaCode, FaSignOutAlt, FaShieldAlt, FaComments, FaUsers, FaLaptopCode } from 'react-icons/fa';

const Navbar = () => {
  const { user, logout, isAuthenticated, isAdmin } = useAuth();
  const router = useRouter();

  const isActive = (path) => router.pathname === path ? "bg-indigo-50 text-indigo-600" : "text-gray-600 hover:text-indigo-600 hover:bg-gray-50";

  return (
    <nav className="bg-white border-b border-gray-200 fixed w-full z-50 top-0 left-0 h-16">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 h-full">
        <div className="flex justify-between items-center h-full">
          
          {/* LEFT SIDE */}
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2">
              <FaCode className="text-indigo-600 text-2xl" />
              <span className="font-bold text-xl text-gray-900 tracking-tight">CodeFlow</span>
            </Link>

            <div className="hidden md:flex items-center gap-1">
                {isAuthenticated && (
                    <Link href="/dashboard">
                        <Button variant="ghost" className={`font-medium ${isActive('/dashboard')}`}>Dashboard</Button>
                    </Link>
                )}
                <Link href="/problems">
                    <Button variant="ghost" className={`font-medium ${isActive('/problems')}`}>Problems</Button>
                </Link>
                <Link href="/courses">
                    <Button variant="ghost" className={`font-medium ${isActive('/courses')}`}>Courses</Button>
                </Link>
                {/* --- NEW LINKS --- */}
                <Link href="/discuss">
                    <Button variant="ghost" className={`font-medium gap-2 ${isActive('/discuss')}`}>
                        <FaComments className="text-xs" /> Discuss
                    </Button>
                </Link>
                <Link href="/network">
                    <Button variant="ghost" className={`font-medium gap-2 ${isActive('/network')}`}>
                        <FaUsers className="text-xs" /> Network
                    </Button>
                </Link>
                <Link href="/playground">
                    <Button variant="ghost" className={`font-medium gap-2 ${isActive('/playground')}`}>
                        <FaLaptopCode className="text-xs" /> Playground
                    </Button>
                </Link>
            </div>
          </div>

          {/* RIGHT SIDE */}
          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <>
                {isAdmin && (
                  <Link href="/admin/dashboard">
                      <Button variant="ghost" className="text-gray-600 hover:text-indigo-600 flex items-center gap-2">
                        <FaShieldAlt /> Admin
                      </Button>
                  </Link>
                )}
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-10 w-10 rounded-full p-0 hover:bg-gray-100 ring-2 ring-transparent focus:ring-indigo-100">
                      {user?.avatar ? (
                          <img 
                              src={user.avatar} 
                              alt={user.name} 
                              className="h-9 w-9 rounded-full object-cover border border-gray-200" 
                          />
                      ) : (
                          <div className="h-9 w-9 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold">
                              {user?.name?.[0]?.toUpperCase()}
                          </div>
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-64 bg-white border-gray-200 shadow-lg mr-4 mt-2" align="end">
                    <DropdownMenuLabel className="font-normal p-3">
                      <div className="flex flex-col space-y-1">
                        <p className="text-base font-medium leading-none text-gray-900">{user?.name || 'User'}</p>
                        <p className="text-xs leading-none text-gray-500">{user?.email}</p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator className="bg-gray-100" />
                    <DropdownMenuItem asChild className="focus:bg-gray-50 cursor-pointer text-gray-700 p-3">
                      <Link href="/profile" className="flex w-full items-center">
                        <FaUserCircle className="mr-2 h-4 w-4 text-gray-400" />
                        Profile
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-gray-100" />
                    <DropdownMenuItem 
                        className="text-red-600 focus:bg-red-50 focus:text-red-700 cursor-pointer p-3"
                        onClick={logout}
                    >
                      <FaSignOutAlt className="mr-2 h-4 w-4" />
                      Log out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/login">
                  <Button variant="ghost" className="text-gray-700 hover:text-gray-900 hover:bg-gray-100">Log in</Button>
                </Link>
                <Link href="/signup">
                  <Button className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm">Sign up</Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;