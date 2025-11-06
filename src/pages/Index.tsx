import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Navbar } from "@/components/Navbar";
import { Link } from "react-router-dom";
import { Coins, Eye, TrendingUp, Wallet, Play, Users, Clock } from "lucide-react";
import heroImage from "@/assets/hero-bg.png";
import { PlatformIcon } from "@/components/PlatformIcon";
import { Platform } from "@/types";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-b from-background/50 via-background/80 to-background z-10" />
          <img 
            src={heroImage} 
            alt="Hero" 
            className="w-full h-full object-cover opacity-40"
          />
        </div>
        
        <div className="container mx-auto px-4 z-20 text-center">
          <div className="max-w-4xl mx-auto space-y-8">
            <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold leading-tight">
              Ganhe Dinheiro
              <span className="block bg-gradient-to-r from-primary via-[hsl(var(--tiktok-blue))] to-[hsl(var(--kick-green))] bg-clip-text text-transparent">
                Assistindo Lives
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto">
              Assista suas lives favoritas no Kick, Twitch e YouTube. 
              Ganhe <span className="text-primary font-bold">1 ponto por minuto</span> e saque via PIX.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link to="/auth">
                <Button variant="gradient" size="xl" className="w-full sm:w-auto">
                  <Play className="w-5 h-5" />
                  Começar a Ganhar
                </Button>
              </Link>
              <Link to="/auth">
                <Button variant="outline" size="xl" className="w-full sm:w-auto">
                  Sou Streamer
                </Button>
              </Link>
            </div>
            
            <div className="flex items-center justify-center gap-6 pt-8">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                <span className="text-sm text-muted-foreground">+10.000 usuários</span>
              </div>
              <div className="h-4 w-px bg-border" />
              <div className="flex items-center gap-2">
                <Coins className="w-5 h-5 text-primary" />
                <span className="text-sm text-muted-foreground">R$ 50K+ pagos</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Platforms Section */}
      <section className="py-20 bg-card/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Assista em Todas as Plataformas
            </h2>
            <p className="text-muted-foreground text-lg">
              Suporte completo para as principais plataformas de streaming
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <Card className="p-8 text-center hover:shadow-[var(--shadow-card)] transition-all hover:-translate-y-1">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[hsl(var(--kick-green))]/10 mb-4">
                <PlatformIcon platform={Platform.Kick} className="w-10 h-10 text-[hsl(var(--kick-green))]" />
              </div>
              <h3 className="text-xl font-bold mb-2">Kick</h3>
              <p className="text-muted-foreground">Assista lives no Kick e ganhe pontos</p>
            </Card>
            
            <Card className="p-8 text-center hover:shadow-[var(--shadow-card)] transition-all hover:-translate-y-1">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[hsl(var(--tiktok-blue))]/10 mb-4">
                <PlatformIcon platform={Platform.TikTok} className="w-10 h-10 text-[hsl(var(--tiktok-blue))]" />
              </div>
              <h3 className="text-xl font-bold mb-2">TikTok</h3>
              <p className="text-muted-foreground">Assista lives no TikTok e ganhe pontos</p>
            </Card>
            
            <Card className="p-8 text-center hover:shadow-[var(--shadow-card)] transition-all hover:-translate-y-1">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[hsl(var(--youtube-red))]/10 mb-4">
                <PlatformIcon platform={Platform.YouTube} className="w-10 h-10 text-[hsl(var(--youtube-red))]" />
              </div>
              <h3 className="text-xl font-bold mb-2">YouTube</h3>
              <p className="text-muted-foreground">Assista lives no YouTube e ganhe pontos</p>
            </Card>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Como Funciona
            </h2>
            <p className="text-muted-foreground text-lg">
              Simples e rápido em 3 passos
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="text-center space-y-4">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 text-primary text-2xl font-bold">
                1
              </div>
              <Eye className="w-12 h-12 mx-auto text-primary" />
              <h3 className="text-xl font-bold">Assista Lives</h3>
              <p className="text-muted-foreground">
                Escolha lives disponíveis e comece a assistir
              </p>
            </div>
            
            <div className="text-center space-y-4">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 text-primary text-2xl font-bold">
                2
              </div>
              <Coins className="w-12 h-12 mx-auto text-primary" />
              <h3 className="text-xl font-bold">Ganhe Pontos</h3>
              <p className="text-muted-foreground">
                Receba 1 ponto por minuto assistido automaticamente
              </p>
            </div>
            
            <div className="text-center space-y-4">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 text-primary text-2xl font-bold">
                3
              </div>
              <Wallet className="w-12 h-12 mx-auto text-primary" />
              <h3 className="text-xl font-bold">Saque no PIX</h3>
              <p className="text-muted-foreground">
                Converta seus pontos e receba via PIX instantaneamente
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-card/30">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 max-w-5xl mx-auto">
            <div className="text-center">
              <div className="text-4xl font-bold text-primary mb-2">10K+</div>
              <div className="text-muted-foreground">Usuários Ativos</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-primary mb-2">R$ 50K+</div>
              <div className="text-muted-foreground">Já Pagos</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-primary mb-2">500+</div>
              <div className="text-muted-foreground">Lives Disponíveis</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-primary mb-2">24/7</div>
              <div className="text-muted-foreground">Suporte</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <Card className="p-12 text-center bg-gradient-to-br from-card via-card to-primary/5 border-primary/20">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Pronto para Começar a Ganhar?
            </h2>
            <p className="text-muted-foreground text-lg mb-8 max-w-2xl mx-auto">
              Junte-se a milhares de usuários que já estão ganhando dinheiro assistindo suas lives favoritas
            </p>
            <Link to="/auth">
              <Button variant="gradient" size="xl">
                <Play className="w-5 h-5" />
                Criar Conta Grátis
              </Button>
            </Link>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-border">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>&copy; 2025 Ganhar Nas Lives. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
