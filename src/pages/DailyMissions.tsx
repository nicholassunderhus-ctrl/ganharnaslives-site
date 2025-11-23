import React, { useState, useEffect } from 'react';
import { Sidebar } from "@/components/Sidebar";
import { useUserPoints } from "@/hooks/useUserPoints";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Gift, Loader2, Ticket, Clock, Eye } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
// =================================================================================
// ATENÇÃO: Adicione as missões do dia aqui dentro desta lista (máximo 10).
// A roleta diária já está configurada e não precisa ser adicionada aqui.
// =================================================================================
const MISSIONS: { id: number; text: string; points: number }[] = [
  // Exemplo: { id: 1, text: 'Resgate seu bônus de login!', points: 50 },
];

// --- Configuração da Roleta ---
const ROULETTE_PRIZES = [
  { points: 10, weight: 50 },  // 50% de chance
  { points: 20, weight: 30 },  // 30% de chance
  { points: 30, weight: 18 },  // 18% de chance
  { points: 50, weight: 2 },   // 2% de chance (muito raro)
];
const totalWeight = ROULETTE_PRIZES.reduce((sum, prize) => sum + prize.weight, 0);

// --- Configuração das Missões Unificadas (Maratona + Anúncios) ---
const MARATHON_MISSIONS = [
  { id: 101, watchTimeGoal: 3600,  displayTime: 60,  points: 20,  adLink: 'https://cuty.io/missao1',         localStorageKey: 'ver_anuncio_1_liberado' },
  { id: 102, watchTimeGoal: 7200,  displayTime: 120, points: 40,  adLink: 'https://stly.link/missao2',        localStorageKey: 'ver_anuncio_2_liberado' },
  { id: 103, watchTimeGoal: 10800, displayTime: 180, points: 60,  adLink: 'https://encurtandourl.com/missao3', localStorageKey: 'ver_anuncio_3_liberado' },
  { id: 104, watchTimeGoal: 21600, displayTime: 360, points: 80,  adLink: 'https://4br.me/missao4',           localStorageKey: 'ver_anuncio_4_liberado' },
  { id: 105, watchTimeGoal: 43200, displayTime: 720, points: 120, adLink: 'https://tpi.li/missao5',           localStorageKey: 'ver_anuncio_5_liberado' },
  { id: 106, watchTimeGoal: 54000, displayTime: 900, points: 180, adLink: 'https://liink.uk/missao6',         localStorageKey: 'ver_anuncio_6_liberado' },
].map((mission, i) => ({
  ...mission,
  title: `Assista ${mission.displayTime} min e veja um anúncio`,
  // Gera o link de validação dinamicamente
  validationLink: `/recompensa/validar-anuncio-id-va${i + 1}-${Math.random().toString(36).substring(2, 8)}`,
}));

