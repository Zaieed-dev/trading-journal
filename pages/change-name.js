import { useEffect, useState } from 'react';
import { supabase } from '../utils/supabaseClient';
import { useRouter } from 'next/router';
import withAuth from '../utils/withAuth';

function ChangeName() {
  const router = useRouter();
  const [newName, setNewName] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [user, setUser] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return router.replace('/');
      setUser({
        ...session.user,
        display_name: session.user.user_metadata?.display_name || '',
      });
    };
    fetchUser();
  }, [router]);

  const handleChangeName = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const trimmedName = newName.trim();
    if (!trimmedName) {
      setError('Name cannot be empty');
      return;
    }

    const { data: nameExists, error: rpcError } = await supabase.rpc(
      'check_display_name_exists',
      { name: trimmedName }
    );

    if (rpcError) {
      setError('Error checking name. Please try again.');
      return;
    }

    if (nameExists) {
      setError('This name is already taken. Please choose a different one.');
      return;
    }

    const { error: updateError } = await supabase.auth.updateUser({
      data: { display_name: trimmedName }
    });

    if (updateError) {
      setError(updateError.message || 'Failed to update name.');
    } else {
      setSuccess('Name updated successfully! Redirecting...');
      setTimeout(() => router.push('/dashboard'), 3000);
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    router.replace('/');
  };

  const gotoDashboard = () => router.push('/dashboard');
  const gotoJournal = () => router.push('/journal-trade');
  const gotoStats = () => router.push('/statistics');
  const gotoChangePassword = () => router.push('/change-password');
  const gotoChangeName = () => {};

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Navbar */}
      <header className="bg-white shadow sticky top-0 z-10 w-full">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-blue-600">
            {user?.display_name ? `${user.display_name}'s Journal` : 'Trading Journal'}
          </h1>
          <div className="relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-2 rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="User menu"
            >
              ☰
            </button>
            {menuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white border rounded-md shadow-lg">
                <button onClick={gotoDashboard} className="w-full px-4 py-2 hover:bg-gray-100">Dashboard</button>
                <button onClick={gotoStats} className="w-full px-4 py-2 hover:bg-gray-100">Statistics</button>
                <button onClick={gotoJournal} className="w-full px-4 py-2 hover:bg-gray-100">Journal Trade</button>
                <button onClick={gotoChangePassword} className="w-full px-4 py-2 hover:bg-gray-100">Change Password</button>
                <button onClick={gotoChangeName} className="w-full px-4 py-2 hover:bg-gray-100">Change Name</button>
                <button onClick={logout} className="w-full px-4 py-2 hover:bg-gray-100">Logout</button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center bg-gray-100">
        <form
          onSubmit={handleChangeName}
          className="bg-white p-6 rounded shadow-md space-y-4 w-80"
        >
          <h2 className="text-xl font-bold text-center">Change Display Name</h2>

          <input
            type="text"
            placeholder="Enter new display name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="w-full p-2 border rounded"
            required
          />

          {error && <p className="text-red-500 text-sm text-center">{error}</p>}
          {success && <p className="text-green-500 text-sm text-center">{success}</p>}

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
          >
            Update Name
          </button>
        </form>
      </main>
    </div>
  );
}

export default withAuth(ChangeName);
