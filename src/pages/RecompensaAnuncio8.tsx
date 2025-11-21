import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

const RecompensaAnuncio8Page = () => {
  const navigate = useNavigate();

  useEffect(() => {
    localStorage.setItem('anuncio_bonus_8_liberado', 'true');
    const timer = setTimeout(() => {
      navigate('/dashboard/missoes');
    }, 500);
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center text-center p-4">
      <Loader2 className="w-12 h-12 text-primary animate-spin mb-6" />
      <h1 className="text-2xl font-bold text-foreground">Validando sua missão...</h1>
      <p className="text-muted-foreground mt-2">Você será redirecionado em instantes.</p>
    </div>
  );
};

export default RecompensaAnuncio8Page;