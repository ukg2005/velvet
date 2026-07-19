import { goto } from '$app/navigation';
import { browser } from '$app/environment';

export function createAuth() {
	let isAuthenticated = $state<boolean | null>(browser ? !!localStorage.getItem('access_token') : null);

	function requireAuth() {
		if (isAuthenticated === false) {
			goto('/');
		}
	}

	return {
		get isAuthenticated() { return isAuthenticated; },
		set isAuthenticated(val: boolean | null) { isAuthenticated = val; },
		requireAuth
	};
}

// Global singleton instance for auth state
export const auth = createAuth();
