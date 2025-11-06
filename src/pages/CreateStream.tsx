import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"; 
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";

// Definição do tipo para os dados do formulário
interface StreamFormData {
  platform: 'kick' | 'tiktok' | 'youtube';
  stream_url: string;
  max_viewers: number;
}

export default function CreateStream() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState<Partial<StreamFormData>>({});
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (updates: Partial<StreamFormData>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !formData.platform || !formData.stream_url || !formData.max_viewers) {
      toast.error("Por favor, preencha todos os campos.");
      return;
    }

    setIsLoading(true);
    toast.info("Iniciando sua stream...");

    const { error } = await supabase.from("streams").insert({
      user_id: user.id,
      platform: formData.platform,
      stream_url: formData.stream_url,
      max_viewers: formData.max_viewers,
      status: 'live', // Define a stream como ativa
      is_paid: true, // Marca a stream como paga para aparecer no "Assistir"
    });

    setIsLoading(false);

    if (error) {
      console.error("Erro ao criar stream:", error);
      toast.error("Erro ao iniciar a stream.", {
        description: error.message,
      });
    } else {
      toast.success("Sua stream está no ar!", {
        description: "Os usuários já podem encontrá-la na aba 'Assistir'.",
      });
      // Redireciona o usuário para a página de assistir para ver sua própria live
      navigate("/dashboard/watch");
    }
  };

  return (
    <div className="p-4 sm:p-6">
      <Card className="max-w-2xl mx-auto">
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle>Iniciar uma Nova Stream</CardTitle>
            <CardDescription>
              Preencha os detalhes abaixo para que outros usuários possam assistir sua live e você possa ganhar.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="service">Plataforma</Label>
              <Select
                onValueChange={(value: StreamFormData['platform']) => handleInputChange({ platform: value })}
                required
              >
                <SelectTrigger id="service">
                  <SelectValue placeholder="Selecione a plataforma..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="kick">Kick</SelectItem>
                  <SelectItem value="tiktok">TikTok</SelectItem>
                  <SelectItem value="youtube">YouTube</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="stream_url">Link da Stream</Label>
              <Input
                id="stream_url"
                type="url"
                placeholder="https://kick.com/seu-canal"
                onChange={(e) => handleInputChange({ stream_url: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="max_viewers">Máximo de Espectadores</Label>
              <Input
                id="max_viewers"
                type="number"
                min="1"
                placeholder="Quantos usuários podem assistir?"
                onChange={(e) => handleInputChange({ max_viewers: parseInt(e.target.value, 10) })}
                required
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Começar Stream
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
