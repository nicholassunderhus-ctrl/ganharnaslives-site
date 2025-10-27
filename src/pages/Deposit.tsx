import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sidebar } from "@/components/Sidebar";
import { MobileNav } from "@/components/MobileNav";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client"; // Importar supabase para pegar o email do usuário
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Coins, Copy } from "lucide-react";
import { useUserPoints } from "@/hooks/useUserPoints";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface PixData {
  qr_code: string;
  qr_code_base64: string;
}

const Deposit = () => {
  const { user, loading: authLoading } = useAuth();
  const { userPoints } = useUserPoints();
  const navigate = useNavigate();

  const [depositAmount, setDepositAmount] = useState<number>(10);
  const [firstName, setFirstName] = useState<string>('');
  const [lastName, setLastName] = useState<string>('');
  const [cpf, setCpf] = useState<string>('');
  const [loadingPayment, setLoadingPayment] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pixData, setPixData] = useState<PixData | null>(null);

  const pointsPerReal = 600; // 600 pontos por R$1

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
    // Preenche o email e, se disponível, nome e sobrenome do usuário autenticado
    if (user) {
      // O email já está disponível em user.email
      // Se você tiver nome/sobrenome no perfil do usuário, pode carregá-los aqui
      // Ex: setFirstName(user.user_metadata?.first_name || '');
    }
  }, [user, authLoading, navigate]);

  const handleCreatePayment = async () => {
    if (!user) {
      toast.error("Você precisa estar logado para fazer um depósito.");
      return;
    }
    if (!firstName || !lastName || !cpf) {
      toast.error("Por favor, preencha seu nome, sobrenome e CPF.");
      return;
    }

    setLoadingPayment(true);
    setError(null);
    setPixData(null);

    try {
      // Obtém o token de sessão para autenticar a chamada da Edge Function
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error("Sessão de usuário não encontrada.");
      }

      // Chama a nova Edge Function para criar o pagamento PIX
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-pix-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`, // Envia o token de autenticação
        },
        body: JSON.stringify({ 
          monetaryAmount: depositAmount, // Valor em Reais
          firstName,
          lastName,
          cpf,
        }),
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
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar points={userPoints?.points ?? 0} />
      <MobileNav />

      <main className="md:ml-64 ml-0 pt-20 pb-24 md:pb-8 p-4 md:p-8">
        <div className="max-w-2xl mx-auto space-y-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Depositar</h1>
            <p className="text-muted-foreground">
              Compre pontos e acelere seus ganhos.
            </p>
          </div>

          <Card className="p-6">
            {!pixData ? (
              <div className="space-y-6">
                <div className="p-4 border rounded-lg flex items-center gap-3">
                    <input type="radio" name="payment" className="w-4 h-4 text-primary" defaultChecked />
                    <div className="flex-1">
                      <div className="font-medium">PIX</div>
                      <div className="text-sm text-muted-foreground">Pagamento instantâneo</div>
                    </div>
                </div>

                <div className="flex items-center gap-3 p-4 bg-primary/5 rounded-lg">
                  <Coins className="w-5 h-5 text-primary" />
                  <span className="text-sm">
                    Cada R$1 depositado = <strong>{pointsPerReal} pontos</strong>
                  </span>
                </div>

                <div className="space-y-2">
                  <label htmlFor="amount" className="text-sm font-medium">Valor do Depósito (BRL)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">R$</span>
                    <Input 
                      id="amount"
                      type="number"
                      min="1"
                      max="1000"
                      step="1"
                      className="pl-8"
                      placeholder="10"
                      value={depositAmount}
                      onChange={(e) => {
                        const value = Math.max(1, Math.min(1000, Number(e.target.value) || 1));
                        setDepositAmount(value);
                      }}
                    />
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

                {/* Campos para Nome, Sobrenome e CPF */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="firstName" className="text-sm font-medium">Nome</label>
                    <Input
                      id="firstName"
                      type="text"
                      placeholder="Seu nome"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="lastName" className="text-sm font-medium">Sobrenome</label>
                    <Input
                      id="lastName"
                      type="text"
                      placeholder="Seu sobrenome"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label htmlFor="cpf" className="text-sm font-medium">CPF</label>
                  <Input
                    id="cpf"
                    type="text" // Pode usar um input mask para formatar o CPF
                    placeholder="000.000.000-00"
                    value={cpf}
                    onChange={(e) => setCpf(e.target.value)}
                    required
                  />
                </div>

                <div className="pt-4">
                  <Button 
                    variant="gradient"
                    size="lg" 
                    className="w-full"
                    onClick={handleCreatePayment}
                    disabled={loadingPayment}
                  >
                    {loadingPayment ? 'Gerando QR Code...' : 'Gerar QR Code PIX'}
                  </Button>
                </div>
              </div>
            ) : (
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
                        <Button 
                            variant="ghost"
                            size="icon"
                            className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                            onClick={() => copyToClipboard(pixData.qr_code)}
                        >
                            <Copy className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
                <p className="text-sm text-muted-foreground pt-4">Após o pagamento, os pontos serão creditados em sua conta em alguns instantes.</p>
                <Button variant="outline" onClick={() => setPixData(null)}>Voltar</Button>
              </div>
            )}

            {error && <p className="text-red-500 text-sm mt-4 text-center">{error}</p>}
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Deposit;
