import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api';

/**
 * Hook to protect routes that require authentication.
 * Redirects to login if not authenticated.
 *
 * @returns Object with loading state
 */
export function useProtectedRoute() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAccess = async () => {
      // Check if we have tokens
      if (!apiClient.isAuthenticated()) {
        router.push('/login');
        return;
      }

      // Verify token is valid by making a test request
      try {
        const response = await apiClient.request('/auth/profile/');
        if (!response.ok) {
          // Token is invalid, redirect to login
          apiClient.logout();
          router.push('/login');
          return;
        }
      } catch (error) {
        // Request failed, redirect to login
        apiClient.logout();
        router.push('/login');
        return;
      }

      setIsLoading(false);
    };

    checkAccess();
  }, [router]);

  return { isLoading };
}
