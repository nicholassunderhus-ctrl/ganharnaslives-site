import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';

// Lista de emails de administradores
const ADMIN_EMAILS = [
  'nicholassunderhus@gmail.com'
  // Adicione seus emails aqui
];

export const useAdmin = () => {
  const { session, loading: authLoading } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (authLoading) return;

    if (!session?.user?.email) {
      setIsAdmin(false);
      return;
    }

    setIsAdmin(ADMIN_EMAILS.includes(session.user.email));
  }, [session, authLoading]);

  return { isAdmin, isLoading: authLoading };
};