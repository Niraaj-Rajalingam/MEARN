'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import FormField from './FormField';
import Input from './Input';
import FlashMessage from './FlashMessage';
import { useFlashMessage } from '@/app/utils/hooks';
import { isEmail } from '@/app/utils/validation';

type AuthFormMode = 'login' | 'signup';

interface AuthFormProps {
  mode: AuthFormMode;
  onSubmit: (data: any) => Promise<{ success: boolean; user?: any; error?: string }>;
}

interface ValidationErrors {
  firstName?: string;
  email?: string;
  password?: string;
}

/**
 * Generic reusable auth form component
 * Handles both login and signup with client-side and server-side validation
 */
export default function AuthForm({ mode, onSubmit }: AuthFormProps) {
  const router = useRouter();
  const [firstName, setFirstName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const { message, messageKind, flash, resetFlash } = useFlashMessage();

  const isSignup = mode === 'signup';

  /**
   * Validates the form fields
   * @returns Object with validation errors, or empty if valid
   */
  const validateForm = (): ValidationErrors => {
    const newErrors: ValidationErrors = {};

    // Validate first name (signup only)
    if (isSignup) {
      if (!firstName.trim()) {
        newErrors.firstName = 'First name is required.';
      } else if (firstName.trim().length < 2) {
        newErrors.firstName = 'First name must be at least 2 characters.';
      } else if (firstName.trim().length > 50) {
        newErrors.firstName = 'First name must be less than 50 characters.';
      } else if (!/^[a-zA-Z\s'-]+$/.test(firstName.trim())) {
        newErrors.firstName = 'First name can only contain letters, spaces, hyphens, and apostrophes.';
      }
    }

    // Validate email
    if (!email.trim()) {
      newErrors.email = 'Email is required.';
    } else if (!isEmail(email.trim(), true)) {
      newErrors.email = 'Please enter a valid email address.';
    }

    // Validate password
    if (!password) {
      newErrors.password = 'Password is required.';
    } else if (isSignup) {
      // Stricter validation for signup
      if (password.length < 8) {
        newErrors.password = 'Password must be at least 8 characters long.';
      } else if (!/(?=.*[a-z])/.test(password)) {
        newErrors.password = 'Password must contain at least one lowercase letter.';
      } else if (!/(?=.*[A-Z])/.test(password)) {
        newErrors.password = 'Password must contain at least one uppercase letter.';
      } else if (!/(?=.*\d)/.test(password)) {
        newErrors.password = 'Password must contain at least one number.';
      } else if (password.length > 128) {
        newErrors.password = 'Password must be less than 128 characters.';
      }
    } else {
      // Basic validation for login
      if (password.length < 8) {
        newErrors.password = 'Password must be at least 8 characters long.';
      }
    }

    return newErrors;
  };

  /**
   * Handles field blur events to mark fields as touched
   */
  const handleBlur = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    
    // Validate on blur
    const validationErrors = validateForm();
    setErrors(validationErrors);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    resetFlash();

    // Mark all fields as touched
    setTouched({
      firstName: true,
      email: true,
      password: true,
    });

    // Validate form
    const validationErrors = validateForm();
    setErrors(validationErrors);

    // If there are validation errors, don't submit
    if (Object.keys(validationErrors).length > 0) {
      flash('error', 'Please fix the errors in the form.');
      setIsLoading(false);
      return;
    }

    try {
      const data = isSignup
        ? { firstName: firstName.trim(), email: email.trim(), password }
        : { email: email.trim(), password };

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
    <div
      className="flex min-h-screen items-center justify-center relative overflow-hidden"
      style={{
        background: isSignup
          ? 'radial-gradient(circle at top left, white 0%, rgb(243 232 255) 70%)'
          : 'radial-gradient(circle at top left, white 0%, rgb(243 232 255) 70%)',
      }}
    >
      <div
        className="w-full max-w-md space-y-8 p-8 rounded-lg bg-white dark:bg-white"
        style={{
          border: '2px solid',
          borderImage: 'linear-gradient(to bottom right, rgb(0 0 0) 0%, rgb(255 255 255) 100%) 1',
          borderRadius: '0.5rem',
        }}
      >
        <div className="text-center">
          <h1 className="text-3xl font-bold">MEARN Tamagotchi</h1>
          <p className="mt-4 text-lg font-semibold">
            {isSignup ? 'Accountability builds consistency' : "Always be committed"}
          </p>
          <p className="mt-2 text-muted-foreground">
            {isSignup ? 'Create your account' : 'Login to your account'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {isSignup && (
            <FormField 
              label="First Name" 
              required
              error={touched.firstName ? errors.firstName : undefined}
            >
              <Input
                id="firstName"
                type="text"
                value={firstName}
                onChange={(e) => {
                  setFirstName(e.target.value);
                  if (touched.firstName) {
                    const validationErrors = validateForm();
                    setErrors(validationErrors);
                  }
                }}
                onBlur={() => handleBlur('firstName')}
                required
                placeholder="Enter your first name"
                aria-invalid={touched.firstName && !!errors.firstName}
                aria-describedby={errors.firstName ? 'firstName-error' : undefined}
              />
            </FormField>
          )}

          <FormField 
            label="Email" 
            required
            error={touched.email ? errors.email : undefined}
          >
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (touched.email) {
                  const validationErrors = validateForm();
                  setErrors(validationErrors);
                }
              }}
              onBlur={() => handleBlur('email')}
              required
              placeholder="Enter your email"
              aria-invalid={touched.email && !!errors.email}
              aria-describedby={errors.email ? 'email-error' : undefined}
            />
          </FormField>

          <FormField 
            label="Password" 
            required
            error={touched.password ? errors.password : undefined}
            helpText={isSignup ? 'Must be at least 8 characters with uppercase, lowercase, and numbers' : undefined}
          >
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (touched.password || isSignup) {
                  const validationErrors = validateForm();
                  setErrors(validationErrors);
                }
              }}
              onBlur={() => handleBlur('password')}
              required
              placeholder="Enter your password"
              aria-invalid={touched.password && !!errors.password}
              aria-describedby={errors.password ? 'password-error' : undefined}
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
