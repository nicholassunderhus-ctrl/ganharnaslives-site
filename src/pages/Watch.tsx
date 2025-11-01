import { useState, useEffect } from "react";
import { Sidebar } from "@/components/Sidebar";
import { toast } from "sonner";
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
            created_at, // Manter created_at se for usar para algo no futuro
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
            created_at: string; // Manter created_at se for usar para algo no futuro
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
          // Opcional: pode ser útil para mostrar o tempo restante
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

    // Assinatura Realtime otimizada para a tabela 'streams'
    const streamsChannel = supabase
      .channel('public:streams')
      .on(
        'postgres_changes',
        {
          event: '*', // Escuta INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'streams',
          filter: 'is_paid=eq.true', // Otimização: só recebe eventos de lives pagas
        },
        (payload) => {
          // Se a live que o usuário está assistindo for finalizada, o outro useEffect cuidará disso.
          // Esta lógica aqui mantém a lista de cards atualizada.
          if (payload.eventType === 'INSERT') {
            const newStream = payload.new as any;
            // Adiciona a nova live na lista se ela estiver 'live'
            if (newStream.status === 'live') {
              setStreams((prevStreams) => [
                ...prevStreams,
                {
                  id: newStream.id,
                  platform: newStream.platform as Platform,
                  streamer: `Streamer #${newStream.user_id.substring(0, 8)}`,
                  title: `Live em ${newStream.platform}`,
                  category: "Ao Vivo",
                  viewers: newStream.current_viewers,
                  currentViewers: newStream.current_viewers,
                  maxViewers: newStream.max_viewers,
                  thumbnailUrl: getDynamicThumbnailUrl(newStream.platform, newStream.stream_url),
                  streamUrl: newStream.stream_url,
                  pointsPerMinute: newStream.points_per_minute,
                  durationMinutes: newStream.duration_minutes,
                  isFull: newStream.current_viewers >= newStream.max_viewers,
                  createdAt: newStream.created_at,
                },
              ]);
            }
          } else if (payload.eventType === 'UPDATE') {
            const updatedStream = payload.new as any;
            // Se a live foi finalizada, remove da lista. Senão, atualiza os dados.
            if (updatedStream.status !== 'live') {
              setStreams((prevStreams) => prevStreams.filter(s => s.id !== updatedStream.id));
            } else {
              setStreams((prevStreams) => prevStreams.map(s => s.id === updatedStream.id ? { ...s, currentViewers: updatedStream.current_viewers, isFull: updatedStream.current_viewers >= updatedStream.max_viewers } : s));
            }
          } else if (payload.eventType === 'DELETE') {
            const deletedStream = payload.old as any;
            setStreams((prevStreams) => prevStreams.filter(s => s.id !== deletedStream.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(streamsChannel);
    };
  }, []);

  // Efeito para redirecionar ou fechar a live quando ela termina.
  useEffect(() => {
    if (!selectedStream) {
      return;
    }

    // Cria um canal de assinatura dedicado APENAS para a stream que o usuário está assistindo.
    const streamSubscription = supabase
      .channel(`stream-${selectedStream.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE', // Escuta apenas por atualizações
          schema: 'public',
          table: 'streams',
          filter: `id=eq.${selectedStream.id}`, // Filtro para receber eventos SOMENTE desta stream
        },
        (payload) => {
          // O payload.new contém os dados da stream após a atualização.
          const updatedStream = payload.new as { id: string; status: string; current_viewers: number; max_viewers: number };

          // Se o status não for mais 'live', a stream terminou.
          if (updatedStream.status !== 'live') {
            toast.info("A live que você estava assistindo terminou.", {
              description: "Procurando a próxima live disponível...",
            });

            // A lista 'streams' no estado já foi atualizada pelo outro listener,
            // que removeu a live finalizada. Agora podemos procurar a próxima com segurança.
            const nextAvailableStream = streams.find(s => s.id !== selectedStream.id && !s.isFull);
            
            if (nextAvailableStream) {
              // Se encontrou, muda para a próxima live.
              setSelectedStream(nextAvailableStream);
            } else {
              // Se não encontrou, fecha o viewer.
              setSelectedStream(null);
            }
          } else {
            // Se a live não terminou, mas foi atualizada (ex: contagem de viewers),
            // atualizamos os dados da live selecionada para refletir na UI do StreamViewer.
            setSelectedStream(prev => prev ? { ...prev, currentViewers: updatedStream.current_viewers, isFull: updatedStream.current_viewers >= updatedStream.max_viewers } : null);
          }
        }
      )
      .subscribe();

    // Função de limpeza: remove a assinatura quando o usuário fecha a live ou é redirecionado.
    // Isso evita múltiplas assinaturas e vazamentos de memória.
    return () => {
      supabase.removeChannel(streamSubscription);
    };
  }, [selectedStream, streams]); // A dependência 'streams' é importante para encontrar a próxima live.

  const handleCloseViewer = () => {
    setSelectedStream(null);
  };

  const filteredStreams = streams.filter(stream => {
      const matchesPlatform = selectedPlatform === "all" || stream.platform === selectedPlatform;
      const matchesSearch = stream.streamer.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         stream.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         stream.category.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesPlatform && matchesSearch;
    })
    .sort((a, b) => { // Ordena as lives para melhor experiência do usuário
      // Prioridade 1: Lives não lotadas vêm antes das lotadas.
      if (a.isFull && !b.isFull) return 1; // 'a' (lotada) vai para o fim
      if (!a.isFull && b.isFull) return -1; // 'a' (não lotada) vem para o início

      // Prioridade 2: Entre lives com o mesmo status (lotada/não lotada), ordena por mais espectadores.
      return b.currentViewers - a.currentViewers;
    });

  const handleWatch = (stream: Stream) => {
    setSelectedStream(stream);
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
        <StreamViewer 
          key={selectedStream.id} // Força a recriação do componente quando a stream muda
          stream={selectedStream}
          onClose={handleCloseViewer}
        />
      )}
    </div>
  );
};

export default Watch;
