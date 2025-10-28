import { Sidebar } from "@/components/Sidebar";
import { MobileNav } from "@/components/MobileNav";
import { MobileHeader } from "@/components/MobileHeader";
import { Card } from "@/components/ui/card";
import { TrendingUp, Eye, Coins, Users } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useUserPoints } from "@/hooks/useUserPoints";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";

const Dashboard = () => {
  const { user, loading } = useAuth();
  const { userPoints, loading: pointsLoading } = useUserPoints();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  if (loading || pointsLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse">Carregando...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const pointsToReal = (points: number) => (points / 700).toFixed(2); // 700 pontos = R$ 1,00

  const stats = {
    points: userPoints?.points ?? 0,
    totalEarned: userPoints?.total_earned ?? 0,
    minutesWatched: 0,
    streamsWatched: 0,
  };

  return (
    <div className="min-h-screen bg-background">
      <Sidebar points={stats.points} />
      <MobileHeader />
      <MobileNav />

      {/* Use responsive margin: on md+ leave space for sidebar; on small screens no left margin. Add top padding to avoid navbar overlap. */}
      <main className="md:ml-64 ml-0 pt-20 pb-24 md:pb-8 p-4 md:p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Bem-vindo de volta! 👋</h1>
            <p className="text-muted-foreground">Veja seu resumo e comece a ganhar mais pontos</p>
          </div>

          {/* Stats Grid */}
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Pontos Disponíveis</span>
                <Coins className="w-4 h-4 text-primary" />
              </div>
              <div className="text-3xl font-bold text-primary mb-1">
                {stats.points.toLocaleString()}
              </div>
              <div className="text-xs text-muted-foreground">
                ≈ R$ {pointsToReal(stats.points)}
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Total Ganho</span>
                <TrendingUp className="w-4 h-4 text-[hsl(var(--kick-green))]" />
              </div>
              <div className="text-3xl font-bold mb-1">
                {stats.totalEarned.toLocaleString()}
              </div>
              <div className="text-xs text-[hsl(var(--kick-green))]">
                Todos os tempos
              </div>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card className="p-6">
            <h2 className="text-xl font-bold mb-4">Atividade Recente</h2>
            <div className="space-y-4">
              <p className="text-center text-muted-foreground py-8">
                Nenhuma atividade ainda. Comece a assistir lives para ganhar pontos!
              </p>
            </div>
          </Card>

          {/* Quick Actions */}
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="p-6 bg-gradient-to-br from-card to-primary/5 border-primary/20">
              <h3 className="text-lg font-bold mb-2">🎯 Comece a Assistir</h3>
              <p className="text-muted-foreground mb-4">
                Milhares de lives disponíveis para você ganhar pontos agora
              </p>
              <a href="/dashboard/watch" className="text-primary font-semibold hover:underline">
                Ver Lives Disponíveis →
              </a>
            </Card>

            <Card className="p-6 bg-gradient-to-br from-card to-[hsl(var(--kick-green))]/5 border-[hsl(var(--kick-green))]/20">
              <h3 className="text-lg font-bold mb-2">💰 Faça um Saque</h3>
              <p className="text-muted-foreground mb-4">
                Você tem {stats.points} pontos disponíveis para sacar via PIX
              </p>
              <a href="/dashboard/withdraw" className="text-[hsl(var(--kick-green))] font-semibold hover:underline">
                Sacar Agora →
              </a>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
