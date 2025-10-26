import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';

// Lista de emails de administradores
const ADMIN_EMAILS = [
  'nicholassunderhus@gmail.com'
  // Adicione seus emails aqui
];

export const useAdmin = () => {
  const session = useAuth.getState().session;
  const { session, loading: authLoading } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!session) {
    if (authLoading) return;

    if (!session?.user?.email) {
      setIsAdmin(false);
      setIsLoading(false);
      return;
    }

    const email = session.user.email;
    setIsAdmin(email ? ADMIN_EMAILS.includes(email) : false);
    setIsLoading(false);
  }, [session]);
    setIsAdmin(ADMIN_EMAILS.includes(session.user.email));
  }, [session, authLoading]);

  return { isAdmin, isLoading };
  return { isAdmin, isLoading: authLoading };
};