const DailyMissionsPage = () => {
  const { userPoints } = useUserPoints();
  const [completedMissions, setCompletedMissions] = useState<number[]>([]);
  const [loadingMission, setLoadingMission] = useState<number | null>(null);
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // --- Estados da Roleta ---
  const [rouletteSpun, setRouletteSpun] = useState(false);
  const [isSpinning, setIsSpinning] = useState(false);
  const [rouletteResult, setRouletteResult] = useState<number | null>(null);

  // --- Estados da Missão de Tempo ---
  const [watchTime, setWatchTime] = useState(0); // Em segundos

  // --- Estado para as missões "Ver Anúncios" ---
  const [unlockedMissions, setUnlockedMissions] = useState<Record<number, boolean>>({});

  useEffect(() => {
    const today = new Date().toDateString();
    
    // Lógica para as missões normais
    const missionsStoredDate = localStorage.getItem('missionsLastResetDate');
    if (missionsStoredDate !== today) {
      localStorage.setItem('completedMissions', '[]');
      localStorage.setItem('missionsLastResetDate', today);
      // Limpa também as missões liberadas no novo dia
      localStorage.setItem('unlockedMissions', '{}');
      setCompletedMissions([]);
      setUnlockedMissions({});
    } else {
      const storedCompleted = JSON.parse(localStorage.getItem('completedMissions') || '[]');
      setCompletedMissions(storedCompleted);
    }

    // Lógica para a roleta
    const rouletteStoredDate = localStorage.getItem('rouletteLastSpinDate');
    if (rouletteStoredDate !== today) {
      localStorage.removeItem('rouletteResult');
      setRouletteSpun(false);
      setRouletteResult(null);
    } else {
      const storedResult = localStorage.getItem('rouletteResult');
      if (storedResult) {
        setRouletteSpun(true);
        setRouletteResult(Number(storedResult));
      }
    }

    // Lógica para o tempo assistido
    const watchTimeStoredDate = localStorage.getItem('watchTimeDate');
    if (watchTimeStoredDate === today) {
      setWatchTime(Number(localStorage.getItem('totalWatchTimeToday') || '0'));
    } else {
      // É um novo dia, então o tempo assistido deve ser zerado tanto no estado quanto no localStorage.
      localStorage.setItem('totalWatchTimeToday', '0');
      setWatchTime(0);
    }

    localStorage.setItem('watchTimeDate', today); // Always update the date

    // Atualiza o tempo assistido a cada 5 segundos para manter a UI sincronizada
    const watchTimePoller = setInterval(() => {
      setWatchTime(Number(localStorage.getItem('totalWatchTimeToday') || '0'));
    }, 5000);

    return () => clearInterval(watchTimePoller);
  }, [completedMissions, user]); // Adicionado completedMissions e user como dependências

  // Efeito para verificar a liberação de TODAS as missões "Ver Anúncio"
  useEffect(() => {
    // Carrega as missões já liberadas do localStorage ao iniciar
    const storedUnlocked = JSON.parse(localStorage.getItem('unlockedMissions') || '{}');
    setUnlockedMissions(storedUnlocked);

    const checkUnlockedMissions = () => {
      let newUnlocked: Record<number, boolean> = { ...storedUnlocked };
      let hasNewUnlock = false;

      MARATHON_MISSIONS.forEach(mission => {
        const liberado = localStorage.getItem(mission.localStorageKey);
        if (liberado === 'true' && !completedMissions.includes(mission.id) && !newUnlocked[mission.id]) {
          newUnlocked[mission.id] = true;
          hasNewUnlock = true;
          toast.info(`Missão liberada! Clique em 'Coletar' para ganhar seus pontos.`);
          localStorage.removeItem(mission.localStorageKey); // Remove a chave de liberação individual
        }
      });

      if (hasNewUnlock) {
        localStorage.setItem('unlockedMissions', JSON.stringify(newUnlocked));
        setUnlockedMissions(newUnlocked);
      }
    };

    checkUnlockedMissions();
  }, [completedMissions]);

  const handleSpinRoulette = async () => {
    if (rouletteSpun || !user) return;

    setIsSpinning(true);

    // Simula a animação da roleta
    const spinDuration = 3000; // 3 segundos
    const spinInterval = setInterval(() => {
      const randomIndex = Math.floor(Math.random() * ROULETTE_PRIZES.length);
      setRouletteResult(ROULETTE_PRIZES[randomIndex].points);
    }, 100);

    // Determina o prêmio final
    let random = Math.random() * totalWeight;
    let finalPrize = 0;
    for (const prize of ROULETTE_PRIZES) {
      if (random < prize.weight) {
        finalPrize = prize.points;
        break;
      }
      random -= prize.weight;
    }

    // Aguarda a animação terminar
    setTimeout(async () => {
      clearInterval(spinInterval);
      setRouletteResult(finalPrize);
      setIsSpinning(false);
      setRouletteSpun(true);

      // Salva o resultado e a data
      const today = new Date().toDateString();
      localStorage.setItem('rouletteLastSpinDate', today);
      localStorage.setItem('rouletteResult', String(finalPrize));

      // Adiciona os pontos ao usuário
      try {
        const { error } = await supabase.rpc('increment_points', { user_id_in: user.id, points_to_add: finalPrize });
        if (error) throw error;
        toast.success(`Você ganhou ${finalPrize} pontos na roleta!`);
        await queryClient.invalidateQueries({ queryKey: ['userPoints', user.id] });
      } catch (error: any) {
        toast.error("Erro ao creditar pontos da roleta.", { description: error.message });
      }
    }, spinDuration);
  };

  const handleMissionClick = async (missionId: number, points: number) => {
    if (completedMissions.includes(missionId) || !user) return;

    setLoadingMission(missionId);
    // Otimisticamente atualiza a UI para prevenir cliques duplos
    setCompletedMissions(prev => [...prev, missionId]);

    try {
      const { error } = await supabase.rpc('increment_points', { user_id_in: user.id, points_to_add: points });
      if (error) throw error;

      // Apenas confirma a gravação no localStorage após o sucesso
      localStorage.setItem('completedMissions', JSON.stringify([...completedMissions, missionId]));
      toast.success(`+${points} pontos foram adicionados à sua conta!`);
      await queryClient.invalidateQueries({ queryKey: ['userPoints', user.id] });
    } catch (error: any) {
      toast.error("Erro ao completar missão.", { description: error.message });
      // Se der erro, reverte o estado da UI para permitir nova tentativa
      setCompletedMissions(prev => prev.filter(id => id !== missionId));
    } finally {
      setLoadingMission(null);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Sidebar points={userPoints?.points ?? 0} />
      <main className="md:ml-64 ml-0 pt-20 pb-24 md:pb-8 p-4 md:p-8">
        <div className="max-w-7xl mx-auto space-y-8 pt-4 md:pt-0">
          {/* --- Roleta Diária --- */}
          <Card className="bg-gradient-to-br from-primary/5 to-transparent">
            <CardHeader className="items-center text-center">
              <CardTitle className="flex items-center justify-center gap-2 text-xl font-bold uppercase md:text-2xl">
                <Ticket className="w-6 h-6 text-primary" />
                Roleta Diária da Sorte
              </CardTitle>
              <CardDescription>Gire uma vez por dia e teste sua sorte para ganhar pontos extras!</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center gap-6 text-center">
              <div className="w-48 h-48 bg-background/50 rounded-full flex items-center justify-center border-4 border-primary/20 shadow-lg">
                <span className={cn("text-5xl font-bold transition-all duration-100", isSpinning ? "text-muted-foreground" : "text-primary")}>
                  {rouletteResult ?? '?'}
                </span>
              </div>
              {rouletteSpun ? (
                <p className="font-semibold text-lg">Você ganhou {rouletteResult} pontos hoje! Volte amanhã.</p>
              ) : (
                <Button onClick={handleSpinRoulette} disabled={isSpinning} size="lg" variant="gradient">
                  {isSpinning ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
                  {isSpinning ? 'Girando...' : 'Girar a Roleta!'}
                </Button>
              )}
            </CardContent>
          </Card>

          {/* --- Grid de Missões de Tempo e Vídeo --- */}
          <Card>
            <CardHeader className="items-center text-center">
              <CardTitle className="flex items-center justify-center gap-2 text-xl font-bold uppercase md:text-2xl">
                <Clock className="w-6 h-6 text-primary" />Maratona de Lives
              </CardTitle>
              <CardDescription>Ganhe pontos por assistir lives por um tempo acumulado hoje.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {MARATHON_MISSIONS.map((mission) => {
                const isCompleted = completedMissions.includes(mission.id);
                const isUnlocked = unlockedMissions[mission.id];
                const timeGoalMet = watchTime >= mission.watchTimeGoal;
                const isLoadingThis = loadingMission === mission.id;

                return (
                  <Card key={mission.id} className="flex flex-col text-center">
                    <CardHeader className="pb-4">
                      <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mx-auto">
                        <Gift className={`w-6 h-6 ${isCompleted ? 'text-green-500' : (isUnlocked || timeGoalMet ? 'text-primary' : 'text-muted-foreground')}`} />
                      </div>
                      <p className="font-semibold pt-2">{mission.title}</p>
                      <p className="text-sm text-primary">Recompensa: {mission.points} pts</p>
                    </CardHeader>
                    <CardContent className="flex-grow flex items-center justify-center">
                      <p className="text-muted-foreground text-sm">
                        Progresso: {Math.floor(watchTime / 60)} / {mission.displayTime} min
                      </p>
                    </CardContent>
                    <CardFooter>
                      {isCompleted ? (
                        <Button variant="secondary" disabled className="w-full">✓ Concluído</Button>
                      ) : isUnlocked ? (
                        <Button onClick={() => handleMissionClick(mission.id, mission.points)} className="w-full" disabled={isLoadingThis}>
                          {isLoadingThis ? <Loader2 className="w-4 h-4 animate-spin" /> : "Coletar"}
                        </Button>
                      ) : (
                        <a href={timeGoalMet ? mission.adLink : undefined} target="_blank" rel="noopener noreferrer" className="w-full">
                          <Button variant="outline" className="w-full gap-2" disabled={!timeGoalMet}>
                            <Eye className="w-4 h-4" /> Ver Anúncio
                          </Button>
                        </a>
                      )}
                    </CardFooter>
                  </Card>
                );
              })}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default DailyMissionsPage;