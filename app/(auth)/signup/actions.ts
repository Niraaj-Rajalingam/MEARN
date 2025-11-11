'use server'

import { signUp } from '@/app/services/user.service';
import { createSession } from '@/lib/session';
import { SignUpDTO } from '@/app/types/user.type';

export async function signUpAction(data: SignUpDTO) {
  try {
    // create user in the database
    const user = await signUp(data);

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