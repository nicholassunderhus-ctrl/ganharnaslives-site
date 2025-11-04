import { useState, useMemo } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlatformIcon } from "@/components/PlatformIcon";
import { Platform } from "@/types";
import { useUserPoints } from "@/hooks/useUserPoints";
import { Badge } from "@/components/ui/badge";
import { Link as LinkIcon, Users, Loader2, Clock, DollarSign } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const POINTS_PER_MINUTE_PER_VIEWER = 1;

const MyStreams = () => {
  const { userPoints } = useUserPoints();
  const navigate = useNavigate();
  const [selectedPlatform, setSelectedPlatform] = useState<Platform | null>(null);
  const [liveLink, setLiveLink] = useState("");
  const [maxQuantity, setMaxQuantity] = useState("");  
  const [selectedDuration, setSelectedDuration] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const cost = useMemo(() => {
    const quantity = parseInt(maxQuantity) || 0;
    const duration = selectedDuration || 0;
    return quantity * duration * POINTS_PER_MINUTE_PER_VIEWER;
  }, [maxQuantity, selectedDuration]);

  const platforms = [
    {
      id: Platform.Kick,
      name: "Kick",
      description: "Impulsione sua live no Kick",
      available: true,
      color: "kick",
    },
    {
      id: Platform.YouTube,
      name: "YouTube",
      description: "Impulsione sua live no YouTube",
      available: true,
      color: "youtube",
    },
    {
      id: Platform.Twitch,
      name: "Twitch",
      description: "Em breve você poderá transmitir no Twitch",
      available: false,
      color: "twitch",
    },
  ];

  const durationOptions = [60, 120, 180];

  const handleSelectPlatform = (platform: Platform) => {
    setSelectedPlatform(platform);
    setSelectedDuration(null); // Reseta a duração ao trocar de plataforma
  };

  const handleStartStream = async () => {
    if (!selectedPlatform || !liveLink || !maxQuantity || !selectedDuration) {
      toast.error("Por favor, preencha todos os campos antes de começar.");
      return;
    }

    setIsLoading(true);
    toast.info("Iniciando sua stream...");

    const currentUserPoints = userPoints?.points ?? 0;

    if (currentUserPoints < cost) {
      toast.error("Você não tem pontos suficientes para iniciar esta stream.", {
        description: `Custo: ${cost} pontos. Você tem: ${currentUserPoints} pontos.`,
      });
      setIsLoading(false);
      return;
    }

    // Chama a função RPC que debita os pontos e cria a stream de forma atômica
    const { data, error } = await supabase.rpc('create_stream_with_points', {
      platform_text: selectedPlatform,
      stream_url_text: liveLink,
      max_viewers_int: parseInt(maxQuantity, 10),
      duration_minutes_int: selectedDuration,
    });

    setIsLoading(false);

    // A função RPC retorna um objeto JSON. Verificamos se houve erro.
    if (error || (data && !data.success)) {
      toast.error("Erro ao iniciar a stream.", {
        description: (data && data.message) || error?.message || "Ocorreu um erro desconhecido.",
      });
    } else {
      toast.success("Sua stream foi iniciada e já está visível para outros usuários!");
      navigate("/dashboard/watch");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Sidebar points={userPoints?.points ?? 0} />
      
      <main className="md:ml-64 ml-0 pt-20 pb-24 md:pb-8 p-4 md:p-8">
        <div className="max-w-5xl mx-auto space-y-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold mb-2">Criar Live</h1>
            <p className="text-muted-foreground">
              Configure e inicie sua transmissão para que outros usuários possam assistir.
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Configuração da Live</CardTitle>
              <CardDescription>
                Selecione a plataforma e preencha os detalhes da sua transmissão.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Seleção de Plataforma */}
              <div className="space-y-2">
                <Label>Plataforma</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {platforms.map((platform) => (
                    <Button
                      key={platform.id}
                      variant={selectedPlatform === platform.id ? platform.color as any : "outline"}
                      className="flex flex-col h-24 gap-2"
                      disabled={!platform.available}
                      onClick={() => handleSelectPlatform(platform.id)}
                    >
                      <PlatformIcon platform={platform.id} className="w-8 h-8" />
                      <span className="font-semibold">{platform.name}</span>
                      {!platform.available && <Badge variant="secondary" className="absolute top-2 right-2">Em breve</Badge>}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Detalhes da Live (só aparece após selecionar plataforma) */}
              {selectedPlatform && (
                <div className="space-y-6 animate-in fade-in-50">
                  <div className="space-y-2">
                    <Label htmlFor="live-link" className="flex items-center gap-2">
                      <LinkIcon className="w-4 h-4" /> Link da Live
                    </Label>
                    <Input
                      id="live-link"
                      type="url"
                      placeholder="https://www.youtube.com/watch?v=..."
                      value={liveLink}
                      onChange={(e) => setLiveLink(e.target.value)}
                      className="focus-visible:ring-primary"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="max-quantity" className="flex items-center gap-2">
                        <Users className="w-4 h-4" /> Máximo de Espectadores
                      </Label>
                      <Input
                        id="max-quantity"
                        type="number"
                        placeholder="Ex: 50"
                        value={maxQuantity}
                        onChange={(e) => setMaxQuantity(e.target.value)}
                        min="10"
                        max="1000"
                        className="focus-visible:ring-primary"
                      />
                       <p className="text-xs text-muted-foreground">Mínimo: 10, Máximo: 1000</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="duration" className="flex items-center gap-2">
                        <Clock className="w-4 h-4" /> Duração da Live
                      </Label>
                       <Select onValueChange={(value) => setSelectedDuration(Number(value))} value={selectedDuration?.toString()}>
                        <SelectTrigger id="duration">
                          <SelectValue placeholder="Selecione a duração" />
                        </SelectTrigger>
                        <SelectContent>
                          {durationOptions.map(duration => (
                            <SelectItem key={duration} value={duration.toString()}>
                              {duration} minutos
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Resumo do Custo e Botão de Ação */}
                  {cost > 0 && (
                     <div className="space-y-4 pt-6 border-t">
                       <Card className="bg-muted/30">
                         <CardHeader>
                           <CardTitle className="text-lg">Resumo do Custo</CardTitle>
                         </CardHeader>
                         <CardContent className="space-y-2">
                           <div className="flex items-center justify-between">
                             <span className="text-muted-foreground">Custo total:</span>
                             <span className="text-lg font-bold text-primary">
                               {cost.toLocaleString('pt-BR')} pontos
                             </span>
                           </div>
                           <p className="text-xs text-muted-foreground pt-2 border-t">
                             Cálculo: {parseInt(maxQuantity) || 0} espectadores × {selectedDuration || 0} min = {cost} pontos.
                           </p>
                         </CardContent>
                       </Card>

                       <Button
                         variant="gradient"
                         size="lg"
                         className="w-full"
                         onClick={handleStartStream}
                         disabled={isLoading || !liveLink || cost <= 0}
                       >
                         {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <DollarSign className="mr-2 h-4 w-4" />}
                         Pagar {cost.toLocaleString('pt-BR')} pontos e Iniciar Live
                       </Button>
                     </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

        </div>
      </main>
    </div>
  );
};

export default MyStreams;
