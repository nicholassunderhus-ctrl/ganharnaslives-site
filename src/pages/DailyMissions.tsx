import React, { useState, useEffect } from 'react';
import { Sidebar } from "@/components/Sidebar";
import { useUserPoints } from "@/hooks/useUserPoints";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Gift, Loader2, Ticket, Clock, Hourglass, Youtube, Trophy, Crown } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import { YouTubeMissionPlayer } from '@/components/YouTubeMissionPlayer';
import { ExternalLink } from 'lucide-react';

// =================================================================================
// ATENÇÃO: Adicione as missões do dia aqui dentro desta lista (máximo 10).
// A roleta diária já está configurada e não precisa ser adicionada aqui.
// =================================================================================
const MISSIONS: { id: number; text: string; points: number }[] = [
  // Exemplo: { id: 1, text: 'Resgate seu bônus de login!', points: 50 },
];

// --- Configuração da Roleta ---
const ROULETTE_PRIZES = [
  { points: 10, weight: 40 },  // 40% de chance
  { points: 20, weight: 30 },  // 30% de chance
  { points: 30, weight: 15 },  // 15% de chance
  { points: 50, weight: 10 },  // 10% de chance
  { points: 100, weight: 5 }, // 5% de chance
];
const totalWeight = ROULETTE_PRIZES.reduce((sum, prize) => sum + prize.weight, 0);

// --- Configuração da Missão Shrtfly ---
const SHRTFLY_MISSION_ID = 201;
const SHRTFLY_MISSION_POINTS = 20;

