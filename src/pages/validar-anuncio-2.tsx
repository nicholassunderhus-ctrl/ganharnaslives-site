import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

const ValidarAnuncio2Page = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // 1. Define o indicador no localStorage para liberar a coleta da segunda missão
    localStorage.setItem('anuncio_bonus_2_liberado', 'true');

    // 2. Redireciona o usuário para a página de missões
    navigate('/dashboard/missoes');
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center text-center p-4">
      <Loader2 className="w-12 h-12 text-primary animate-spin mb-6" />
      <h1 className="text-2xl font-bold text-foreground">Validando sua missão...</h1>
      <p className="text-muted-foreground mt-2">Você será redirecionado em instantes.</p>
    </div>
  );
};

export default ValidarAnuncio2Page;