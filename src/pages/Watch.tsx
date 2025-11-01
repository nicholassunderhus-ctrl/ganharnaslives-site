import { useState, useEffect } from "react";
import { Sidebar } from "@/components/Sidebar";
import { MobileNav } from "@/components/MobileNav";
import { MobileHeader } from "@/components/MobileHeader";
import { StreamViewer } from "@/components/StreamViewer";
import { StreamCard } from "@/components/StreamCard";
import { Stream, Platform } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { PlatformIcon } from "@/components/PlatformIcon";
import { useUserPoints } from "@/hooks/useUserPoints";
import { useAdmin } from "@/hooks/useAdmin";
import { supabase } from "@/integrations/supabase/client";
import { getDynamicThumbnailUrl } from "@/lib/stream-utils";

const Watch = () => {
  const { userPoints } = useUserPoints();
  const { isAdmin } = useAdmin();
  const [selectedPlatform, setSelectedPlatform] = useState<Platform | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStream, setSelectedStream] = useState<Stream | null>(null);

  const [streams, setStreams] = useState<Stream[]>([]);
  const [loading, setLoading] = useState(true);

  // Inscrever-se nas atualizações em tempo real
  useEffect(() => {
    // Primeiro, buscar todas as streams ativas
    const fetchStreams = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('streams')
          .select(`
            id,
            user_id,
            platform,
            title,
            category,
            stream_url,
            max_viewers,
            current_viewers,
            duration_minutes,
            created_at,
            points_per_minute
          `)
          .eq('status', 'live')
          .eq('is_paid', true)
          .returns<{
            id: string;
            user_id: string;
            platform: Platform;
            title: string | null;
            category: string | null;
            stream_url: string;
            max_viewers: number;
            current_viewers: number;
            duration_minutes: number;
            created_at: string;
            points_per_minute: number;
          }[]>(); // Adicionado o ponto e vírgula que faltava aqui

        if (error) throw error;

        // Transformar os dados do Supabase para o formato Stream
        const formattedStreams: Stream[] = data.map(stream => ({
          id: stream.id,
          platform: stream.platform as Platform,
          streamer: `Streamer #${stream.user_id.substring(0, 8)}`, // Placeholder
          title: `Live em ${stream.platform}`, // Placeholder para o título
          category: "Ao Vivo", // Placeholder para a categoria
          viewers: stream.current_viewers, // Mantido por compatibilidade
          currentViewers: stream.current_viewers,
          maxViewers: stream.max_viewers,
          thumbnailUrl: getDynamicThumbnailUrl(stream.platform, stream.stream_url),
          streamUrl: stream.stream_url,
          pointsPerMinute: stream.points_per_minute,
          durationMinutes: stream.duration_minutes,
          isFull: stream.current_viewers >= stream.max_viewers,
          // Opcional: pode ser útil para mostrar o tempo restante no futuro
          createdAt: stream.created_at 
        }));

        setStreams(formattedStreams);
      } catch (error) {
        console.error('Erro ao buscar lives:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStreams();

    // Subscrever para atualizações em tempo real da tabela streams
    const subscription = supabase
      .channel('streams_changes')
      .on(
        'postgres_changes',
        {
          event: '*', // Escutar todos os eventos (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'streams'
        },
        async () => {
          // Quando houver qualquer mudança, atualizar a lista
          await fetchStreams();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Efeito para fechar o StreamViewer se a live selecionada não estiver mais ativa
  useEffect(() => {
    if (selectedStream && !loading) {
      // Verifica se a stream selecionada ainda existe na lista de streams ativas
      const isStreamStillActive = streams.some(stream => stream.id === selectedStream.id);
      
      if (!isStreamStillActive) {
        // Se a stream não está mais ativa, fecha o visualizador
        setSelectedStream(null);
      }
    }
  }, [streams, selectedStream, loading]);

  const filteredStreams = streams
    .filter(stream => {
      const matchesPlatform = selectedPlatform === "all" || stream.platform === selectedPlatform;
      const matchesSearch = (stream.streamer?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
                           (stream.title?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
                           (stream.category?.toLowerCase() || '').includes(searchQuery.toLowerCase());
      return matchesPlatform && matchesSearch;
    })
    .sort((a, b) => {
      // Se a live 'a' está lotada e a 'b' não, 'b' vem primeiro.
      if (a.isFull && !b.isFull) return 1;
      // Se a live 'b' está lotada e a 'a' não, 'a' vem primeiro.
      if (!a.isFull && b.isFull) return -1;
      // Se ambas estão no mesmo estado (lotadas ou não), ordena pela maior quantidade
      // de espectadores (ordem decrescente).
      return b.currentViewers - a.currentViewers;
    });

  const handleWatch = (stream: Stream) => {
    setSelectedStream(stream);
  };

  const handleCloseViewer = () => {
    setSelectedStream(null);
  };

  return (
    <div className="min-h-screen bg-background">
      <Sidebar points={userPoints?.points ?? 0} />
      <MobileHeader />
      <MobileNav />
      
      <main className="md:ml-64 ml-0 pt-20 pb-24 md:pb-8 p-4 md:p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold mb-2">Assistir</h1>
            <p className="text-muted-foreground">Escolha uma live e comece a ganhar pontos agora</p>
          </div>

          {/* Filters */}
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por streamer, título ou categoria..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 md:mx-0 md:px-0 md:pb-0">
              <Button
                variant={selectedPlatform === "all" ? "default" : "outline"}
                onClick={() => setSelectedPlatform("all")}
                className="shrink-0"
              >
                Todas
              </Button>
              <Button
                variant={selectedPlatform === Platform.Kick ? "kick" : "outline"}
                onClick={() => setSelectedPlatform(Platform.Kick)}
                className="gap-2 shrink-0"
              >
                <PlatformIcon platform={Platform.Kick} className="w-4 h-4" />
                Kick
              </Button>
              <Button
                variant={selectedPlatform === Platform.YouTube ? "youtube" : "outline"}
                onClick={() => setSelectedPlatform(Platform.YouTube)}
                className="gap-2 shrink-0"
              >
                <PlatformIcon platform={Platform.YouTube} className="w-4 h-4" />
                YouTube
              </Button>
              <Button
                variant={selectedPlatform === Platform.Twitch ? "twitch" : "outline"}
                onClick={() => setSelectedPlatform(Platform.Twitch)}
                className="gap-2 shrink-0"
              >
                <PlatformIcon platform={Platform.Twitch} className="w-4 h-4" />
                Twitch
              </Button>
            </div>
          </div>

          {/* Streams Grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {filteredStreams.map(stream => (
              <StreamCard key={stream.id} stream={stream} onWatch={handleWatch} isAdmin={isAdmin} />
            ))}
          </div>

          {loading ? (
            <div className="text-center py-20">
              <p className="text-muted-foreground text-lg">
                Carregando lives disponíveis...
              </p>
            </div>
          ) : filteredStreams.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-muted-foreground text-lg">
                {searchQuery
                  ? "Nenhuma live encontrada. Tente buscar por outro termo."
                  : "Nenhuma live disponível no momento. As lives aparecerão aqui quando os streamers começarem suas transmissões."}
              </p>
            </div>
          ) : null}
        </div>
      </main>

      {selectedStream && (
        <StreamViewer stream={selectedStream} onClose={handleCloseViewer} />
      )}
    </div>
  );
};

export default Watch;
