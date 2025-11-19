import { Sidebar } from "@/components/Sidebar";
import { useUserPoints } from "@/hooks/useUserPoints";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Monitor, Coins } from "lucide-react";

const VpnPage = () => {
  const { userPoints } = useUserPoints();

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      
      <main className="md:ml-64 ml-0 pt-20 pb-24 md:pb-8 p-4 md:p-8">
        <div className="max-w-4xl mx-auto space-y-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">VPN para Multicontas</h1>
            <p className="text-muted-foreground">Maximize seus ganhos utilizando múltiplas contas de forma segura.</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Monitor className="w-6 h-6 text-primary" />
                Disponível Apenas no Computador
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-destructive/10 border-l-4 border-destructive text-destructive p-4 rounded-md">
                <p className="font-semibold">
                  Infelizmente, nossa solução de VPN para multicontas está disponível apenas para computadores (Windows).
                </p>
              </div>

              <div className="bg-primary/5 p-6 rounded-lg">
                <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
                  <Coins className="w-5 h-5 text-primary" />
                  Por que usar no computador?
                </h3>
                <p className="text-muted-foreground">
                  Nossa ferramenta para desktop foi criada para otimizar seus ganhos. Com ela, você pode gerenciar diversas contas simultaneamente, de forma segura e eficiente.
                </p>
                <p className="mt-4 font-semibold text-foreground">
                  Utilizando a VPN no computador, nossos usuários mais dedicados conseguem ganhar até <span className="text-primary font-bold text-lg">R$ 30 por dia!</span>
                </p>
              </div>

              <p className="text-center text-sm text-muted-foreground pt-4">
                Acesse nosso site pelo seu computador para baixar a ferramenta e começar a maximizar seus lucros.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default VpnPage;