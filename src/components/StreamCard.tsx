import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Stream } from "@/types";
import { PlatformIcon } from "./PlatformIcon";
import { Eye, Clock, Users } from "lucide-react";
import { Input } from "./ui/input";
import { supabase } from "@/integrations/supabase/client";

interface StreamCardProps {
  stream: Stream;
  onWatch: (stream: Stream) => void;
  isAdmin?: boolean;
}

export const StreamCard = ({ stream, onWatch, isAdmin = false }: StreamCardProps) => {
  const [viewersInput, setViewersInput] = useState(stream.currentViewers.toString());

  useEffect(() => {
    setViewersInput(stream.currentViewers.toString());
  }, [stream.currentViewers]);

  const getPlatformColor = () => {
    switch (stream.platform) {
      case "Kick":
        return "text-[hsl(var(--kick-green))]";
      case "Twitch":
        return "text-[hsl(var(--twitch-purple))]";
      case "YouTube":
        return "text-[hsl(var(--youtube-red))]";
    }
  };

  const updateViewers = async (streamId: string) => {
    const newValue = parseInt(viewersInput);
    if (isNaN(newValue) || newValue < 0) return;

    try {
      const { error } = await supabase
        .from('streams')
        .update({ current_viewers: newValue })
        .eq('id', streamId);

      if (error) throw error;

    } catch (error) {
      console.error('Erro ao atualizar viewers:', error);
    }
  };

  return (
    <Card className="overflow-hidden group hover:shadow-[var(--shadow-card)] transition-all hover:-translate-y-1">
      <div className="relative aspect-video overflow-hidden cursor-pointer" onClick={() => onWatch(stream)}>
        <img
          src={stream.thumbnailUrl}
          alt={stream.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute top-2 left-2">
          <Badge variant="destructive" className="bg-red-600">
            <div className="w-2 h-2 rounded-full bg-white mr-1 animate-pulse" />
            AO VIVO
          </Badge>
        </div>
        <div className="absolute top-2 right-2 flex flex-col gap-1">
          <div className="bg-black/70 rounded px-2 py-1 flex items-center gap-1">
            <Eye className="w-3 h-3" />
            <span className="text-xs font-semibold">
              {stream.currentViewers}/{stream.maxViewers}
            </span>
          </div>
          <div className="bg-black/70 rounded px-2 py-1 text-xs font-medium whitespace-nowrap">
            {stream.durationMinutes} minutos
          </div>
        </div>
      </div>

      <div className="p-4 space-y-3">
        <div className="flex items-start gap-3">
          <div className={cn("mt-1", getPlatformColor())}>
            <PlatformIcon platform={stream.platform} className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm line-clamp-2 mb-1">{stream.title}</h3>
            <p className="text-muted-foreground text-sm">{stream.streamer}</p>
            <p className="text-muted-foreground text-xs mt-1">{stream.category}</p>
          </div>
        </div>

        {isAdmin && (
          <div className="space-y-2 pt-2 border-t border-dashed">
            <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">Controle de Viewers (Admin)</span>
            </div>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min="0"
                max={stream.maxViewers}
                value={viewersInput}
                onChange={(e) => setViewersInput(e.target.value)}
                className="max-w-[120px] h-8"
              />
              <Button 
                variant="secondary"
                size="sm"
                onClick={() => updateViewers(stream.id)}
                disabled={viewersInput === stream.currentViewers.toString()}
                className="h-8"
              >
                Atualizar
              </Button>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between pt-2 border-t border-border">
          <div className="flex items-center gap-1 text-primary">
            <Clock className="w-4 h-4" />
            <span className="text-sm font-semibold">+{stream.pointsPerMinute} pts/min</span>
          </div>
          <Button 
            size="sm" 
            variant={stream.isFull ? "outline" : "gradient"} 
            onClick={() => !stream.isFull && onWatch(stream)}
            disabled={stream.isFull}
          >
            {stream.isFull ? "Lotado" : "Assistir"}
          </Button>
        </div>
      </div>
    </Card>
  );
};

const cn = (...classes: string[]) => classes.filter(Boolean).join(" ");