'use server'

import { signUp } from '@/app/services/user.service';
import { createSession } from '@/lib/session';
import { SignUpDTO } from '@/app/types/user.type';
import { isEmail } from '@/app/utils/validation';

/**
 * Server-side signup action with comprehensive validation
 * Validates first name, email format, and password strength requirements
 */
export async function signUpAction(data: SignUpDTO) {
  try {
    // Server-side validation
    const { firstName, email, password } = data;

    // Validate first name
    if (!firstName || typeof firstName !== 'string') {
      return {
        success: false,
        error: 'First name is required.',
      };
    }

    const trimmedFirstName = firstName.trim();
    if (trimmedFirstName.length < 2) {
      return {
        success: false,
        error: 'First name must be at least 2 characters long.',
      };
    }

    if (trimmedFirstName.length > 50) {
      return {
        success: false,
        error: 'First name must be less than 50 characters.',
      };
    }

    if (!/^[a-zA-Z\s'-]+$/.test(trimmedFirstName)) {
      return {
        success: false,
        error: 'First name can only contain letters, spaces, hyphens, and apostrophes.',
      };
    }

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
        error: 'Password must be less than 128 characters.',
      };
    }

    // Password complexity requirements
    if (!/(?=.*[a-z])/.test(password)) {
      return {
        success: false,
        error: 'Password must contain at least one lowercase letter.',
      };
    }

    if (!/(?=.*[A-Z])/.test(password)) {
      return {
        success: false,
        error: 'Password must contain at least one uppercase letter.',
      };
    }

    if (!/(?=.*\d)/.test(password)) {
      return {
        success: false,
        error: 'Password must contain at least one number.',
      };
    }

    // create user in the database
    const user = await signUp({ 
      firstName: trimmedFirstName, 
      email: trimmedEmail, 
      password 
    });

    if (!user) {
      return {
        success: false,
        error: 'Failed to create user. Email may already be in use.',
      };
    }

    // create session for user
    await createSession(user);

    return {
      success: true,
      user,
    };
  } catch (error) {
    console.error('Sign up error:', error);
    return {
      success: false,
      error: 'An error occurred during sign up. Please try again.',
    };
  }
}