import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from './supabaseClient';

export default function withAuth(Component) {
  return function ProtectedRoute(props) {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);

    useEffect(() => {
      const getSession = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          router.push('/'); // redirect to login
        } else {
          setUser(session.user);
          setLoading(false);
        }
      };
      getSession();
    }, []);

    if (loading) return <p className="text-center mt-20">Loading...</p>;

    return <Component {...props} user={user} />;
  };
}
