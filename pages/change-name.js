import { useState } from 'react';
import { supabase } from '../utils/supabaseClient';
import { useRouter } from 'next/router';
import withAuth from '../utils/withAuth';

 function ChangeName() {
  const [newName, setNewName] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleChangeName = async (e) => {
    e.preventDefault();
    setError('');

    const trimmedName = newName.trim();
    if (!trimmedName) {
      setError('Name cannot be empty');
      return;
    }

    // ✅ Check if name exists
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

    // ✅ Update display name
    const { error: updateError } = await supabase.auth.updateUser({
      data: { display_name: trimmedName }
    });

    if (updateError) {
      setError(updateError.message);
    } else {
      // ✅ Redirect on success
      router.push('/dashboard'); // change to your desired route
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <form
        onSubmit={handleChangeName}
        className="w-full max-w-sm bg-white p-6 rounded-lg shadow-md space-y-6"
      >
        <h2 className="text-2xl font-bold text-center">Change Display Name</h2>

        <div>
          <label htmlFor="newName" className="block text-sm font-medium mb-1">
            New Display Name
          </label>
          <input
            id="newName"
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        {error && <p className="text-red-500 text-sm text-center">{error}</p>}

        <button
          type="submit"
          className="w-full py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Update Name
        </button>
      </form>
    </div>
  );
}

export default withAuth(ChangeName);
