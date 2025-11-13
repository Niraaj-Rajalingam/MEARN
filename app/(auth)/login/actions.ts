'use server'

import { login } from '@/app/services/user.service';
import { createSession } from '@/lib/session';
import { LoginDTO } from '@/app/types/user.type';
import { isEmail } from '@/app/utils/validation';

/**
 * Server-side login action with validation
 * Validates email format and password requirements before attempting login
 */
export async function loginAction(data: LoginDTO) {
  try {
    // Server-side validation
    const { email, password } = data;

    // Validate email
    if (!email || typeof email !== 'string') {
      return {
        success: false,
        error: 'Email is required.',
      };
    }

    const trimmedEmail = email.trim();
    if (!isEmail(trimmedEmail, true)) {
      return {
        success: false,
        error: 'Please provide a valid email address.',
      };
    }

    // Validate password
    if (!password || typeof password !== 'string') {
      return {
        success: false,
        error: 'Password is required.',
      };
    }

    if (password.length < 8) {
      return {
        success: false,
        error: 'Password must be at least 8 characters long.',
      };
    }

    if (password.length > 128) {
      return {
        success: false,
        error: 'Password is too long.',
      };
    }

    //login with email and password
    const user = await login({ email: trimmedEmail, password });

    if (!user) {
      return {
        success: false,
        error: 'Invalid email or password.',
      };
    }

    // create user session
    await createSession(user);

    return {
      success: true,
      user,
    };
  } catch (error) {
    console.error('Login error:', error);
    return {
      success: false,
      error: 'An error occurred during login. Please try again.',
    };
  }
}