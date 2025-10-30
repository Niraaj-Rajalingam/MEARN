'use server'

import { destroySession, getSession } from '@/lib/session';
import { redirect } from 'next/navigation';

export async function logoutAction() {
  await destroySession();
  redirect('/signup');
}

export async function getCurrentUser() {
  return await getSession();
}