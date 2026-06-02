import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getImageUrl(path: string | undefined | null, size: string = 'w500', fallbackSize?: string) {
  if (!path) return 'https://via.placeholder.com/500x750?text=No+Image';
  
  if (path.startsWith('http')) {
    if (path.includes('image.tmdb.org/t/p/')) {
      return path.replace(/\/t\/p\/(w\d+|original)\//, `/t/p/${size}/`);
    }
    return path;
  }
  
  return `https://image.tmdb.org/t/p/${size}${path}`;
}
