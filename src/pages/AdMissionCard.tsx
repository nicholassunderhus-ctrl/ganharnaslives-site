import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Gift, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface AdMissionCardProps {
  missionId: number;
  missionPoints: number;
  title: string;
  description: string;
  adLink: string;
  localStorageKey: string;
  completedMissions: number[];
  loadingMission: number | null;
  handleMissionClick: (missionId: number, points: number) => Promise<void>;
}

export const AdMissionCard: React.FC<AdMissionCardProps> = ({
  missionId,
  missionPoints,
  title,
  description,
  adLink,
  localStorageKey,
  completedMissions,
  loadingMission,
  handleMissionClick,
}) => {
  const [isUnlocked, setIsUnlocked] = useState(false);

  useEffect(() => {
    const checkIsUnlocked = () => {
      const unlocked = localStorage.getItem(localStorageKey);
      if (unlocked === 'true' && !completedMissions.includes(missionId)) {
        setIsUnlocked(true);
        toast.info(`${title} liberada! Clique em 'Coletar' para ganhar seus pontos.`);
        localStorage.removeItem(localStorageKey);
      }
    };
    checkIsUnlocked();
  }, [completedMissions, localStorageKey, missionId, title]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Gift className="w-6 h-6 text-primary" />{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-card-foreground/5 rounded-lg border">
          <div className="flex items-center gap-4 w-full">
            <Gift className={`w-6 h-6 ${completedMissions.includes(missionId) ? 'text-green-500' : (isUnlocked ? 'text-primary' : 'text-muted-foreground')}`} />
            <div>
              <p className="font-semibold">Veja os anúncios para liberar a coleta.</p>
              <p className="text-sm text-primary">Recompensa: {missionPoints} pts</p>
            </div>
          </div>
          <div className="w-full sm:w-auto flex-shrink-0">
            {completedMissions.includes(missionId) ? (<Button variant="secondary" disabled className="w-full">✓ Concluído</Button>) : isUnlocked ? (<Button onClick={() => handleMissionClick(missionId, missionPoints)} className="w-full" disabled={loadingMission === missionId}>{loadingMission === missionId ? <Loader2 className="w-4 h-4 animate-spin" /> : "Coletar"}</Button>) : (<a href={adLink} target="_blank" rel="noopener noreferrer" className="w-full"><Button className="w-full">Liberar Coleta</Button></a>)}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};