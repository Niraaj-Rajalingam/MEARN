'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import FormField from './FormField';
import Input from './Input';
import FlashMessage from './FlashMessage';
import { useFlashMessage } from '@/app/utils/hooks';

type AuthFormMode = 'login' | 'signup';

interface AuthFormProps {
  mode: AuthFormMode;
  onSubmit: (data: any) => Promise<{ success: boolean; user?: any; error?: string }>;
}

/**
 * Generic reusable auth form component
 * Handles both login and signup with form validation
 */
export default function AuthForm({ mode, onSubmit }: AuthFormProps) {
  const router = useRouter();
  const [firstName, setFirstName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { message, messageKind, flash, resetFlash } = useFlashMessage();

  const isSignup = mode === 'signup';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    resetFlash();

    try {
      const data = isSignup
        ? { firstName, email, password }
        : { email, password };

      const result = await onSubmit(data);

      if (result.success) {
        const successMessage = isSignup
          ? 'Success! User created and logged in.'
          : 'Success! Logging in...';
        flash('success', successMessage);

        const delay = isSignup ? 1500 : 1000;
        setTimeout(() => {
          router.push(`/dashboard/${result.user?.user_uuid}`);
        }, delay);
      } else {
        flash('error', result.error || `${isSignup ? 'Sign up' : 'Login'} failed. Please try again.`);
      }
    } catch (error) {
      flash('error', 'An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const otherAuthPath = isSignup ? '/login' : '/signup';
  const otherAuthText = isSignup ? 'Login' : 'Sign up';
  const otherAuthPrompt = isSignup
    ? 'Already have an account?'
    : "Don't have an account?";
  const submitButtonText = isSignup
    ? isLoading
      ? 'Creating account...'
      : 'Sign Up'
    : isLoading
    ? 'Logging in...'
    : 'Login';

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="w-full max-w-md space-y-8 p-8 border rounded-lg bg-card">
        <div className="text-center">
          <h1 className="text-3xl font-bold">MEARN Tamagotchi</h1>
          <p className="mt-2 text-muted-foreground">
            {isSignup ? 'Create your account' : 'Login to your account'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {isSignup && (
            <FormField label="First Name" required>
              <Input
                id="firstName"
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
                placeholder="Enter your first name"
              />
            </FormField>
          )}

          <FormField label="Email" required>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="Enter your email"
            />
          </FormField>

          <FormField label="Password" required>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Enter your password"
            />
          </FormField>

          <FlashMessage message={message} kind={messageKind} onDismiss={resetFlash} />

          <button
            type="submit"
            disabled={isLoading}
            className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 disabled:opacity-50 transition-opacity font-medium"
          >
            {submitButtonText}
          </button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          {otherAuthPrompt}{' '}
          <a href={otherAuthPath} className="text-primary hover:underline font-medium">
            {otherAuthText}
          </a>
        </p>
      </div>
    </div>
  );
}
