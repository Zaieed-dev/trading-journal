import { useEffect, useState } from 'react';
import { supabase } from '../utils/supabaseClient';
import { useRouter }   from 'next/router';
import withAuth from '../utils/withAuth';

 function Dashboard() {
  const [user, setUser]         = useState(null);
  const [trades, setTrades]     = useState([]);
  const [loading, setLoading]   = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [editTrade, setEditTrade] = useState(null);   // { id, date, asset, bias, outcome, rr }
  const [saving, setSaving]     = useState(false);
  const router = useRouter();

  // Fetch user & trades
  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return router.replace('/');
      setUser(session.user);

      const { data, error } = await supabase
        .from('trades')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });
      if (!error) setTrades(data);
      setLoading(false);
    };
    init();

    const { data: listener } = supabase.auth.onAuthStateChange((_, session) => {
      if (!session) router.replace('/');
    });
    return () => listener?.subscription?.unsubscribe();
  }, [router]);

  // Helpers
  const logout            = async () => { await supabase.auth.signOut(); router.replace('/'); };
  const gotoChangePassword= () => router.push('/change-password');
  const gotoJournal       = () => router.push('/journal-trade');
  const gotoStats = () => router.push('/statistics');
  const gotoDashboard = () => {};


  const handleDelete = async (id) => {
    if (!confirm('Delete this trade?')) return;
    const { error } = await supabase.from('trades').delete().eq('id', id);
    if (error) return alert(error.message);
    setTrades(trades.filter(t => t.id !== id));
  };

  // Open edit modal, seed form
  const openEdit = (t) => {
    setEditTrade({ ...t });  
  };

  // Handle change in modal form
  const onEditChange = (field, val) => {
    setEditTrade(prev => ({ ...prev, [field]: val }));
  };

  // Save updated trade
  const saveEdit = async () => {
    setSaving(true);
    let { id, date, asset, bias, outcome, rr } = editTrade;
  
    // Enforce RR sign based on outcome
    if (outcome === 'Won' && rr < 0) rr = Math.abs(rr);
    if (outcome === 'Lost' && rr > 0) rr = -rr;
  
    const { error } = await supabase
      .from('trades')
      .update({ date, asset, bias, outcome, rr })
      .eq('id', id);
  
    setSaving(false);
    if (error) {
      alert(error.message);
    } else {
      // Update local state
      setTrades(trades.map(t => t.id === id ? { ...editTrade, rr } : t));
      setEditTrade(null);
    }
  };  

  if (loading) return null;

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Navbar */}
      <header className="bg-white shadow sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-blue-600">Trading Journal</h1>
          <div className="relative">
            <button onClick={() => setMenuOpen(!menuOpen)}
              className="p-2 rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="User menu">☰</button>
            {menuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white border rounded-md shadow-lg">
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
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto px-4 py-8">
          {trades.length === 0
            ? <div className="flex items-center justify-center h-64 text-gray-500">No trades journaled yet.</div>
            : <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                {trades.map(trade => (
                  <div key={trade.id}
                    className="relative bg-white p-6 rounded-lg shadow hover:shadow-md transition flex flex-col"
                  >
                    {/* Delete */}
                    <button onClick={() => handleDelete(trade.id)}
                      className="absolute top-2 right-2 text-red-500 hover:text-red-700"
                      aria-label="Delete trade">🗑️
                    </button>
                    {/* Edit */}
                    <button onClick={() => openEdit(trade)}
                      className="absolute top-2 right-10 text-blue-500 hover:text-blue-700"
                      aria-label="Edit trade">✏️
                    </button>

                    {/* Date & Asset */}
                    <div className="mb-4">
                      <p className="text-sm text-gray-500">{new Date(trade.date).toLocaleDateString()}</p>
                      <h2 className="mt-1 text-xl font-semibold text-gray-800">{trade.asset}</h2>
                    </div>

                    {/* Chart */}
                    {trade.chart_url && <img src={trade.chart_url}
                      alt={`${trade.asset} chart`}
                      className="w-full h-40 object-cover rounded mb-4" />}

                    {/* Details */}
                    <div className="flex-1 space-y-1 text-gray-700 mb-4">
                      <p><strong>Bias:</strong> <span className={trade.bias==='Buy'?'text-green-600':'text-red-600'}>{trade.bias}</span></p>
                      <p><strong>Outcome:</strong> <span className={trade.outcome==='Won'?'text-green-600':'text-red-600'}>{trade.outcome}</span></p>
                      <p><strong>R.R:</strong> <span className={trade.rr>0?'text-green-600':'text-red-600'}>
                        {trade.rr>0?`+${trade.rr}`:`-${Math.abs(trade.rr)}`}
                      </span></p>
                    </div>

                    {/* Proof & Chart Link */}
                    <div className="mb-4">
                      <a href={trade.execution_proof_url} target="_blank" rel="noopener noreferrer"
                        className="text-blue-600 hover:underline text-sm">View Proof</a>
                    </div>
                    <a href={trade.chart_url} target="_blank" rel="noopener noreferrer"
                      className="text-blue-600 hover:underline text-sm mt-auto">View Full Chart</a>
                  </div>
                ))}
              </div>}
        </div>
      </main>

      {/* Edit Modal */}
      {editTrade && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-20">
          <div className="bg-white p-6 rounded shadow-lg w-96">
            <h3 className="text-xl font-semibold mb-4">Edit Trade</h3>
            <label className="block mb-2 text-sm font-medium">Date</label>
            <input type="date" value={editTrade.date}
              onChange={e => onEditChange('date', e.target.value)}
              className="w-full p-2 border rounded mb-4" />

            <label className="block mb-2 text-sm font-medium">Asset</label>
            <input type="text" value={editTrade.asset}
              onChange={e => onEditChange('asset', e.target.value)}
              className="w-full p-2 border rounded mb-4" />

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block mb-2 text-sm">Bias</label>
                <select value={editTrade.bias}
                  onChange={e => onEditChange('bias', e.target.value)}
                  className="w-full p-2 border rounded">
                  <option value="Buy">Buy</option>
                  <option value="Sell">Sell</option>
                </select>
              </div>
              <div>
                <label className="block mb-2 text-sm">Outcome</label>
                <select value={editTrade.outcome}
                  onChange={e => onEditChange('outcome', e.target.value)}
                  className="w-full p-2 border rounded">
                  <option value="Won">Won</option>
                  <option value="Lost">Lost</option>
                </select>
              </div>
            </div>

            <label className="block mb-2 text-sm">R.R</label>
            <input
              type="text"
              value={editTrade.rr}
              onChange={e => {
                const val = e.target.value;
                // Allow only valid numbers and optional minus
                if (/^-?\d*\.?\d*$/.test(val)) {
                  onEditChange('rr', val === '' ? '' : parseFloat(val));
                }
              }}
              className="w-full p-2 border rounded mb-4"
            />


            <div className="flex justify-end space-x-4">
              <button onClick={() => setEditTrade(null)}
                className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300">
                Cancel
              </button>
              <button onClick={saveEdit} disabled={saving}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50">
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
export default withAuth(Dashboard);
