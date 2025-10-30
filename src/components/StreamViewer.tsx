import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Stream } from "@/types";
import { PlatformIcon } from "./PlatformIcon";
import { Eye, Clock, Coins } from "lucide-react";
import { useEarnPoints } from "@/hooks/useEarnPoints";
import { useAuth } from "@/hooks/useAuth";
import { getEmbedUrl } from "@/lib/stream-utils";
import { supabase } from "@/integrations/supabase/client";

interface StreamViewerProps {
  stream: Stream;
  onClose: () => void;
}

export const StreamViewer = ({ stream, onClose }: StreamViewerProps) => {
  const { user } = useAuth();
  const { earnPoints, loading } = useEarnPoints();
  const [timeWatched, setTimeWatched] = useState(0);
  const [isWatching, setIsWatching] = useState(false);
  const [earnedPoints, setEarnedPoints] = useState(0);
  const [lastEarnTime, setLastEarnTime] = useState<number>(0);

  // Converte a URL da stream para a URL de incorporação correta
  const embedUrl = getEmbedUrl(stream.streamUrl, stream.platform);

  // Efeito para registrar que o usuário está assistindo
  useEffect(() => {
    if (!user) return;

    const joinStream = async () => {
      await supabase
        .from('stream_viewers')
        .upsert({ stream_id: stream.id, user_id: user.id });
    };

    const leaveStream = async () => {
      await supabase
        .from('stream_viewers')
        .delete()
        .match({ stream_id: stream.id, user_id: user.id });
    };

    joinStream();

    // Quando o componente for desmontado (usuário fechar), remove o registro
    return () => {
      leaveStream();
    };
  }, [stream.id, user]);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isWatching) {
      interval = setInterval(() => {
        setTimeWatched(prev => prev + 1);

        // Earn points every minute (60 seconds)
        const now = Date.now();
        if (now - lastEarnTime >= 60000) { // 60 seconds
          earnPoints(1).then(result => {
            if (result.success) {
              setEarnedPoints(prev => prev + result.pointsEarned!);
              setLastEarnTime(now);
            } else {
              console.warn("Failed to earn points:", result.error);
            }
          });
        }
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isWatching, lastEarnTime, earnPoints]);

  const handleStartWatching = () => {
    setIsWatching(true);
    setLastEarnTime(Date.now());
  };

  const handleStopWatching = () => {
    setIsWatching(false);
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

          <div className="aspect-video bg-black rounded-lg mb-4 flex items-center justify-center">
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
            {!isWatching ? (
              <Button onClick={handleStartWatching} className="flex-1">
                Começar a Assistir e Ganhar Pontos
              </Button>
            ) : (
              <Button onClick={handleStopWatching} variant="outline" className="flex-1">
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
