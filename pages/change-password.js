import { useState } from 'react';
import { supabase } from '../utils/supabaseClient';
import { useRouter } from 'next/router';
import withAuth from '../utils/withAuth';

function ChangePassword() {
  const router = useRouter();
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const { error } = await supabase.auth.updateUser({ password: newPassword });

    if (error) {
      setError(error.message || 'Failed to update password.');
    } else {
      setSuccess('Password updated successfully! Redirecting to login...');
      setTimeout(() => router.push('/'), 3000); // Redirect to login page
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <form
        onSubmit={handlePasswordUpdate}
        className="bg-white p-6 rounded shadow-md space-y-4 w-80"
      >
        <h2 className="text-xl font-bold text-center">Set New Password</h2>

        <input
          type="password"
          placeholder="Enter new password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          className="w-full p-2 border rounded"
          required
        />

        {error && <p className="text-red-500 text-sm text-center">{error}</p>}
        {success && <p className="text-green-500 text-sm text-center">{success}</p>}

        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
        >
          Update Password
        </button>
      </form>
    </div>
  );
}

export default withAuth(ChangePassword);