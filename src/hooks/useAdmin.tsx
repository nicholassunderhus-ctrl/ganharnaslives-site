import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';

// Lista de emails de administradores
const ADMIN_EMAILS = [
  'nicholassunderhus@gmail.com'
  // Adicione seus emails aqui
];

export const useAdmin = () => {
  const { session } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!session) {
      setIsAdmin(false);
      setIsLoading(false);
      return;
    }

    const email = session.user.email;
    setIsAdmin(email ? ADMIN_EMAILS.includes(email) : false);
    setIsLoading(false);
  }, [session]);

  return { isAdmin, isLoading };
};