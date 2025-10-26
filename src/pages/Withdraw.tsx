import { useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Coins, Wallet, Clock, CheckCircle2, XCircle, Eye } from "lucide-react";
import { toast } from "sonner";
import { useUserPoints } from "@/hooks/useUserPoints";

const Withdraw = () => {
  const [pixKey, setPixKey] = useState("");
  const [amount, setAmount] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const { userPoints: userPointsData, loading: pointsLoading } = useUserPoints();
  const userPoints = userPointsData?.points ?? 0;
  const minWithdraw = 7000; // Mínimo de 7000 pontos = R$ 10,00
  const pointsToReal = (points: number) => (points / 700).toFixed(2); // 700 pontos = R$ 1,00
  const pixLogo = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTEyIiBoZWlnaHQ9IjUxMiIgdmlld0JveD0iMCAwIDUxMiA1MTIiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxwYXRoIGQ9Ik0yNTYgMEMxMTQuNiAwIDAgMTE0LjYgMCAyNTZDMCA0MjkuNCAxMTQuNiA1MTIgMjU2IDUxMkM0MjkuNCA1MTIgNTEyIDM5Ny40IDUxMiAyNTZDNTEyIDExNC42IDM5Ny40IDAgMjU2IDBaIiBmaWxsPSIjMzJCQ0FEIi8+CjxwYXRoIGQ9Ik0zNjYgMjIzTDI4OSAxNDZMMjU2IDExM0wyMjMgMTQ2TDE0NiAyMjNMMTEzIDI1NkwxNDYgMjg5TDIyMyAzNjZMMjU2IDM5OUwyODkgMzY2TDM2NiAyODlMMzk5IDI1NkwzNjYgMjIzWk0yNTYgMzI4TDI1NiAzMjhMMTg0IDI1NkwyNTYgMTg0TDMyOCAyNTZMMjU2IDMyOFoiIGZpbGw9IndoaXRlIi8+Cjwvc3ZnPgo=";

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!pixKey) {
      toast.error("Digite sua chave PIX");
      return;
    }
    
    const pointsToWithdraw = Number(amount.replace(/\D/g, ''));
    
    if (isNaN(pointsToWithdraw) || pointsToWithdraw < minWithdraw) {
      toast.error(`O valor mínimo para saque é ${minWithdraw} pontos`);
      return;
    }
    
    if (pointsToWithdraw > userPoints) {
      toast.error("Você não tem pontos suficientes");
      return;
    }

    setIsLoading(true);
    
    // TODO: Integrate with backend
    setTimeout(() => {
      toast.success("Solicitação de saque enviada! Você receberá em até 24h.");
      setPixKey("");
      setAmount("");
      setIsLoading(false);
    }, 2000);
  };

  const recentWithdrawals = [];

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      
      <main className="md:ml-64 ml-0 pt-20 pb-24 md:pb-8 p-4 md:p-8">
        <div className="max-w-4xl mx-auto space-y-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Sacar Pontos</h1>
            <p className="text-muted-foreground">Converta seus pontos em dinheiro via PIX</p>
          </div>

          {/* Mobile: show combined Available + Minimum card */}
          <div className="md:hidden grid grid-cols-1 gap-6">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Disponível</span>
                <Coins className="w-4 h-4 text-primary" />
              </div>
              <div className="text-2xl font-bold">{userPoints} pontos</div>
              <div className="text-sm text-muted-foreground mt-1">
                ≈ R$ {pointsToReal(userPoints)}
              </div>

              <div className="mt-4 border-t border-border pt-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Mínimo para saque</span>
                  <span className="text-sm font-semibold">{minWithdraw} pontos</span>
                </div>
                <div className="text-xs text-muted-foreground mt-1">R$ {pointsToReal(minWithdraw)}</div>
              </div>
            </Card>
          </div>

          {/* Desktop/tablet: cards lado a lado com mesma largura */}
          <div className="hidden md:grid md:grid-cols-2 gap-6">
            <Card className="w-full p-8 flex flex-col items-center text-center">
              <div className="flex items-center gap-3 mb-3">
                <Coins className="w-6 h-6 text-primary" />
                <span className="text-sm text-muted-foreground">Disponível</span>
              </div>
              <div className="text-3xl font-extrabold">{userPoints} pontos</div>
              <div className="text-sm text-muted-foreground mt-2">
                ≈ R$ {pointsToReal(userPoints)}
              </div>
            </Card>

            <Card className="w-full p-8 flex flex-col items-center text-center">
              <div className="flex items-center gap-3 mb-3">
                <Wallet className="w-6 h-6 text-[hsl(var(--kick-green))]" />
                <span className="text-sm text-muted-foreground">Mínimo</span>
              </div>
              <div className="text-3xl font-extrabold">{minWithdraw} pontos</div>
              <div className="text-sm text-muted-foreground mt-2">
                R$ {pointsToReal(minWithdraw)}
              </div>
            </Card>

          </div>

            <Card className="p-6">
            <div className="flex flex-col items-center gap-3 mb-6">
              <img src={pixLogo} alt="PIX" className="w-12 h-12" />
              <div className="text-center">
                <h2 className="text-xl font-bold">Saque via PIX</h2>
                <p className="text-sm text-muted-foreground">
                  Receba em minutos na sua conta
                </p>
                <p className="text-sm text-muted-foreground mt-1">(Processamento em até 24h)</p>
              </div>
            </div>

            <form onSubmit={handleWithdraw} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="pixKey">Chave PIX</Label>
                <Input
                  id="pixKey"
                  placeholder="CPF, telefone, email ou chave aleatória"
                  value={pixKey}
                  onChange={(e) => setPixKey(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="amount">Quantidade de Pontos</Label>
                <Input
                  id="amount"
                  inputMode="numeric"
                  placeholder={`Mínimo ${minWithdraw} pontos`}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                />
                {amount && parseInt(amount) >= minWithdraw && (
                  <p className="text-sm text-muted-foreground">
                    Você receberá: <span className="text-primary font-semibold">
                      R$ {pointsToReal(parseInt(amount))}
                    </span>
                  </p>
                )}
              </div>

              <div className="bg-muted/50 rounded-lg p-4">
                <h3 className="font-semibold mb-2">Taxa de Conversão</h3>
                <p className="text-sm text-muted-foreground">
                  700 pontos = R$ 1,00
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Saque mínimo: 7000 pontos (R$ 10,00)
                </p>
              </div>

              <Button
                type="submit"
                variant="gradient"
                size="lg"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? "Processando..." : "Solicitar Saque"}
              </Button>
            </form>
          </Card>

          <Card className="p-4">
            <h2 className="text-xl font-bold mb-4">Histórico de Saques</h2>
            <div className="space-y-4">
              {recentWithdrawals.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Nenhum saque realizado ainda
                </p>
              ) : (
                recentWithdrawals.map((withdrawal) => (
                  <div key={withdrawal.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-3 border-b border-border last:border-0">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center",
                        withdrawal.status === "completed" 
                          ? "bg-[hsl(var(--kick-green))]/10" 
                          : "bg-yellow-500/10"
                      )}>
                        {withdrawal.status === "completed" ? (
                          <CheckCircle2 className="w-5 h-5 text-[hsl(var(--kick-green))]" />
                        ) : (
                          <Clock className="w-5 h-5 text-yellow-500" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium">{withdrawal.amount} pontos</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(withdrawal.date).toLocaleDateString("pt-BR")}
                        </p>
                      </div>
                    </div>
                    <div className="text-left sm:text-right mt-2 sm:mt-0">
                      <p className="font-semibold text-[hsl(var(--kick-green))]">
                        R$ {withdrawal.value.toFixed(2)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {withdrawal.status === "completed" ? "Pago" : "Processando"}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
};

const cn = (...classes: string[]) => classes.filter(Boolean).join(" ");

export default Withdraw;
