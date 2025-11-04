import { useState, useEffect } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Platform } from "@/types";
import { PlatformIcon } from "@/components/PlatformIcon";
import { supabase } from "@/integrations/supabase/client";
import { Eye, Users, RefreshCcw, Check, X } from "lucide-react";
import { useUserPoints } from "@/hooks/useUserPoints";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

interface AdminStream {
  id: string;
  platform: Platform;
  title: string;
  category: string;
  currentViewers: number;
  maxViewers: number;
  durationMinutes: number;
  streamUrl: string;
}

interface Withdrawal {
  id: string;
  created_at: string;
  user_email: string; // Vamos buscar o email do usuário
  amount_brl: number;
  pix_key_type: string;
  pix_key: string;
  status: string;
}

const Admin = () => {
  const { userPoints } = useUserPoints();
  const [streams, setStreams] = useState<AdminStream[]>([]);
  const [users, setUsers] = useState<Array<{ id: string; email?: string | null; created_at: string }>>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingWithdrawals, setLoadingWithdrawals] = useState(true);
  const [processingWithdrawal, setProcessingWithdrawal] = useState<string | null>(null);
  const [viewersInput, setViewersInput] = useState<{ [key: string]: string }>({});

  const fetchStreams = async () => {
    try {
      const { data, error } = await supabase
        .from('streams')
        .select(`
          id,
          platform,
          title,
          category,
          current_viewers,
          max_viewers,
          duration_minutes,
          stream_url
        `)
        .eq('status', 'live')
        .returns<{
          id: string;
          platform: string;
          title: string;
          category: string;
          current_viewers: number;
          max_viewers: number;
          duration_minutes: number;
          stream_url: string;
        }[]>();

      if (error) throw error;

      const formattedStreams: AdminStream[] = data.map(stream => ({
        id: stream.id,
        platform: stream.platform as Platform,
        title: stream.title,
        category: stream.category,
        currentViewers: stream.current_viewers,
        maxViewers: stream.max_viewers,
        durationMinutes: stream.duration_minutes,
        streamUrl: stream.stream_url
      }));

      setStreams(formattedStreams);
      
      // Inicializar os inputs com os valores atuais
      const inputs: { [key: string]: string } = {};
      formattedStreams.forEach(stream => {
        inputs[stream.id] = stream.currentViewers.toString();
      });
      setViewersInput(inputs);
    } catch (error) {
      console.error('Erro ao buscar lives:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const { data: { users: userList }, error } = await supabase.auth.admin.listUsers();
      if (error) throw error;
      setUsers(userList);
    } catch (error) {
      console.error('Erro ao buscar usuários:', error);
    } finally {
      setLoadingUsers(false);
    }
  };

  const fetchWithdrawals = async () => {
    setLoadingWithdrawals(true);
    try {
      // Usamos RPC para buscar saques e juntar com o email do usuário de forma segura
      const { data, error } = await supabase.rpc('get_all_withdrawals_with_user_email');

      if (error) throw error;
      setWithdrawals(data as Withdrawal[]);
    } catch (error: any) {
      console.error('Erro ao buscar saques:', error);
      toast.error("Erro ao buscar saques: " + error.message);
    } finally {
      setLoadingWithdrawals(false);
    }
  };

  const handleWithdrawalAction = async (withdrawalId: string, action: 'approve' | 'reject') => {
    if (!confirm(`Tem certeza que deseja ${action === 'approve' ? 'APROVAR' : 'REJEITAR'} este saque?`)) {
      return;
    }

    setProcessingWithdrawal(withdrawalId);
    try {
      // Esta Edge Function fará a lógica de aprovação/rejeição
      const { data, error } = await supabase.functions.invoke('handle-withdrawal', {
        body: { withdrawalId, action },
      });

      if (error) {
        throw new Error(error.message);
      }

      if (data.error) {
        throw new Error(data.error);
      }

      toast.success(data.message || `Saque ${action === 'approve' ? 'aprovado' : 'rejeitado'} com sucesso!`);
      // Atualiza a lista após a ação
      await fetchWithdrawals();

    } catch (error: any) {
      toast.error(`Erro ao processar saque: ${error.message}`);
      console.error("Erro no handleWithdrawalAction:", error);
    } finally {
      setProcessingWithdrawal(null);
    }
  };

  useEffect(() => {
    fetchStreams();
    fetchUsers();
    fetchWithdrawals();

    // Subscrever para atualizações em tempo real
    const subscription = supabase
      .channel('admin_streams_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'streams'
        },
        async () => {
          await fetchStreams();
        }
      )
      .subscribe();
    
    const withdrawalsSubscription = supabase
      .channel('admin_withdrawals_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'withdrawals' },
        async () => {
          await fetchWithdrawals();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
      supabase.removeChannel(withdrawalsSubscription);
      subscription.unsubscribe();
    };
  }, []);

  const updateViewers = async (streamId: string) => {
    const newValue = parseInt(viewersInput[streamId]);
    if (isNaN(newValue) || newValue < 0) return;

    try {
      const { error } = await (supabase as any)
        .from('streams')
        .update({ 
          current_viewers: newValue,
          status: 'live' // Garante que o status não seja alterado para 'pending' pela RLS
        })
        .eq('id', streamId);

      if (error) throw error;

      // Atualização acontecerá via subscription
    } catch (error) {
      console.error('Erro ao atualizar viewers:', error);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Sidebar points={userPoints?.points ?? 0} />
      
      <main className="md:ml-64 ml-0 pt-20 pb-24 md:pb-8 p-4 md:p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold mb-2">Painel Admin</h1>
            <p className="text-muted-foreground">Gerencie lives, usuários e configurações do sistema.</p>
          </div>

          <Tabs defaultValue="streams" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="streams">Lives</TabsTrigger>
              <TabsTrigger value="users">Usuários</TabsTrigger>
              <TabsTrigger value="withdrawals">Saques</TabsTrigger>
            </TabsList>

            <TabsContent value="streams">
              <Card className="mt-6">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Lives Ativas</CardTitle>
                    <Button variant="outline" size="sm" onClick={fetchStreams} disabled={loading}>
                      <RefreshCcw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                      Atualizar Lives
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="text-center py-20">
                      <p className="text-muted-foreground">Carregando lives...</p>
                    </div>
                  ) : streams.length === 0 ? (
                    <div className="text-center py-20">
                      <p className="text-muted-foreground">Nenhuma live ativa no momento</p>
                    </div>
                  ) : (
                    <div className="grid gap-6">
                      {streams.map(stream => (
                        <Card key={stream.id}>
                          <CardHeader className="pb-4">
                            <div className="flex items-start sm:items-center gap-4 flex-col sm:flex-row">
                              <PlatformIcon platform={stream.platform} className="w-8 h-8" />
                              <div className="flex-1 min-w-0">
                                <CardTitle className="text-lg">{stream.title}</CardTitle>
                                <p className="text-muted-foreground text-sm mt-1">{stream.category}</p>
                              </div>
                              <Badge variant="outline" className="shrink-0">
                                {stream.durationMinutes} minutos
                              </Badge>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <div className="flex flex-wrap gap-4 items-end">
                              <div className="flex-1 space-y-2 min-w-[200px]">
                                <div className="flex items-center gap-2">
                                  <Users className="w-4 h-4 text-primary" />
                                  <span className="text-sm font-medium">Viewers Atuais/Máximo</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Input
                                    type="number"
                                    min="0"
                                    max={stream.maxViewers}
                                    value={viewersInput[stream.id] ?? ''}
                                    onChange={(e) => setViewersInput({
                                      ...viewersInput,
                                      [stream.id]: e.target.value
                                    })}
                                    className="max-w-[120px]"
                                  />
                                  <span className="text-muted-foreground">/ {stream.maxViewers}</span>
                                  <Button 
                                    variant="secondary"
                                    size="sm"
                                    onClick={() => updateViewers(stream.id)}
                                    disabled={viewersInput[stream.id] === stream.currentViewers.toString()}
                                  >
                                    Atualizar
                                  </Button>
                                </div>
                              </div>
                              
                              <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                  <Eye className="w-4 h-4 text-primary" />
                                  <span className="text-sm font-medium">Link da Live</span>
                                </div>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => window.open(stream.streamUrl, '_blank')}
                                >
                                  Abrir Live
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="users">
              <Card className="mt-6">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Lista de Usuários</CardTitle>
                    <Button variant="outline" size="sm" onClick={fetchUsers} disabled={loadingUsers}>
                      <RefreshCcw className={`w-4 h-4 mr-2 ${loadingUsers ? 'animate-spin' : ''}`} />
                      Atualizar Usuários
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {loadingUsers ? (
                    <div className="text-center py-20">
                      <p className="text-muted-foreground">Carregando usuários...</p>
                    </div>
                  ) : (
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>ID do Usuário</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Data de Criação</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {users.map((user) => (
                            <TableRow key={user.id}>
                              <TableCell className="font-mono">{user.id}</TableCell>
                              <TableCell>{user.email || 'N/A'}</TableCell>
                              <TableCell>
                                {new Date(user.created_at).toLocaleString('pt-BR')}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="withdrawals">
              <Card className="mt-6">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Solicitações de Saque</CardTitle>
                    <Button variant="outline" size="sm" onClick={fetchWithdrawals} disabled={loadingWithdrawals}>
                      <RefreshCcw className={`w-4 h-4 mr-2 ${loadingWithdrawals ? 'animate-spin' : ''}`} />
                      Atualizar Saques
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {loadingWithdrawals ? (
                    <div className="text-center py-20">
                      <p className="text-muted-foreground">Carregando solicitações de saque...</p>
                    </div>
                  ) : withdrawals.length === 0 ? (
                     <div className="text-center py-20">
                      <p className="text-muted-foreground">Nenhuma solicitação de saque no momento.</p>
                    </div>
                  ) : (
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Data</TableHead>
                            <TableHead>Usuário</TableHead>
                            <TableHead>Valor (R$)</TableHead>
                            <TableHead>Chave PIX</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Ações</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {withdrawals.map((w) => (
                            <TableRow key={w.id}>
                              <TableCell>{new Date(w.created_at).toLocaleString('pt-BR')}</TableCell>
                              <TableCell>{w.user_email}</TableCell>
                              <TableCell>R$ {Number(w.amount_brl).toFixed(2)}</TableCell>
                              <TableCell className="font-mono text-xs">
                                <span className="font-bold">{w.pix_key_type}:</span> {w.pix_key}
                              </TableCell>
                              <TableCell>
                                <Badge variant={w.status === 'pending' ? 'default' : w.status === 'completed' ? 'success' : 'destructive'}>
                                  {w.status}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                {w.status === 'pending' && (
                                  <div className="flex gap-2 justify-end">
                                    <Button size="sm" variant="success" onClick={() => handleWithdrawalAction(w.id, 'approve')} disabled={processingWithdrawal === w.id}>
                                      <Check className="w-4 h-4 mr-1" /> {processingWithdrawal === w.id ? 'Aprovando...' : 'Aprovar'}
                                    </Button>
                                    <Button size="sm" variant="destructive" onClick={() => handleWithdrawalAction(w.id, 'reject')} disabled={processingWithdrawal === w.id}>
                                      <X className="w-4 h-4 mr-1" /> Rejeitar
                                    </Button>
                                  </div>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

          </Tabs>
        </div>
      </main>

      <div className="fixed bottom-4 right-4 bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm font-bold shadow-lg">
        adm
      </div>
    </div>
  );

};

export default Admin;