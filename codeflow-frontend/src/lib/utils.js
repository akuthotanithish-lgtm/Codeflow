import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

// 1. Existing Class Merger (Keep this for shadcn/ui)
export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

// 2. NEW: Shared Avatar URL Helper (Fixes your error)
export const getAvatarUrl = (avatarPath) => {
  if (!avatarPath) return null;
  
  // Return immediately if it's a Data URI or External URL (Google/GitHub)
  if (avatarPath.startsWith('data:') || avatarPath.startsWith('http')) {
      return avatarPath;
  }

  // Get Backend URL (removes '/api' if present)
  const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/api$/, '').replace(/\/$/, '') || 'http://localhost:5000';

  // Fix Windows paths (\ -> /)
  let cleanPath = avatarPath.replace(/\\/g, '/');

  // Ensure leading slash
  if (!cleanPath.startsWith('/')) {
      cleanPath = `/${cleanPath}`;
  }

  return `${baseUrl}${cleanPath}`;
};