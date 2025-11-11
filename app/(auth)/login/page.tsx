'use client';

import AuthForm from '@/app/components/AuthForm';
import { loginAction } from './actions';

export default function LoginPage() {
  return <AuthForm mode="login" onSubmit={loginAction} />;
}
