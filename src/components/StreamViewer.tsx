import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Stream, Platform } from "@/types";
import { PlatformIcon } from "./PlatformIcon";
import { Eye, Clock, Coins, Loader2 } from "lucide-react";
import { useEarnPoints } from "@/hooks/useEarnPoints";
import { useAuth } from "@/hooks/useAuth";
import { useQueryClient } from "@tanstack/react-query";
import { getEmbedUrl } from "@/lib/stream-utils";
import { Input } from "./ui/input";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

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
  const [kickUsername, setKickUsername] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Verifica se o usuário já conectou a conta Kick
  const isKickConnected = useMemo(() => {
    return !!user?.user_metadata?.kick_username;
  }, [user]);

  // Preenche o campo com o nome de usuário do Kick se já existir
  useEffect(() => {
    if (isKickConnected) {
      setKickUsername(user.user_metadata.kick_username);
    }
  }, [isKickConnected, user]);


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
    let timeInterval: NodeJS.Timeout | undefined;
    let pointsInterval: NodeJS.Timeout | undefined;

    if (isWatching) {
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
    }

    return () => {
      if (timeInterval) clearInterval(timeInterval);
      if (pointsInterval) clearInterval(pointsInterval);
    };
  }, [isWatching, earnPoints, queryClient, user?.id, stream.id]);

  const handleStartWatching = () => {
    setIsWatching(true);
  };

  const handleStopWatching = () => {
    setIsWatching(false);
  };

  const handleSaveKickUsername = async () => {
    if (!kickUsername.trim()) {
      toast.error("Por favor, insira seu nome de usuário do Kick.");
      return;
    }
    setIsSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({
        data: { kick_username: kickUsername.trim() },
      });
      if (error) throw error;
      toast.success("Nome de usuário do Kick salvo com sucesso!");
      // A UI será atualizada automaticamente porque o hook `useAuth` detectará a mudança no `user`
    } catch (error: any) {
      toast.error("Erro ao salvar nome de usuário.", {
        description: error.message,
      });
    } finally {
      setIsSaving(false);
    }
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
            {stream.platform === Platform.Kick && !isKickConnected ? (
              <div className="flex-1 flex w-full gap-2">
                <Input
                  placeholder="Seu usuário do Kick"
                  value={kickUsername}
                  onChange={(e) => setKickUsername(e.target.value)}
                  disabled={isSaving}
                  className="flex-1"
                />
                <Button onClick={handleSaveKickUsername} disabled={isSaving}>
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Salvar e Assistir"}
                </Button>
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
