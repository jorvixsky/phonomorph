import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Auth utilities
export function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('authToken');
}

export function isAuthenticated(): boolean {
  const token = getAuthToken();
  if (!token) return false;
  
  try {
    // Basic JWT structure validation
    const parts = token.split('.');
    if (parts.length !== 3) return false;
    
    // Decode payload to check expiration
    const payload = JSON.parse(atob(parts[1]));
    const currentTime = Math.floor(Date.now() / 1000);
    
    // Check if token is expired
    if (payload.exp && payload.exp < currentTime) {
      // Token is expired, remove it
      localStorage.removeItem('authToken');
      return false;
    }
    
    return true;
  } catch (error) {
    // Invalid token format, remove it
    console.error('Invalid token format:', error);
    localStorage.removeItem('authToken');
    return false;
  }
}

export function clearAuth(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('authToken');
  localStorage.removeItem('phoneNumber');
}

// Wallet utilities - safe for SSR
export function getWalletAddress(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('walletAddress');
}

export function setWalletAddress(address: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('walletAddress', address);
}

export function removeWalletAddress(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('walletAddress');
}
