import { useEffect, useState } from 'react';
import { supabase } from '../utils/supabaseClient';
import { useRouter } from 'next/router';
import { v4 as uuidv4 } from 'uuid';
import withAuth from '../utils/withAuth';

 function JournalTrade() {
  const [date, setDate] = useState('');
  const [asset, setAsset] = useState('');
  const [bias, setBias] = useState('');
  const [outcome, setOutcome] = useState('');
  const [rr, setRr] = useState('');
  const [chart, setChart] = useState(null);
  const [executionProof, setExecutionProof] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [user, setUser] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const fetchSession = async () => {
      const { data, error } = await supabase.auth.getSession();
      if (data?.session) {
        setUser(data.session.user);
      } else {
        router.push('/');
      }
    };

    fetchSession();

    const { data: authListener } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      if (authListener?.subscription) {
        authListener.subscription.unsubscribe();
      }
    };
  }, [router]);

  const validateForm = () => {
    setError('');
    if (!date || !asset || !bias || !outcome || !rr || !chart || !executionProof) {
      setError('All fields are required!');
      return false;
    }
    if (isNaN(rr)) {
      setError('R.R must be a valid number!');
      return false;
    }
    if (outcome === 'Lost' && rr > 0) {
        setError('A "Lost" outcome cannot have a positive R.R value.');
        return false;
    }
    if (outcome === 'Won' && rr < 0) {
        setError('A "Won" outcome cannot have a negative R.R value.');
        return false;
    }
    if (isNaN(parseFloat(rr))) {
      setError('R.R must be a valid number!');
      return false;
    }    
    return true;
  };

  const uploadFile = async (file, path) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${uuidv4()}.${fileExt}`;
    const filePath = `${path}/${fileName}`;

    let { error: uploadError } = await supabase.storage
      .from('trade-images')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data } = supabase.storage.from('trade-images').getPublicUrl(filePath);
    return data.publicUrl;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      const chartUrl = await uploadFile(chart, 'charts');
      const executionUrl = await uploadFile(executionProof, 'executions');
      const numericRr = parseFloat(rr);

      const { data, error } = await supabase
        .from('trades')
        .insert([
          {
            date,
            asset,
            bias,
            outcome,
            rr: numericRr,
            chart_url: chartUrl,
            execution_proof_url: executionUrl,
            user_id: user.id,
          },
        ]);

      if (error) {
        setError(error.message);
        setSuccess('');
      } else {
        setSuccess('Trade successfully added!');
        router.push('/dashboard');
      }
    } catch (uploadErr) {
      setError('File upload failed: ' + uploadErr.message);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-lg">
      <h1 className="text-3xl font-bold text-center mb-6">Journal Your Trade</h1>

      {error && <div className="text-red-500 text-center mb-4">{error}</div>}
      {success && <div className="text-green-500 text-center mb-4">{success}</div>}

      <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-lg shadow-md">
        <div>
          <label className="block text-lg font-medium mb-2" htmlFor="date">Date</label>
          <input type="date" id="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full p-3 border rounded-md" required />
        </div>

        <div>
          <label className="block text-lg font-medium mb-2" htmlFor="asset">Asset</label>
          <input type="text" id="asset" value={asset} onChange={(e) => setAsset(e.target.value)} className="w-full p-3 border rounded-md" required />
        </div>

        <div>
          <label className="block text-lg font-medium mb-2" htmlFor="bias">Bias</label>
          <select id="bias" value={bias} onChange={(e) => setBias(e.target.value)} className="w-full p-3 border rounded-md" required>
            <option value="">Select Bias</option>
            <option value="Buy">Buy</option>
            <option value="Sell">Sell</option>
          </select>
        </div>

        <div>
          <label className="block text-lg font-medium mb-2" htmlFor="outcome">Outcome</label>
          <select
            id="outcome"
            value={outcome}
            onChange={(e) => {
              const selectedOutcome = e.target.value;
              setOutcome(selectedOutcome);

              if (selectedOutcome === 'Lost' && rr && !rr.startsWith('-')) {
                setRr('-' + rr);
              } else if (selectedOutcome === 'Won' && rr.startsWith('-')) {
                setRr(rr.substring(1)); // remove the minus for wins
              }
            }}
            className="w-full p-3 border rounded-md"
            required
          >
            <option value="">Select Outcome</option>
            <option value="Won">Won</option>
            <option value="Lost">Lost</option>
          </select>

        </div>

        <div>
          <label className="block text-lg font-medium mb-2" htmlFor="rr">R.R</label>
          <input
            type="text"
            id="rr"
            value={rr}
            onChange={(e) => {
              const val = e.target.value;
              if (/^-?\d*\.?\d*$/.test(val)) {
                setRr(val);
              }
            }}
            className="w-full p-3 border rounded-md"
            required
          />
        </div>

        <div>
          <label className="block text-lg font-medium mb-2" htmlFor="chart">Chart Image</label>
          <input type="file" id="chart" onChange={(e) => setChart(e.target.files[0])} className="w-full p-3 border rounded-md" accept="image/*" required />
        </div>

        <div>
          <label className="block text-lg font-medium mb-2" htmlFor="executionProof">Execution Proof</label>
          <input type="file" id="executionProof" onChange={(e) => setExecutionProof(e.target.files[0])} className="w-full p-3 border rounded-md" accept="image/*" required />
        </div>

        <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-md mt-6 hover:bg-blue-700">
          Submit Trade
        </button>
      </form>
    </div>
  );
}
export default withAuth(JournalTrade);
