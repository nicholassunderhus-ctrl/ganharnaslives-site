import { useState, useEffect, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Stream } from "@/types";
import { PlatformIcon } from "./PlatformIcon";
import { Eye, Clock, Coins, MessageSquare, X } from "lucide-react";
import { useEarnPoints } from "@/hooks/useEarnPoints";
import { useAuth } from "@/hooks/useAuth";
import { useQueryClient } from "@tanstack/react-query";
import { getEmbedUrl } from "@/lib/stream-utils";
import { StreamChat } from "./StreamChat";
import ReactPlayer from "react-player";

interface StreamViewerProps {
  stream: Stream;
  onClose: () => void; // Chamado quando o usuário fecha manualmente
}

export const StreamViewer = ({ stream, onClose }: StreamViewerProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { earnPoints, loading } = useEarnPoints(); // Agora usa a versão corrigida
  const [timeWatched, setTimeWatched] = useState(0); // Começa em 0
  const [isChatVisible, setIsChatVisible] = useState(true);
  const [earnedPoints, setEarnedPoints] = useState(0);

  useEffect(() => {
    let timeInterval: NodeJS.Timeout | undefined;
    let pointsInterval: NodeJS.Timeout | undefined;

    // Intervalo para atualizar o tempo assistido na tela (a cada segundo)
    timeInterval = setInterval(() => {
      setTimeWatched(prev => prev + 1);
    }, 1000);

    // Intervalo para ganhar pontos (a cada minuto)
    pointsInterval = setInterval(() => {
      earnPoints(stream.id).then(result => {
        if (result && result.success) {
          setEarnedPoints(prev => prev + result.pointsEarned!);
          // Invalida a query de pontos do usuário para forçar a atualização do saldo na UI
          queryClient.invalidateQueries({ queryKey: ['userPoints', user?.id] });
        } else {
          console.warn("Falha ao ganhar pontos:", result?.error);
        }
      });
    }, 60000); // 60000ms = 1 minuto

    return () => {
      if (timeInterval) clearInterval(timeInterval);
      if (pointsInterval) clearInterval(pointsInterval);
    }; // A dependência vazia [] faz com que o efeito rode apenas uma vez na montagem
  }, [earnPoints, queryClient, user?.id, stream.id]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="relative w-full h-full max-w-6xl max-h-[90vh] bg-background shadow-2xl rounded-lg overflow-hidden">
        <div className="flex w-full h-full">
          <div className="flex-1 h-full bg-black">
            <ReactPlayer
              url={stream.streamUrl}
              playing={true}
              width="100%"
              height="100%"
              controls={true} // Habilitar controles nativos para melhor UX
              config={{
                youtube: { playerVars: { autoplay: 1 } },
                twitch: { options: { parent: [window.location.hostname] } },
              }}
            />
          </div>

          {isChatVisible && (
            <div className="w-[340px] h-full hidden lg:block">
              <StreamChat platform={stream.platform} streamUrl={stream.streamUrl} />
            </div>
          )}
        </div>
        {/* Controles sobrepostos */}
        <div className="absolute top-0 left-0 right-0 p-2 flex justify-between items-start bg-gradient-to-b from-black/50 to-transparent">
          <div className="flex items-center gap-2">
            <button onClick={onClose} className="text-white hover:bg-white/20 p-2 rounded-full transition-colors">
              <X className="w-6 h-6" />
            </button>
            <button
              onClick={() => setIsChatVisible(!isChatVisible)}
              className="text-white hover:bg-white/20 p-2 rounded-full transition-colors hidden lg:inline-flex"
            >
              <MessageSquare className="w-5 h-5" />
            </button>
          </div>
          <Badge variant="destructive" className="bg-red-600/90">
            <div className="w-2 h-2 rounded-full bg-white mr-1.5 animate-pulse" />
            AO VIVO
          </Badge>
        </div>

        <div className="absolute bottom-4 left-4 right-4 flex flex-col gap-4">
          <div className="flex items-center justify-between text-white drop-shadow-md">
             <div className="flex items-center gap-4">
               <Badge variant="secondary" className="flex items-center gap-1.5 bg-black/60 border-none text-white">
                 <Eye className="w-4 h-4" />
                 {stream.currentViewers}/{stream.maxViewers}
               </Badge>
               <Badge variant="secondary" className="flex items-center gap-1.5 bg-black/60 border-none text-white">
                 <Clock className="w-4 h-4" />
                 {formatTime(timeWatched)}
               </Badge>
               <Badge variant="secondary" className="flex items-center gap-1.5 bg-black/60 border-none text-white">
                 <Coins className="w-4 h-4 text-primary" />
                 +{earnedPoints}
               </Badge>
             </div>
             <div className="text-sm font-semibold text-primary drop-shadow-lg">
               +{stream.pointsPerMinute} pts/min
             </div>
          </div>

          {loading && (
            <p className="text-center text-sm text-muted-foreground mt-2">
              Processando pontos...
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
