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
  // Estado para controlar a verificação de login na Kick
  const [kickLoginStep, setKickLoginStep] = useState<'initial' | 'verifying' | 'verified'>('initial');
  const [verifyButtonEnabled, setVerifyButtonEnabled] = useState(false);


  // Converte a URL da stream para a URL de incorporação correta
  const embedUrl = getEmbedUrl(stream.streamUrl, stream.platform);


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

    // Verifica o status a cada 15 segundos
    const statusInterval = setInterval(checkStreamStatus, 15000);

    return () => {
      clearInterval(statusInterval);
    };
  }, [stream.id, onClose]);

  const handleStartWatching = () => {
    setIsWatching(true);
  };

  const handleStopWatching = () => {
    setIsWatching(false);
  };

  const handleOpenKickLogin = () => {
    window.open('https://kick.com/login', '_blank');
    setKickLoginStep('verifying');
    // Habilita o botão de verificação após 5 segundos
    setTimeout(() => {
      setVerifyButtonEnabled(true);
    }, 5000);
  };

  const handleKickVerification = () => {
    setKickLoginStep('verified');
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
              className="w-full h-full rounded-lg"
              allowFullScreen
            />
          </div>

          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <Badge variant="secondary" className="flex items-center gap-1">
                <Eye className="w-3 h-3" />
                {stream.currentViewers}/{stream.maxViewers}
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

          <div className="flex gap-2">
            {stream.platform === Platform.Kick && kickLoginStep !== 'verified' ? (
              <div className="w-full text-center p-4 bg-muted/50 rounded-lg space-y-4">
                <p className="text-sm font-medium">Para ganhar pontos, você precisa estar logado na Kick.</p>
                {kickLoginStep === 'initial' && (
                  <Button onClick={handleOpenKickLogin} className="w-full">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Fazer Login na Kick
                  </Button>
                )}
                {kickLoginStep === 'verifying' && (
                  <Button onClick={handleKickVerification} disabled={!verifyButtonEnabled} className="w-full">
                    {verifyButtonEnabled ? "Já fiz o login, quero assistir!" : "Aguarde..."}
                  </Button>
                )}
              </div>
            ) : !isWatching ? (
              <Button onClick={handleStartWatching} className="flex-1">
                Começar a Assistir e Ganhar Pontos
              </Button>
            ) : (
              <Button onClick={handleStopWatching} variant="destructive" className="flex-1">
                Parar de Assistir
              </Button>
            )}
          </div>

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
