import { useState, useMemo, useEffect } from "react";
import { Sidebar } from "@/components/Sidebar";
import { MobileNav } from "@/components/MobileNav";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { useUserPoints } from "@/hooks/useUserPoints";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { PlatformIcon } from "@/components/PlatformIcon";
import { Platform } from "@/types";
import { Provider } from "@supabase/supabase-js";
import { CheckCircle2, Link as LinkIcon, Loader2 } from "lucide-react";

const Accounts = () => {
  const { user } = useAuth();
  const { userPoints } = useUserPoints();
  const [kickUsername, setKickUsername] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (user?.user_metadata?.kick_username) {
      setKickUsername(user.user_metadata.kick_username);
    }
  }, [user]);

  const isGoogleConnected = useMemo(() => {
    return user?.identities?.some(id => id.provider === 'google');
  }, [user]);

  const isKickConnected = useMemo(() => {
    return !!user?.user_metadata?.kick_username;
  }, [user]);

  const handleOAuthLogin = async (provider: Provider) => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: window.location.href, // Redireciona de volta para a página de contas
      },
    });
    if (error) {
      toast.error(`Erro ao conectar com ${provider}.`, { description: error.message });
    }
  };

  const handleSaveKickUsername = async () => {
    if (!kickUsername.trim()) {
      toast.error("Por favor, insira seu nome de usuário do Kick.");
      return;
    }
    setIsSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({
        data: { kick_username: kickUsername.trim() },
      });
      if (error) throw error;
      toast.success("Nome de usuário do Kick salvo com sucesso!");
    } catch (error: any) {
      toast.error("Erro ao salvar nome de usuário.", {
        description: error.message,
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Sidebar points={userPoints?.points ?? 0} />
      <MobileNav />

      <main className="md:ml-64 ml-0 pt-20 pb-24 md:pb-8 p-4 md:p-8">
        <div className="max-w-2xl mx-auto space-y-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Contas Conectadas</h1>
            <p className="text-muted-foreground">
              Conecte suas contas para habilitar funcionalidades e começar a ganhar pontos.
            </p>
          </div>

          <div className="space-y-6">
            {/* Card do YouTube */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div className="flex items-center gap-4">
                  <PlatformIcon platform={Platform.YouTube} className="w-10 h-10" />
                  <div>
                    <CardTitle>Fazer login com YouTube</CardTitle>
                    <CardDescription>Conecte sua conta do Google para validar.</CardDescription>
                  </div>
                </div>
                {isGoogleConnected ? (
                  <div className="flex items-center gap-2 text-green-500">
                    <CheckCircle2 className="w-5 h-5" />
                    <span className="font-medium">Conectado</span>
                  </div>
                ) : (
                  <Button onClick={() => handleOAuthLogin('google')}>
                    <LinkIcon className="w-4 h-4 mr-2" />
                    Conectar
                  </Button>
                )}
              </CardHeader>
            </Card>

            {/* Card do Kick */}
            <Card>
              <CardHeader>
                <div className="flex flex-row items-center justify-between">
                  <div className="flex items-center gap-4">
                    <PlatformIcon platform={Platform.Kick} className="w-10 h-10" />
                    <div>
                      <CardTitle>Fazer login com Kick</CardTitle>
                      <CardDescription>Informe seu nome de usuário para validar.</CardDescription>
                    </div>
                  </div>
                  {isKickConnected && (
                    <div className="flex items-center gap-2 text-green-500">
                      <CheckCircle2 className="w-5 h-5" />
                      <span className="font-medium">Conectado</span>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Seu nome de usuário no Kick"
                    value={kickUsername}
                    onChange={(e) => setKickUsername(e.target.value)}
                  />
                  <Button onClick={handleSaveKickUsername} disabled={isSaving}>
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Salvar"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Accounts;