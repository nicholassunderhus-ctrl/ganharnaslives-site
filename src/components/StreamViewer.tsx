import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Stream, Platform } from "@/types";
import { PlatformIcon } from "./PlatformIcon";
import { Eye, Clock, Coins, ExternalLink } from "lucide-react";
import { useEarnPoints } from "@/hooks/useEarnPoints";
import { useAuth } from "@/hooks/useAuth";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client"; 
import { getEmbedUrl } from "@/lib/stream-utils";
import LiveStreamPlayer from "./LiveStreamPlayer"; // Importa o novo player

interface StreamViewerProps {
  stream: Stream;
  onClose: () => void;
}

export const StreamViewer = ({ stream, onClose }: StreamViewerProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { earnPoints, loading } = useEarnPoints(); // Agora usa a versão corrigida
  
  const [timeWatched, setTimeWatched] = useState(0);
  const [isWatching, setIsWatching] = useState(false);
  const [earnedPoints, setEarnedPoints] = useState(0);
  const [kickLoginStep, setKickLoginStep] = useState<'initial' | 'verifying' | 'verified'>('initial');

  // Verifica se a URL da stream da Kick é uma URL de streaming válida (.m3u8)
  const isKickStreamValid = stream.platform === Platform.Kick && stream.streamUrl.includes('.m3u8');

  // Para plataformas que não são a Kick, ou se a URL da Kick for inválida, usa o iframe.
  const useIframe = stream.platform !== Platform.Kick || !isKickStreamValid;

  // Converte a URL da stream para a URL de incorporação correta
  const embedUrl = getEmbedUrl(stream.streamUrl, stream.platform);

  // Efeito para gerenciar a contagem de espectadores
  useEffect(() => {
    const updateViewerCount = async (action: 'join' | 'leave') => {
      try {
        await supabase.functions.invoke('update-viewer-count', {
          body: { streamId: stream.id, action },
        });
      } catch (error) {
        console.error(`Erro ao atualizar contagem de viewers (${action}):`, error);
      }
    };

    // Informa que o usuário ENTROU na live
    updateViewerCount('join');

    // Função de limpeza: informa que o usuário SAIU da live quando o componente é desmontado
    return () => {
      updateViewerCount('leave');
    };
    // A dependência vazia [] garante que 'join' rode na montagem e 'leave' na desmontagem.
    // Adicionar stream.id garante que se o stream mudar, a contagem seja ajustada corretamente.
  }, [stream.id]);




  // Efeito para iniciar o ganho de pontos automaticamente.
  useEffect(() => {
    // Se a plataforma não for Kick, ou se a verificação da Kick já passou,
    // inicia o ganho de pontos.
    if (stream.platform !== Platform.Kick || kickLoginStep === 'verified') {
      setIsWatching(true);
    }
  }, [stream.platform, kickLoginStep]);

  // Efeito para registrar o tempo total assistido no dia
  useEffect(() => {
    if (!isWatching) return;

    const watchTimeTracker = setInterval(() => {
        const today = new Date().toDateString();
        const storedDate = localStorage.getItem('watchTimeDate');

        let dailyWatchTime = 0;
        if (storedDate === today) {
            dailyWatchTime = Number(localStorage.getItem('totalWatchTimeToday') || '0');
        } else {
            // Novo dia, reseta o contador
            localStorage.setItem('watchTimeDate', today);
        }

        dailyWatchTime += 1; // Incrementa em um segundo
        localStorage.setItem('totalWatchTimeToday', String(dailyWatchTime));
    }, 1000);

    return () => clearInterval(watchTimeTracker);
  }, [isWatching]);

  useEffect(() => {
    let timeInterval: NodeJS.Timeout | undefined;
    let pointsInterval: NodeJS.Timeout | undefined;

    const attemptToEarnPoints = () => {
      earnPoints(stream.id).then(result => {
        if (result && result.success && result.pointsEarned > 0) {
          setEarnedPoints(prev => prev + result.pointsEarned!);
          // Invalida a query de pontos do usuário para forçar a atualização do saldo na UI
          queryClient.invalidateQueries({ queryKey: ['userPoints', user?.id] });
        } else if (result && !result.success) {
          console.warn("Falha ao ganhar pontos:", result?.error);
        }
      });
    };

    if (isWatching) {
      // Intervalo para atualizar o tempo assistido na tela (a cada segundo)
      timeInterval = setInterval(() => {
        setTimeWatched(prev => prev + 1);
      }, 1000);

      // Chama a função para ganhar pontos imediatamente e depois a cada minuto.
      attemptToEarnPoints();
      pointsInterval = setInterval(attemptToEarnPoints, 60000); // 60000ms = 1 minuto
    }

    return () => {
      if (timeInterval) clearInterval(timeInterval);
      if (pointsInterval) clearInterval(pointsInterval);
    };
  }, [isWatching, earnPoints, queryClient, user?.id, stream.id]);

  // Efeito para verificar periodicamente se a stream ainda está ativa
  useEffect(() => {
    const checkStreamStatus = async () => {
      const { data, error } = await supabase
        .from('streams')
        .select('status')
        .eq('id', stream.id)
        .single();

      if (error || !data || data.status !== 'live') {
        // Se a stream não for encontrada ou não estiver mais 'live', fecha o viewer.
        onClose();
      }
    };

    // Verifica o status a cada 30 segundos para reduzir requisições
    const statusInterval = setInterval(checkStreamStatus, 30000);

    return () => {
      clearInterval(statusInterval);
    };
  }, [stream.id, onClose]);

  const handleStartEarning = () => {
    // Ao clicar, o usuário confirma que está logado e o ganho de pontos começa.
    setKickLoginStep('verified');
    setIsWatching(true);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl bg-background">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <PlatformIcon platform={stream.platform} className="w-6 h-6" />
              <div>
                <h2 className="text-xl font-bold">{stream.title}</h2>
                <p className="text-muted-foreground">{stream.streamer}</p>
              </div>
            </div>
            <Button variant="outline" onClick={onClose}>
              Fechar
            </Button>
          </div>

          <div className="relative aspect-video bg-black rounded-lg mb-4 flex items-center justify-center">
            <iframe
              src={embedUrl}
              // A propriedade abaixo faz com que o iframe ignore cliques
              className="w-full h-full rounded-lg pointer-events-none"
              allowFullScreen
            />
            {/* Esta camada transparente fica sobre o vídeo e bloqueia qualquer interação com o player */}
            <div className="absolute inset-0 w-full h-full" />
          </div>

          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <Badge variant="secondary" className="flex items-center gap-1">
                <Eye className="w-3 h-3" />
                {stream.currentViewers.toLocaleString()}/{stream.maxViewers.toLocaleString()}
              </Badge>
              <Badge variant="secondary" className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {formatTime(timeWatched)}
              </Badge>
              <Badge variant="secondary" className="flex items-center gap-1">
                <Coins className="w-3 h-3" />
                +{earnedPoints} pontos ganhos
              </Badge>
            </div>

            <div className="text-sm text-muted-foreground">
              +{stream.pointsPerMinute} pts/min
            </div>
          </div>

          {/* Lógica de verificação da Kick, sem os botões de iniciar/parar */}
          {stream.platform === Platform.Kick && kickLoginStep !== 'verified' && (
            <div className="w-full text-center p-4 bg-muted/50 rounded-lg space-y-4">
              <p className="text-sm font-medium">Para ganhar pontos, você precisa estar logado na Kick.</p>
              {kickLoginStep === 'initial' && (
                <Button onClick={handleStartEarning} className="w-full">
                  Começar a Ganhar Pontos
                </Button>
              )}
              {/* O passo de verificação foi removido para simplificar o fluxo */}
            </div>
          )}

          {loading && (
            <p className="text-center text-sm text-muted-foreground mt-2">
              Processando pontos...
            </p>
          )}
        </div>
      </Card>
    </div>
  );
};
