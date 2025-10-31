import { useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlatformIcon } from "@/components/PlatformIcon";
import { Platform } from "@/types";
import { useUserPoints } from "@/hooks/useUserPoints";
import { useAuth } from "@/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
import { Eye, Link as LinkIcon, Users, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

const MyStreams = () => {
  const { userPoints } = useUserPoints();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [selectedPlatform, setSelectedPlatform] = useState<Platform | null>(null);
  const [liveLink, setLiveLink] = useState("");
  const [maxQuantity, setMaxQuantity] = useState("");  
  const [selectedDuration, setSelectedDuration] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const calculateCost = () => {
    const quantity = parseInt(maxQuantity) || 0;
    const duration = selectedDuration || 0;
    return quantity * duration;
  };

  const calculateReais = () => {
    const totalPoints = calculateCost();
    return (totalPoints / 600).toFixed(2);
  };

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

  const services = {
    [Platform.YouTube]: [
      { duration: 60, label: "Live YouTube - ⏱️ 60 Min", service: "Views ao Vivo" },
      { duration: 120, label: "Live YouTube - ⏱️ 120 Min", service: "Views ao Vivo" },
      { duration: 180, label: "Live YouTube - ⏱️ 180 Min", service: "Views ao Vivo" },
    ],
    [Platform.Kick]: [
      { duration: 60, label: "Live Kick - ⏱️ 60 Min", service: "Views ao Vivo" },
      { duration: 120, label: "Live Kick - ⏱️ 120 Min", service: "Views ao Vivo" },
      { duration: 180, label: "Live Kick - ⏱️ 180 Min", service: "Views ao Vivo" },
    ],
    [Platform.Twitch]: [],
  };

  const handleSelectPlatform = (platform: Platform) => {
    setSelectedPlatform(platform);
  };

  const handleSelectService = (duration: number) => {
    setSelectedDuration(duration);
    console.log("Selected service:", duration, "minutes for", selectedPlatform);
  };

  const handleStartStream = async () => {
    if (!user || !selectedPlatform || !liveLink || !maxQuantity || !selectedDuration) {
      toast.error("Por favor, preencha todos os campos antes de começar.");
      return;
    }

    setIsLoading(true);
    toast.info("Iniciando sua stream...");

    const cost = calculateCost();
    const currentUserPoints = userPoints?.points ?? 0;

    if (currentUserPoints < cost) {
      toast.error("Você não tem pontos suficientes para iniciar esta stream.", {
        description: `Custo: ${cost} pontos. Você tem: ${currentUserPoints} pontos.`,
      });
      setIsLoading(false);
      return;
    }

    // 1. Debitar os pontos do usuário
    const { error: pointsError } = await supabase.rpc('decrement_points', {
      points_to_subtract: cost,
      user_id_to_update: user.id,
    });

    if (pointsError) {
      setIsLoading(false);
      toast.error("Erro ao debitar pontos.", {
        description: pointsError.message.includes("violates check constraint") 
          ? "Você não tem pontos suficientes." 
          : pointsError.message,
      });
      return;
    }

    // 2. Inserir a nova stream
    const { error: streamError } = await supabase.from("streams").insert({
      user_id: user.id,
      platform: selectedPlatform,
      stream_url: liveLink,
      max_viewers: parseInt(maxQuantity, 10),
      duration_minutes: selectedDuration,
      status: 'live',
      is_paid: true, // Garante que a stream apareça na página "Assistir"
      points_per_minute: 1, // Define 1 ponto por minuto como padrão
    });

    setIsLoading(false);

    if (streamError) {
      toast.error("Erro ao iniciar a stream.", {
        description: streamError.message,
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
            <h1 className="text-2xl md:text-3xl font-bold mb-2">Streamer</h1>
            <p className="text-muted-foreground">
              Escolha a plataforma onde você quer transmitir
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {platforms.map((platform) => (
              <Card 
                key={platform.id} 
                className={`relative ${!platform.available ? 'opacity-60' : selectedPlatform === platform.id ? 'ring-2 ring-primary' : 'hover:shadow-lg'} transition-all`}
              >
                <CardHeader>
                  <div className="flex flex-col items-start sm:flex-row sm:items-center justify-between mb-2 gap-3">
                    <div className="flex items-center gap-3">
                      <PlatformIcon platform={platform.id} className="w-10 h-10" />
                      <div>
                        <CardTitle className="text-lg md:text-2xl">{platform.name}</CardTitle>
                        <CardDescription className="text-sm">{platform.description}</CardDescription>
                      </div>
                    </div>
                    <div className="ml-auto flex items-center gap-2">
                      {!platform.available && (
                        <Badge variant="secondary">Em breve</Badge>
                      )}
                      {selectedPlatform === platform.id && (
                        <Badge>Selecionado</Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button
                    variant={selectedPlatform === platform.id ? platform.color as any : platform.available ? "outline" : "outline"}
                    className="w-full"
                    disabled={!platform.available}
                    onClick={() => handleSelectPlatform(platform.id)}
                  >
                    {platform.available ? "Selecionar" : "Indisponível"}
                  </Button>
                  
                  {/* Serviços específicos da plataforma */}
                  {selectedPlatform === platform.id && platform.available && (
                    <div className="space-y-4 pt-4 border-t">
                      <p className="text-sm font-medium">Serviços disponíveis:</p>
                      <div className="grid grid-cols-1 gap-2">
                        {services[platform.id].map((service) => (
                          <Button
                            key={`${service.service}-${service.duration}`}
                            variant={selectedDuration === service.duration ? "default" : "outline"}
                            size="sm"
                            className={`w-full justify-start items-center gap-2 ${
                              selectedDuration === service.duration ? 'bg-primary/10' : ''
                            }`}
                            onClick={() => handleSelectService(service.duration)}
                          >
                            <Eye className={`w-4 h-4 mr-2 ${selectedDuration === service.duration ? 'text-primary' : 'text-muted-foreground'}`} />
                            <span className="text-sm font-medium">{service.service} — {service.duration} min</span>
                          </Button>
                        ))}
                      </div>

                      {/* Link e Quantidade dentro do card quando um serviço é selecionado */}
                      {selectedDuration && (
                        <div className="space-y-4 pt-4 border-t">                          
                          <div className="space-y-3">
                            <div className="flex items-center gap-2">
                              <LinkIcon className="w-4 h-4 text-primary" />
                              <Label htmlFor="live-link" className="text-sm font-medium">Link da Live:</Label>
                            </div>
                            <Input
                              id="live-link"
                              type="url"
                              placeholder="https://..."
                              value={liveLink}
                              onChange={(e) => setLiveLink(e.target.value)}
                              className="w-full focus-visible:ring-primary"
                            />
                          </div>

                          <div className="space-y-3">
                            <div className="flex items-center gap-2">
                              <Users className="w-4 h-4 text-primary" />
                              <Label htmlFor="max-quantity" className="text-sm font-medium">Quantidade Máxima:</Label>
                            </div>
                            <div className="space-y-2">
                              <Input
                                id="max-quantity"
                                type="number"
                                placeholder="Digite a quantidade"
                                value={maxQuantity}
                                onChange={(e) => setMaxQuantity(e.target.value)}
                                min="10"
                                max="1000"
                                className="w-full focus-visible:ring-primary"
                              />
                              <p className="text-xs text-muted-foreground">
                                Min: 10 - Máx: 1000
                              </p>
                            </div>
                          </div>
                          {/* Valor - mostrado logo abaixo da Quantidade quando link e quantidade preenchidos */}
                          {liveLink.trim() !== "" && maxQuantity && selectedDuration && (
                            <div className="pt-4">
                              <Card className="bg-primary/5">
                                <CardContent className="pt-4">
                                  <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                      <span className="text-sm font-medium">Custo total:</span>
                                      <span className="text-lg font-bold text-primary">
                                        {calculateCost().toLocaleString('pt-BR')} pontos
                                      </span>
                                    </div>
                                    <div className="flex items-center justify-between text-muted-foreground">
                                      <span className="text-xs">Equivalente a:</span>
                                      <span className="text-sm font-semibold">
                                        R$ {calculateReais()}
                                      </span>
                                    </div>
                                    <div className="pt-2 border-t text-xs text-muted-foreground">
                                      <p>Cálculo: {maxQuantity} usuários × {selectedDuration} minutos = {calculateCost()} pontos</p>
                                      <p className="mt-1">Taxa de conversão: 600 pontos = R$ 1,00</p>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            </div>
                          )}

                          {/* Botão de Começar Live */}
                          {liveLink.trim() !== "" && maxQuantity && selectedDuration && (
                            <div className="pt-4">
                              <Button
                                variant="gradient"
                                size="lg"
                                className="w-full"
                                onClick={handleStartStream}
                                disabled={isLoading}
                              >
                                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                Começar Live
                              </Button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {selectedPlatform && services[selectedPlatform].length > 0 && (
            <>
              <div className="space-y-4">
                <div>
                  <h2 className="text-2xl font-bold mb-2">Descrição:</h2>
                </div>
                <Card className="bg-muted/50">
                  <CardContent className="pt-6 space-y-3">
                    <div className="flex items-start gap-3">
                      <span className="text-xl">⌛</span>
                      <p className="text-foreground">
                        <span className="font-semibold">Tempo de Início:</span> 5-10 minutos
                      </p>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="text-xl">⭐</span>
                      <p className="text-foreground font-semibold">
                        100% de Visualizações Estáveis
                      </p>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="text-xl">⭐</span>
                      <p className="text-foreground font-semibold">
                        Melhor Serviço do Mercado
                      </p>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="text-xl">⭐</span>
                      <p className="text-foreground font-semibold">
                        Eles não interagem no chat durante as transmissões.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>



              
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default MyStreams;
