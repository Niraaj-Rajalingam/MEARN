'use server'

import { login } from '@/app/services/user.service';
import { createSession } from '@/lib/session';
import { LoginDTO } from '@/app/types/user.type';

export async function loginAction(data: LoginDTO) {
  try {
    //login with email and password
    const user = await login(data);

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