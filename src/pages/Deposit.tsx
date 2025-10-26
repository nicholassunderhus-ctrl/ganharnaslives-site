import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MobileNav } from "@/components/MobileNav";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { useEffect, useState, FormEvent } from "react";
import { Coins, Copy } from "lucide-react";
import { useUserPoints } from "@/hooks/useUserPoints";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Zs as Sidebar } from "./Dashboard-C5y5o4fT.js";

interface PixData {
  payment_id: number;
  qr_code: string;
  qr_code_base64: string;
}

export function Deposit() {
  const { user, authLoading } = useAuth();
  const navigate = useNavigate();
  const { userPoints, pointsPerReal } = useUserPoints();
  const [depositAmount, setDepositAmount] = useState(10);
  const [loadingPayment, setLoadingPayment] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pixData, setPixData] = useState<PixData | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
    }
  }, [user, authLoading, navigate]);

  const handleCreatePayment = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error("Você precisa estar logado para fazer um depósito.");
      return;
    }

    setLoadingPayment(true);
    setError(null);
    setPixData(null);

    try {
      const amount_brl = depositAmount;
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const session = (await useAuth.getState().supabase.auth.getSession()).data.session;

      if (!session || !supabaseUrl) {
        throw new Error("Sessão ou URL do Supabase não encontrada. Faça login novamente.");
      }

      const response = await fetch(`${supabaseUrl}/functions/v1/create-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ amount_brl }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Falha ao gerar o QR Code.');
      }

      setPixData(data);
    } catch (err: any) {
      setError(err.message || 'Ocorreu um erro desconhecido.');
      toast.error(err.message || 'Ocorreu um erro desconhecido.');
    } finally {
      setLoadingPayment(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast.success("Código PIX copiado para a área de transferência!");
    });
  };

  if (authLoading) {
    return <div>Carregando...</div>;
  }

  return user ? (
    <div className="min-h-screen bg-background">
      <Sidebar points={userPoints?.points ?? 0} />
      <MobileNav />
      <main className="md:ml-64 ml-0 pt-20 pb-24 md:pb-8 p-4 md:p-8">
        <div className="max-w-2xl mx-auto space-y-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Depositar</h1>
            <p className="text-muted-foreground">Compre pontos e acelere seus ganhos.</p>
          </div>

          <Card className="p-6">
            {pixData ? (
              <div className="text-center space-y-6">
                <div>
                  <h2 className="text-2xl font-bold">Pague com PIX</h2>
                  <p className="text-muted-foreground">Escaneie o QR Code ou copie o código abaixo.</p>
                </div>
                <div className="flex justify-center">
                  <img src={`data:image/png;base64,${pixData.qr_code_base64}`} alt="PIX QR Code" className="rounded-lg border p-2" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">PIX Copia e Cola</label>
                  <div className="relative">
                    <Input readOnly value={pixData.qr_code} className="pr-12" />
                    <Button variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8" onClick={() => copyToClipboard(pixData.qr_code)}>
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground pt-4">Após o pagamento, os pontos serão creditados em sua conta em alguns instantes.</p>
                <Button variant="outline" onClick={() => setPixData(null)}>Voltar</Button>
              </div>
            ) : (
              <form onSubmit={handleCreatePayment} className="space-y-6">
                <div className="p-4 border rounded-lg flex items-center gap-3">
                  <input type="radio" name="payment" className="w-4 h-4 text-primary" defaultChecked />
                  <div className="flex-1">
                    <div className="font-medium">PIX</div>
                    <div className="text-sm text-muted-foreground">Pagamento instantâneo</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-primary/5 rounded-lg">
                  <Coins className="w-5 h-5 text-primary" />
                  <span className="text-sm">Cada R$1 depositado = <strong>{pointsPerReal} pontos</strong></span>
                </div>
                <div className="space-y-2">
                  <label htmlFor="amount" className="text-sm font-medium">Valor do Depósito (BRL)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">R$</span>
                    <Input id="amount" type="number" min="1" max="1000" step="1" className="pl-8" placeholder="10" value={depositAmount} onChange={(e) => {
                      const value = Math.max(1, Math.min(1000, Number(e.target.value) || 1));
                      setDepositAmount(value);
                    }} />
                  </div>
                </div>
                <div className="mt-3 text-center">
                  <div className="inline-flex items-center gap-2 bg-muted/30 px-3 py-2 rounded-lg">
                    <Coins className="w-4 h-4 text-primary" />
                    <span className="text-sm">Você receberá:</span>
                    <span className="text-lg font-bold">{(depositAmount * pointsPerReal).toLocaleString('pt-BR')}</span>
                    <span className="text-sm">pontos</span>
                  </div>
                </div>
                <div className="pt-4">
                  <Button type="submit" variant="gradient" size="lg" className="w-full" disabled={loadingPayment}>
                    {loadingPayment ? 'Gerando QR Code...' : 'Gerar QR Code PIX'}
                  </Button>
                </div>
              </form>
            )}
            {error && <p className="text-red-500 text-sm mt-4 text-center">{error}</p>}
          </Card>
        </div>
      </main>
    </div>
  ) : null;
}
