import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

interface HandleWithdrawalPayload {
  withdrawalId: string;
  action: 'approve' | 'reject';
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // 1. Autenticar usuário e verificar se é admin
    const authHeader = req.headers.get('Authorization')!;
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
      throw new Error('Usuário não autenticado.');
    }

    // Usamos RPC para verificar as claims de admin de forma segura
    const { data: isAdmin, error: isAdminError } = await supabaseClient.rpc('is_claims_admin');
    if (isAdminError || !isAdmin) {
      return new Response(JSON.stringify({ error: 'Acesso negado. Apenas administradores.' }), {
        status: 403, // Forbidden
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 2. Validar o corpo da requisição
    const { withdrawalId, action }: HandleWithdrawalPayload = await req.json();
    if (!withdrawalId || !['approve', 'reject'].includes(action)) {
      throw new Error('ID do saque e ação (approve/reject) são obrigatórios.');
    }

    // 3. Usar o cliente admin para atualizar o status do saque
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const newStatus = action === 'approve' ? 'completed' : 'rejected';

    const { data: updatedWithdrawal, error: updateError } = await supabaseAdmin
      .from('withdrawals')
      .update({
        status: newStatus,
        processed_at: new Date().toISOString(),
      })
      .eq('id', withdrawalId)
      .eq('status', 'pending') // Garante que só podemos alterar saques pendentes
      .select()
      .single();

    if (updateError || !updatedWithdrawal) {
      throw new Error('Falha ao atualizar o saque. Ele pode não estar mais pendente ou não existir.');
    }

    return new Response(JSON.stringify({ message: `Saque ${action === 'approve' ? 'aprovado' : 'rejeitado'} com sucesso!` }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});

