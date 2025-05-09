import { useEffect, useState } from 'react';
import { supabase } from '../utils/supabaseClient';
import { useRouter } from 'next/router';
import withAuth from '../utils/withAuth';

function Statistics() {
  const [user, setUser]         = useState(null);
  const [trades, setTrades]     = useState([]);
  const [loading, setLoading]   = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return router.replace('/');
      setUser(session.user);

      const { data, error } = await supabase
        .from('trades')
        .select('*')
        .eq('user_id', session.user.id);
      if (!error) setTrades(data);
      setLoading(false);
    };
    init();

    const { data: listener } = supabase.auth.onAuthStateChange((_, session) => {
      if (!session) router.replace('/');
    });
    return () => listener?.subscription?.unsubscribe();
  }, [router]);

  const logout            = async () => { await supabase.auth.signOut(); router.replace('/'); };
  const gotoChangePassword= ()    => router.push('/change-password');
  const gotoJournal       = ()    => router.push('/journal-trade');
  const gotoDashboard     = ()    => router.push('/dashboard');
  const gotoStats         = ()    => router.push('/statistics');

  if (loading) return null;

  // Compute metrics
  const total   = trades.length;
  const wins    = trades.filter(t => t.outcome === 'Won').length;
  const losses  = trades.filter(t => t.outcome === 'Lost').length;
  const winRate = total ? ((wins / total) * 100).toFixed(1) : '0.0';

  const sumRR     = trades.reduce((sum, t) => sum + Number(t.rr), 0);
  const avgRR     = total ? (sumRR / total).toFixed(2) : '0.00';

  const sumRRWin  = trades
    .filter(t => t.outcome === 'Won')
    .reduce((sum, t) => sum + Number(t.rr), 0);
  const avgRRWin  = wins ? (sumRRWin / wins).toFixed(2) : '0.00';

  const sumRRLoss = trades
    .filter(t => t.outcome === 'Lost')
    .reduce((sum, t) => sum + Number(t.rr), 0);
  const avgRRLoss = losses ? (sumRRLoss / losses).toFixed(2) : '0.00';

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Navbar */}
      <header className="bg-white shadow sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-blue-600">Trading Journal</h1>
          <div className="relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-2 rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="User menu"
            >
              ☰
            </button>
            {menuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white border rounded-md shadow-lg overflow-hidden">
                <button onClick={gotoDashboard} className="w-full px-4 py-2 hover:bg-gray-100">Dashboard</button>
                <button onClick={gotoStats} className="w-full px-4 py-2 hover:bg-gray-100">Statistics</button>
                <button onClick={gotoJournal} className="w-full px-4 py-2 hover:bg-gray-100">Journal Trade</button>
                <button onClick={gotoChangePassword} className="w-full px-4 py-2 hover:bg-gray-100">Change Password</button>
                <button onClick={logout} className="w-full px-4 py-2 hover:bg-gray-100">Logout</button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto py-8">
        <div className="max-w-4xl mx-auto px-4 space-y-8">
          <h2 className="text-3xl font-bold text-center text-gray-800">Statistics</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Total Trades */}
            <div className="bg-white p-6 rounded-lg shadow text-center">
              <p className="text-sm text-gray-500">Total Trades</p>
              <p className="mt-2 text-2xl font-semibold">{total}</p>
            </div>

            {/* Wins / Losses */}
            <div className="bg-white p-6 rounded-lg shadow text-center">
              <p className="text-sm text-gray-500">Wins / Losses</p>
              <p className="mt-2 text-2xl font-semibold">
                <span className="text-green-600">{wins}</span>{' '}
                /{' '}
                <span className="text-red-600">{losses}</span>
              </p>
            </div>

            {/* Win Rate */}
            <div className="bg-white p-6 rounded-lg shadow text-center">
              <p className="text-sm text-gray-500">Win Rate</p>
              <p className="mt-2 text-2xl font-semibold">{winRate}%</p>
            </div>

            {/* Avg. R.R. (All) */}
            <div className="bg-white p-6 rounded-lg shadow text-center">
              <p className="text-sm text-gray-500">Avg. R.R. (All)</p>
              <p
                className={`mt-2 text-2xl font-semibold ${
                  avgRR > 0 ? 'text-green-600' : avgRR < 0 ? 'text-red-600' : ''
                }`}
              >
                {avgRR}
              </p>
            </div>

            {/* Avg. R.R. (Wins) */}
            <div className="bg-white p-6 rounded-lg shadow text-center">
              <p className="text-sm text-gray-500">Avg. R.R. (Wins)</p>
              <p className="mt-2 text-2xl font-semibold text-green-600">
                {avgRRWin}
              </p>
            </div>

            {/* Avg. R.R. (Losses) */}
            <div className="bg-white p-6 rounded-lg shadow text-center">
              <p className="text-sm text-gray-500">Avg. R.R. (Losses)</p>
              <p className="mt-2 text-2xl font-semibold text-red-600">
                {avgRRLoss}
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default withAuth(Statistics);
