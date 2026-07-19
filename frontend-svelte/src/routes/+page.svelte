<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { Loader2, Mail } from 'lucide-svelte';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { toast } from 'svelte-sonner';
	import { AuthService } from '$lib/services';
	import { auth } from '$lib/state/auth.svelte';

	type AuthStep = 'email' | 'otp';

	let step = $state<AuthStep>('email');
	let isLoading = $state(false);
	let email = $state('');
	let otp = $state('');

	// Redirect to /home if already authenticated
	$effect(() => {
		if (auth.isAuthenticated) {
			goto('/home', { replaceState: true });
		}
	});

	async function handleEmailSubmit(e: Event) {
		e.preventDefault();
		if (isLoading || !email) return;
		isLoading = true;

		try {
			await AuthService.requestOtp(email);
			step = 'otp';
			toast.success(`OTP sent to ${email}`);
		} catch (err: any) {
			toast.error(err.response?.data?.detail || err.response?.data?.error || 'Could not send OTP.');
		} finally {
			isLoading = false;
		}
	}

	async function handleOtpSubmit(e: Event) {
		e.preventDefault();
		if (isLoading || otp.length < 6) return;
		isLoading = true;

		try {
			const res = await AuthService.verifyOtp(email, otp);

			if (res?.access || res?.tokens?.access) {
				const access = res.access || res.tokens.access;
				const refresh = res.refresh || res.tokens?.refresh;
				localStorage.setItem('access_token', access);
				if (refresh) {
					localStorage.setItem('refresh_token', refresh);
				}
				if (res?.user) {
					localStorage.setItem('user', JSON.stringify(res.user));
				}
				
				// Update auth state directly to ensure immediate reactivity
				auth.isAuthenticated = true;
			}

			toast.success('Successfully authenticated!');
			goto('/home');
		} catch (err: any) {
			toast.error(err.response?.data?.detail || err.response?.data?.error || 'Invalid OTP code.');
		} finally {
			isLoading = false;
		}
	}
</script>

<main class="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background p-4">
	<div class="pointer-events-none absolute inset-0 flex items-center justify-center">
		<div class="absolute h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/10 blur-[100px]"></div>
		<div class="absolute h-[600px] w-[600px] translate-x-1/3 translate-y-1/3 rounded-full bg-accent/10 blur-[120px]"></div>
	</div>

	<div class="z-10 w-full max-w-md">
		<div class="mb-8 flex flex-col items-center">
			<div class="mb-4 flex size-12 items-center justify-center rounded-xl bg-primary shadow-lg shadow-primary/20">
				<span class="text-2xl font-bold text-primary-foreground">V</span>
			</div>
			<h1 class="text-2xl font-bold tracking-tight text-foreground">
				{step === 'email' ? 'Welcome to Velvet' : 'Check your email'}
			</h1>
			<p class="mt-2 text-center text-sm text-muted-foreground">
				{step === 'email' ? 'Enter your email to get a one-time code' : `We sent a 6-digit code to ${email}`}
			</p>
		</div>

		<div class="relative overflow-hidden rounded-2xl border border-white/10 bg-card/40 p-8 shadow-2xl backdrop-blur-xl dark:border-white/5">
			<div class="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>

			{#if step === 'email'}
				<form onsubmit={handleEmailSubmit} class="space-y-6">
					<div class="space-y-2">
						<Label for="email" class="text-muted-foreground">Email Address</Label>
						<div class="relative">
							<Mail class="absolute left-3 top-1/2 size-5 -translate-y-1/2 text-muted-foreground/50" />
							<Input
								id="email"
								type="email"
								placeholder="name@example.com"
								class="h-12 border-white/10 bg-background/50 pl-10 transition-all focus-visible:ring-primary"
								bind:value={email}
								required
							/>
						</div>
					</div>

					<Button
						type="submit"
						class="h-12 w-full bg-primary text-base font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
					>
						{#if isLoading}
							<Loader2 class="size-5 animate-spin" />
						{:else}
							Send OTP
						{/if}
					</Button>
				</form>
			{:else}
				<form onsubmit={handleOtpSubmit} class="flex flex-col items-center space-y-6">
					<div class="flex w-full flex-col justify-center space-y-2">
						<Label for="otp" class="text-muted-foreground text-center">One-Time Password</Label>
						<!-- Simple fallback for InputOTP -->
						<Input
							id="otp"
							type="text"
							maxlength={6}
							placeholder="000000"
							class="h-14 border-white/10 bg-background/50 text-center text-2xl tracking-[0.5em] focus-visible:ring-primary"
							bind:value={otp}
							disabled={isLoading}
							autocomplete="one-time-code"
							required
						/>
					</div>

					<Button
						type="submit"
						class="mt-4 h-12 w-full bg-primary text-base font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
					>
						{#if isLoading}
							<Loader2 class="size-5 animate-spin" />
						{:else}
							Verify Code
						{/if}
					</Button>

					<button
						type="button"
						onclick={() => {
							step = 'email';
							otp = '';
						}}
						class="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground focus:outline-none"
					>
						Use a different email
					</button>
				</form>
			{/if}
		</div>

		<p class="mt-8 text-center text-xs text-muted-foreground/60">
			By continuing, you agree to our Terms of Service and Privacy Policy.
		</p>
	</div>
</main>
