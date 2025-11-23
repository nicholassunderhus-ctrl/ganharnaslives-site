import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link, useNavigate } from "react-router-dom";
import logo from "@/assets/logo.png";
import { Mail, Lock, User, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

const Auth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { signUp, signIn, user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user && !loading) {
      navigate("/dashboard");
    }
  }, [user, loading, navigate]);

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    
    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const username = formData.get("username") as string;

    const { error } = await signUp(email, password, { username });
    
    if (error) {
      if (error.message.includes("already registered")) {
        toast.error("Este email já está cadastrado. Faça login!");
      } else {
        toast.error(error.message);
      }
    } else {
      toast.success("Conta criada com sucesso!");
    }
    
    setIsLoading(false);
  };

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    
    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    const { error } = await signIn(email, password);
    
    if (error) {
      if (error.message.includes("Invalid login credentials")) {
        toast.error("Email ou senha incorretos!");
      } else {
        toast.error(error.message);
      }
    } else {
      toast.success("Login realizado com sucesso!");

      // Lógica para aviso de multicontas no mesmo IP/Navegador
      const { data: { user } } = await signUp(email, password, { username }, true); // Usando signUp para pegar o user object
      if (user) {
        try {
          const loggedInUsersKey = 'loggedInUserIds';
          const storedUsers = localStorage.getItem(loggedInUsersKey);
          let userIds: string[] = storedUsers ? JSON.parse(storedUsers) : [];

          if (!userIds.includes(user.id)) {
            userIds.push(user.id);
            localStorage.setItem(loggedInUsersKey, JSON.stringify(userIds));
          }

          if (userIds.length > 1) {
            toast.warning("Aviso de Múltiplas Contas", {
              description: "Detectamos o uso de mais de uma conta neste navegador. Para garantir que você consiga sacar seus pontos, é essencial o uso de uma VPN. Sem ela, seus saques poderão ser bloqueados por segurança.",
              duration: Infinity, // Mantém o aviso na tela até ser fechado pelo usuário
            });
          }
        } catch (e) {
          console.error("Erro ao verificar múltiplas contas:", e);
        }
      }
    }
    
    setIsLoading(false);
  };


  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </Link>
        
        <Card className="p-8 shadow-[var(--shadow-card)]">
          <div className="flex flex-col items-center mb-8">
            <img src={logo} alt="Ganhar Nas Lives" className="h-16 w-16 mb-4" />
            <h1 className="text-2xl font-bold text-center">Ganhar Nas Lives</h1>
            <p className="text-muted-foreground text-center mt-2">
              Ganhe dinheiro assistindo lives
            </p>
          </div>

          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8">
              <TabsTrigger value="signin">Entrar</TabsTrigger>
              <TabsTrigger value="signup">Criar Conta</TabsTrigger>
            </TabsList>

            <TabsContent value="signin">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signin-email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="signin-email"
                      name="email"
                      type="email"
                      placeholder="seu@email.com"
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signin-password">Senha</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="signin-password"
                      name="password"
                      type="password"
                      placeholder="••••••••"
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  variant="gradient"
                  className="w-full"
                  disabled={isLoading}
                >
                  {isLoading ? "Entrando..." : "Entrar"}
                </Button>

                <div className="text-center text-sm text-muted-foreground">
                  <a href="#" className="hover:text-primary transition-colors">
                    Esqueceu sua senha?
                  </a>
                </div>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-username">Nome de Usuário</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="signup-username"
                      name="username"
                      type="text"
                      placeholder="seu_usuario"
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="signup-email"
                      name="email"
                      type="email"
                      placeholder="seu@email.com"
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-password">Senha</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="signup-password"
                      name="password"
                      type="password"
                      placeholder="••••••••"
                      className="pl-10"
                      required
                      minLength={6}
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  variant="gradient"
                  className="w-full"
                  disabled={isLoading}
                >
                  {isLoading ? "Criando..." : "Criar Conta"}
                </Button>

                <p className="text-xs text-center text-muted-foreground">
                  Ao criar uma conta, você concorda com nossos{" "}
                  <a href="#" className="text-primary hover:underline">
                    Termos de Uso
                  </a>
                </p>
              </form>
            </TabsContent>
          </Tabs>

        </Card>
      </div>
    </div>
  );
};

export default Auth;