const DailyMissionsPage = () => {
  const { userPoints } = useUserPoints();
  const [completedMissions, setCompletedMissions] = useState<number[]>([]);
  const [loadingMission, setLoadingMission] = useState<number | null>(null);
  const { user } = useAuth();
  const [anuncioAssistido, setAnuncioAssistido] = useState(false);
  const queryClient = useQueryClient();

  // --- Estados da Roleta ---
  const [rouletteSpun, setRouletteSpun] = useState(false);
  const [isSpinning, setIsSpinning] = useState(false);
  const [rouletteResult, setRouletteResult] = useState<number | null>(null);

  // --- Estados da Missão de Tempo ---
  const [watchTime, setWatchTime] = useState(0); // Em segundos
  const WATCH_TIME_GOAL_1_HOUR = 3600; // 60 minutos em segundos
  const WATCH_TIME_GOAL_3_HOURS = 10800; // 180 minutos em segundos
  const WATCH_TIME_GOAL_6_HOURS = 21600; // 360 minutos em segundos
  const WATCH_TIME_GOAL_12_HOURS = 43200; // 720 minutos em segundos

  // --- Estados da Missão de Vídeo ---
  const [showYoutubePlayer1, setShowYoutubePlayer1] = useState(false);
  const [youtubeMissionWatched, setYoutubeMissionWatched] = useState(false);
  const YOUTUBE_MISSION_1_ID = 110; // Novo ID para a primeira missão de vídeo

  // --- Estados da Missão de Vídeo 2 ---
  const [showYoutubePlayer2, setShowYoutubePlayer2] = useState(false);
  const [youtubeMission2Watched, setYoutubeMission2Watched] = useState(false);
  const YOUTUBE_MISSION_2_ID = 111; // Novo ID para a segunda missão de vídeo

  // --- Estados da Missão de Vídeo 3 ---
  const [showYoutubePlayer3, setShowYoutubePlayer3] = useState(false);
  const [youtubeMission3Watched, setYoutubeMission3Watched] = useState(false);
  const YOUTUBE_MISSION_3_ID = 112; // Novo ID para a terceira missão de vídeo

  // --- Estados da Missão de Vídeo 4 ---
  const [showYoutubePlayer4, setShowYoutubePlayer4] = useState(false);
  const [youtubeMission4Watched, setYoutubeMission4Watched] = useState(false);
  const YOUTUBE_MISSION_4_ID = 113; // Novo ID para a quarta missão de vídeo

  // --- Estados da Missão de Vídeo 5 ---
  const [showYoutubePlayer5, setShowYoutubePlayer5] = useState(false);
  const [youtubeMission5Watched, setYoutubeMission5Watched] = useState(false);
  const YOUTUBE_MISSION_5_ID = 114; // Novo ID para a quinta missão de vídeo

  // --- Estados da Missão de Vídeo 6 ---
  const [showYoutubePlayer6, setShowYoutubePlayer6] = useState(false);
  const [youtubeMission6Watched, setYoutubeMission6Watched] = useState(false);
  const YOUTUBE_MISSION_6_ID = 115; // Novo ID para a sexta missão de vídeo

  useEffect(() => {
    const today = new Date().toDateString();
    
    // Lógica para as missões normais
    const missionsStoredDate = localStorage.getItem('missionsLastResetDate');
    if (missionsStoredDate !== today) {
      localStorage.setItem('completedMissions', '[]');
      localStorage.setItem('missionsLastResetDate', today);
      setCompletedMissions([]);
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

    // Lógica para a missão do YouTube
    const youtubeMissionStoredDate = localStorage.getItem('youtubeMissionWatchedDate');
    if (youtubeMissionStoredDate === today) {
      // Se for o mesmo dia, verifica se o vídeo foi assistido E se a missão ainda não foi coletada
      setYoutubeMissionWatched(!completedMissions.includes(YOUTUBE_MISSION_1_ID));
    } else {
      // Se for um novo dia, reseta o status de "assistido"
      setYoutubeMissionWatched(false);
    }

    // Lógica para a missão do YouTube 2
    const youtubeMission2StoredDate = localStorage.getItem('youtubeMission2WatchedDate');
    if (youtubeMission2StoredDate === today) {
      setYoutubeMission2Watched(!completedMissions.includes(YOUTUBE_MISSION_2_ID));
    } else {
      setYoutubeMission2Watched(false);
    }

    // Lógica para a missão do YouTube 3
    const youtubeMission3StoredDate = localStorage.getItem('youtubeMission3WatchedDate');
    if (youtubeMission3StoredDate === today) {
      setYoutubeMission3Watched(!completedMissions.includes(YOUTUBE_MISSION_3_ID));
    } else {
      setYoutubeMission3Watched(false);
    }

    // Lógica para a missão do YouTube 4
    const youtubeMission4StoredDate = localStorage.getItem('youtubeMission4WatchedDate');
    if (youtubeMission4StoredDate === today) {
      setYoutubeMission4Watched(!completedMissions.includes(YOUTUBE_MISSION_4_ID));
    } else {
      setYoutubeMission4Watched(false);
    }

    // Lógica para a missão do YouTube 5
    const youtubeMission5StoredDate = localStorage.getItem('youtubeMission5WatchedDate');
    if (youtubeMission5StoredDate === today) {
      setYoutubeMission5Watched(!completedMissions.includes(YOUTUBE_MISSION_5_ID));
    } else {
      setYoutubeMission5Watched(false);
    }

    // Lógica para a missão do YouTube 6
    const youtubeMission6StoredDate = localStorage.getItem('youtubeMission6WatchedDate');
    if (youtubeMission6StoredDate === today) {
      setYoutubeMission6Watched(!completedMissions.includes(YOUTUBE_MISSION_6_ID));
    } else {
      setYoutubeMission6Watched(false);
    }

    // Atualiza o tempo assistido a cada 5 segundos para manter a UI sincronizada
    const watchTimePoller = setInterval(() => {
      setWatchTime(Number(localStorage.getItem('totalWatchTimeToday') || '0'));
    }, 5000);

    return () => clearInterval(watchTimePoller);
  }, [completedMissions, user]); // Adicionado completedMissions e user como dependências

  // Efeito para verificar se a missão de anúncio foi liberada
  useEffect(() => {
    const checkAnuncioLiberado = () => {
      const liberado = localStorage.getItem('anuncio_bonus_liberado');
      if (liberado === 'true' && !completedMissions.includes(SHRTFLY_MISSION_ID)) {
        setAnuncioAssistido(true);
        toast.info("Missão de anúncio liberada! Clique em 'Coletar' para ganhar seus pontos.");
        // Remove o indicador para que não seja acionado novamente
        localStorage.removeItem('anuncio_bonus_liberado');
      }
    };

    checkAnuncioLiberado();
  }, [completedMissions]); // Executa quando a página carrega e as missões são checadas

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