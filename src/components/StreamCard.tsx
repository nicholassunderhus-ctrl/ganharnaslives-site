import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Stream } from "@/types";
import { PlatformIcon } from "./PlatformIcon";
import { Eye, Clock, Coins, XCircle } from "lucide-react";
import { formatDuration } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface StreamCardProps {
  stream: Stream;
  onWatch: (stream: Stream) => void;
  isAdmin: boolean;
}

export const StreamCard = ({ stream, onWatch, isAdmin }: StreamCardProps) => {
  const [remainingMinutes, setRemainingMinutes] = useState(0);

  useEffect(() => {
    const calculateRemainingTime = () => {
      const endTime = new Date(stream.createdAt).getTime() + stream.durationMinutes * 60000;
      const now = Date.now();
      const remainingMs = Math.max(0, endTime - now);
      setRemainingMinutes(Math.floor(remainingMs / 60000));
    };

    calculateRemainingTime();
    const interval = setInterval(calculateRemainingTime, 60000); // Atualiza a cada minuto

    return () => clearInterval(interval);
  }, [stream.createdAt, stream.durationMinutes]);

  const handleEndStream = async () => {
    if (!isAdmin) return;

    const { error } = await supabase
      .from('streams')
      .update({ status: 'ended' })
      .eq('id', stream.id);

    if (error) {
      toast.error("Erro ao encerrar a live.", { description: error.message });
    } else {
      toast.success("Live encerrada com sucesso.");
    }
  };

  return (
    <Card className="overflow-hidden group flex flex-col">
      <div className="relative">
        <img
          src={stream.thumbnailUrl}
          alt={stream.title || "Live thumbnail"}
          className="aspect-video object-cover w-full"
        />
        <div className="absolute top-2 left-2">
          <Badge variant="destructive" className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
            AO VIVO
          </Badge>
        </div>
        <div className="absolute top-2 right-2">
          <PlatformIcon platform={stream.platform} className="w-6 h-6" />
        </div>
      </div>

      <div className="p-4 flex-grow flex flex-col">
        <h3 className="font-bold truncate" title={stream.title || "Live"}>{stream.title || "Live"}</h3>
        <p className="text-sm text-muted-foreground truncate">{stream.streamer}</p>

        <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
          <div className="flex items-center gap-1" title="Espectadores">
            <Eye className="w-4 h-4" />
            <span>{stream.currentViewers}/{stream.maxViewers}</span>
          </div>
          <div className="flex items-center gap-1" title="Tempo restante">
            <Clock className="w-4 h-4" />
            <span>{formatDuration(remainingMinutes)}</span>
          </div>
          <div className="flex items-center gap-1" title="Pontos por minuto">
            <Coins className="w-4 h-4" />
            <span>+{stream.pointsPerMinute}</span>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t flex-grow flex items-end">
          <Button onClick={() => onWatch(stream)} className="w-full" disabled={stream.isFull}>
            {stream.isFull ? "Live Cheia" : "Assistir e Ganhar"}
          </Button>
          {isAdmin && (
            <Button onClick={handleEndStream} variant="ghost" size="icon" className="ml-2 text-muted-foreground hover:text-destructive">
              <XCircle className="w-5 h-5" />
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
};