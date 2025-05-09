import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabaseClient';
import { useRouter } from 'next/router';
import Link from 'next/link';

export default function Index() {
  const router = useRouter();
  const [email, setEmail]         = useState('');
  const [emailError, setEmailError] = useState('');
  const [password, setPassword]   = useState('');
  const [error, setError]         = useState('');

  const validateEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

  useEffect(() => {
    if (!email) setEmailError('');
    else if (!validateEmail(email)) setEmailError('Invalid email address');
    else setEmailError('');
  }, [email]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    if (!validateEmail(email)) {
      setEmailError('Please enter a valid email');
      return;
    }
    const { error: loginError } = await supabase.auth.signInWithPassword({ email, password });
    if (loginError) {
      setError('Invalid email or password');
    } else {
      router.push('/dashboard');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <form onSubmit={handleLogin} className="w-full max-w-sm bg-white p-6 rounded-lg shadow-md space-y-6">
        <h2 className="text-2xl font-bold text-center">Login</h2>

        <div>
          <label htmlFor="email" className="block text-sm font-medium mb-1">Email</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            aria-invalid={emailError ? 'true' : 'false'}
            className={`w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              emailError ? 'border-red-500' : 'border-gray-300'
            }`}
            required
          />
          {emailError && <p className="mt-1 text-red-500 text-sm">{emailError}</p>}
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium mb-1">Password</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="w-full p-2 border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        {error && <p className="text-red-500 text-center text-sm">{error}</p>}

        <button
          type="submit"
          disabled={!!emailError}
          className="w-full py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          Login
        </button>

        <p className="text-center text-sm">
          Don’t have an account?{' '}
          <Link href="/signup" className="text-blue-600 hover:underline">
            Sign Up
          </Link>
        </p>

        <p className="text-center text-sm">
          <button
            type="button"
            onClick={() => router.push('/reset-password')}
            className="text-blue-600 hover:underline focus:outline-none"
          >
            Forgot password?
          </button>
        </p>
      </form>
    </div>
  );
}
