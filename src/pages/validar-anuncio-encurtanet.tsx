import { Sidebar } from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Clock, Gift, XCircle } from "lucide-react";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

const ValidarAnuncioEncurtanetPage = () => {
  const [status, setStatus] = useState<"validating" | "success" | "error">("validating");
  const [isButtonDisabled, setIsButtonDisabled] = useState(true);
  const [countdown, setCountdown] = useState(5);

  const router = useRouter();

  useEffect(() => {
    // Simula uma validação (ex: verificar referer, token, etc.)
    const validationTimeout = setTimeout(() => {
      // Para este exemplo, vamos sempre validar com sucesso.
      // No futuro, você pode adicionar uma lógica mais complexa aqui.
      setStatus("success");
    }, 2000); // Simula 2 segundos de validação

    return () => clearTimeout(validationTimeout);
  }, []);

  useEffect(() => {
    if (status === "success") {
      if (countdown > 0) {
        const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
        return () => clearTimeout(timer);
      } else {
        setIsButtonDisabled(false);
      }
    }
  }, [status, countdown]);

  const handleCollectPoints = () => {
    alert("Parabéns! Você coletou 20 pontos!");
    // Aqui você adicionaria a lógica para creditar os pontos ao usuário
    // e talvez redirecioná-lo para a página de missões.
    router.push("/missoes"); // Exemplo de redirecionamento
  };

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <main className="md:ml-64 ml-0 pt-20 pb-24 md:pb-8 p-4 md:p-8">
        <div className="max-w-2xl mx-auto">
          <Card className="text-center">
            <CardHeader>
              <CardTitle className="text-2xl">Missão Diária: Anúncio Encurtanet</CardTitle>
              <CardDescription>Valide sua visita para coletar sua recompensa.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {status === "validating" && (
                <div className="flex flex-col items-center gap-4 p-8">
                  <Clock className="w-12 h-12 text-muted-foreground animate-spin" />
                  <p className="text-lg font-semibold">Validando sua visita...</p>
                  <p className="text-muted-foreground">Aguarde um momento.</p>
                </div>
              )}

              {status === "success" && (
                <div className="flex flex-col items-center gap-4 p-8">
                  <CheckCircle className="w-16 h-16 text-green-500" />
                  <h2 className="text-2xl font-bold text-green-500">Visita Validada com Sucesso!</h2>
                  <p className="text-muted-foreground">
                    Você está pronto para coletar seus 20 pontos.
                  </p>
                  <Button
                    onClick={handleCollectPoints}
                    disabled={isButtonDisabled}
                    size="lg"
                    className="mt-4 w-full"
                  >
                    <Gift className="mr-2 h-5 w-5" />
                    {isButtonDisabled ? `Aguarde ${countdown}s...` : "Coletar 20 Pontos"}
                  </Button>
                </div>
              )}

              {status === "error" && (
                <div className="flex flex-col items-center gap-4 p-8">
                  <XCircle className="w-16 h-16 text-destructive" />
                  <h2 className="text-2xl font-bold text-destructive">Erro na Validação</h2>
                  <p className="text-muted-foreground">
                    Não foi possível validar sua visita. Por favor, tente completar a missão novamente.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default ValidarAnuncioEncurtanetPage;