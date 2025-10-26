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

interface PixData {
  payment_id: number;
  qr_code: string;
  qr_code_base64: string;
}

export function Deposit() {
  const { user, authLoading } = useAuth();
  const navigate = useNavigate();
  const { pointsPerReal } = useUserPoints();
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
    e.preventDefault(); // Previne o recarregamento da página
    if (!user) {
      toast.error("Você precisa estar logado para fazer um depósito.");
      return;
    }
  
    setLoadingPayment(true);
    setError(null);
    setPixData(null);
  
    try {
      const amount_points = depositAmount * pointsPerReal;
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
        body: JSON.stringify({ amount_points }),
      });
  
      const data = await response.json();
  
      if (!response.ok) {
        throw new Error(data.error || 'Falha ao gerar o QR Code.');
        throw new Error(data.error || "Falha ao gerar o QR Code.");
      }
  
      setPixData(data);
    } catch (err: any) {
      setError(err.message || "Ocorreu um erro desconhecido.");
      toast.error(err.message || "Ocorreu um erro desconhecido.");
    } finally {
      setLoadingPayment(false);
    }
  };
  
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
    navigator.clipboard.writeText(text).then(
      () => {
        toast.success("Código PIX copiado para a área de transferência!");
      },
      (err) => {
        toast.error("Falha ao copiar o código PIX.");
        console.error("Could not copy text: ", err);
      }
    );
  };

  if (authLoading) {
    return <div>Carregando...</div>;
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <header className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Depositar</h1>
        </header>

        <main>
          <Card className="p-6">
            {!pixData ? (
              <form onSubmit={handleCreatePayment} className="space-y-6">
                <div className="p-4 border rounded-lg flex items-center gap-3">
                    <input type="radio" name="payment" className="w-4 h-4 text-primary" defaultChecked />
                    variant="gradient"
                    size="lg" 
                  <input
                    type="radio"
                    name="payment"
                    className="w-4 h-4 text-primary"
                    defaultChecked
                  />
                  <div className="flex-1">
                    <p className="font-semibold">Depósito via PIX</p>
                    <p className="text-sm text-muted-foreground">
                      O jeito mais rápido de adicionar saldo.
                    </p>
                  </div>
                  <Coins className="w-6 h-6 text-primary" />
                </div>

                <div>
                  <label htmlFor="depositAmount" className="block text-sm font-medium mb-2">
                    Valor do Depósito (em R$)
                  </label>
                  <Input
                    id="depositAmount"
                    type="number"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(Number(e.target.value))}
                    min="1"
                    className="w-full"
                    disabled={loadingPayment}
                  >
                    {loadingPayment ? 'Gerando QR Code...' : 'Gerar QR Code PIX'}
                  />
                  <p className="text-sm text-muted-foreground mt-2">
                    Você receberá {depositAmount * pointsPerReal} pontos.
                  </p>
                </div>

                {error && <p className="text-sm text-red-500">{error}</p>}

                <div className="pt-4">
                  <Button type="submit" variant="gradient" size="lg" className="w-full" disabled={loadingPayment}>
                    {loadingPayment ? "Gerando QR Code..." : "Gerar QR Code PIX"}
                  </Button>
                </div>
              </form>
            ) : (
              <div className="text-center space-y-6">
                <div>
                  <h2 className="text-xl font-semibold">PIX Gerado com Sucesso!</h2>
                  <p className="text-muted-foreground">
                    Escaneie o QR Code ou copie o código para pagar.
                  </p>
                </div>

                <div className="flex justify-center">
                  <img
                    src={`data:image/png;base64,${pixData.qr_code_base64}`}
                    alt="QR Code PIX"
                    className="w-64 h-64 border-4 border-primary rounded-lg"
                  />
                </div>

                <div className="relative">
                  <Input
                    readOnly
                    value={pixData.qr_code}
                    className="pr-12 text-center"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8"
                    onClick={() => copyToClipboard(pixData.qr_code)}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>

                <Button variant="outline" onClick={() => setPixData(null)}>
                  Gerar outro PIX
                </Button>
              </div>
            )}
          </Card>
        </main>
      </div>
      <MobileNav />
    </div>
  );
}
