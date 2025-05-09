import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabaseClient';
import { useRouter } from 'next/router';
import Link from 'next/link';

export default function SignUp() {
  const router = useRouter();

  const [email, setEmail]         = useState('');
  const [emailError, setEmailError] = useState('');
  const [password, setPassword]   = useState('');
  const [error, setError]         = useState('');
  const [success, setSuccess]     = useState('');

  const validateEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

  useEffect(() => {
    if (!email) setEmailError('');
    else if (!validateEmail(email)) setEmailError('Invalid email address');
    else setEmailError('');
  }, [email]);

  const handleSignUp = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!validateEmail(email)) {
      setEmailError('Please enter a valid email');
      return;
    }

    // Attempt sign-up
    const { data, error: signUpError } = await supabase.auth.signUp({ email, password });

    if (signUpError) {
      // If Supabase throws a duplicate‑email error
      const msg = signUpError.message.toLowerCase();
      const exists = /already registered|duplicate|user already exists/.test(msg);
      if (exists) {
        setError('User already exists. Please log in instead.');
      } else {
        setError(signUpError.message);
      }
    } else {
      // No error — but must check for the "fake" user object case
      // If identities is empty, Supabase is telling us the email already exists
      if (data.user?.identities?.length === 0) {
        setError('User already exists. Please log in instead.');
      } else {
        // Truly a new user
        setSuccess('Sign‑up successful! Please check your email to confirm and then log in.');
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <form
        onSubmit={handleSignUp}
        className="w-full max-w-sm bg-white p-6 rounded-lg shadow-md space-y-6"
      >
        <h2 className="text-2xl font-bold text-center">Sign Up</h2>

        {/* Email Field */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium mb-1">
            Email
          </label>
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

        {/* Password Field */}
        <div>
          <label htmlFor="password" className="block text-sm font-medium mb-1">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="w-full p-2 border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        {/* Feedback Messages */}
        {error && <p className="text-red-500 text-center text-sm">{error}</p>}
        {success && <p className="text-green-600 text-center text-sm">{success}</p>}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={!!emailError}
          className="w-full py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          Sign Up
        </button>

        {/* Link to Login */}
        <p className="text-center text-sm">
          Already have an account?{' '}
          <Link href="/" className="text-blue-600 hover:underline">
            Login
          </Link>
        </p>
      </form>
    </div>
  );
}
