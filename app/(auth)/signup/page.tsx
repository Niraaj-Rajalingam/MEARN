'use client';

import AuthForm from '@/app/components/AuthForm';
import { signUpAction } from './actions';

export default function SignupPage() {
  return <AuthForm mode="signup" onSubmit={signUpAction} />;
}
