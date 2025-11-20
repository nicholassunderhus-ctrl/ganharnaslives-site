import { Sidebar } from "@/components/Sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Monitor, Coins, AlertTriangle, ShieldCheck } from "lucide-react";

const VpnPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      
      <main className="md:ml-64 ml-0 pt-20 pb-24 md:pb-8 p-4 md:p-8">
        <div className="max-w-4xl mx-auto space-y-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">VPN para Multicontas</h1>
            <p className="text-muted-foreground">Maximize seus ganhos utilizando múltiplas contas de forma segura.</p>
          </div>

          {/* --- Conteúdo para Celular --- */}
          <div className="md:hidden">
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
                    Com o potencial de ganhos diários entre <span className="text-primary font-bold text-lg">R$ 10 e R$ 50</span>, nossa VPN é a ferramenta ideal para quem leva a sério a monetização de tempo.
                  </p>
                </div>
                <p className="text-center text-sm text-muted-foreground pt-4">
                  Acesse nosso site pelo seu computador para baixar a ferramenta e começar a lucrar de verdade.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* --- Conteúdo para Desktop --- */}
          <div className="hidden md:block">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-6 h-6 text-primary" />
                  Por que usar uma VPN?
                </CardTitle>
                <CardDescription>Entenda como a VPN é essencial para multiplicar seus ganhos.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <p className="text-muted-foreground leading-relaxed">
                    Plataformas de stream limitam seus ganhos ao identificar que várias contas usam o mesmo IP.
                  </p>
                  <p className="text-muted-foreground leading-relaxed">
                    A solução é usar uma VPN para que cada conta tenha um IP diferente. Recomendamos a **VPN gratuita do navegador Opera GX**.
                  </p>
                </div>
                <div className="bg-green-500/10 border-l-4 border-green-500 text-green-500 p-4 rounded-md">
                  <h3 className="font-bold mb-2 flex items-center gap-2"><ShieldCheck className="w-5 h-5" />Contas Ilimitadas</h3>
                  <p>Nosso site permite apenas uma conta por IP. Com a VPN, você pode gerenciar contas ilimitadas e maximizar seus ganhos.</p>
                </div>
                <div className="bg-primary/5 p-6 rounded-lg text-center">
                  <Coins className="w-8 h-8 text-primary mx-auto mb-3" />
                  <p className="font-semibold text-foreground text-lg">
                    Com a VPN, nossos usuários faturam em média de <span className="text-primary font-bold text-xl">R$ 10 a R$ 50 por dia!</span>
                  </p>
                </div>
                <p className="text-center text-sm text-muted-foreground pt-4">
                  Baixe o Opera GX no seu computador e ative a VPN gratuita para começar.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default VpnPage;