import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

const RecompensaVerAnunciosPage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // 1. Define um indicador específico para a missão "Ver Anuncios"
    localStorage.setItem('anuncio_ver_anuncios_liberado', 'true');

    // 2. Redireciona o usuário de volta para a página de missões
    const timer = setTimeout(() => {
      navigate('/dashboard/missions');
    }, 1500);

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

export default RecompensaVerAnunciosPage;
