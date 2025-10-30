import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';
import { POINTS_PER_REAL_WITHDRAWAL } from '../_shared/constants.ts';

interface WithdrawalRequest {
  amountPoints: number;
  pixKeyType: string;
  pixKey: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // 1. Autenticar usuário
    const authHeader = req.headers.get('Authorization')!;
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('Usuário não autenticado.');
    }

    // 2. Validar dados da requisição
    const { amountPoints, pixKeyType, pixKey }: WithdrawalRequest = await req.json();
    if (!amountPoints || amountPoints <= 0) {
      throw new Error('A quantidade de pontos para saque deve ser maior que zero.');
    }
    if (!pixKeyType || !pixKey) {
      throw new Error('O tipo e a chave PIX são obrigatórios.');
    }

    // 3. Usar o cliente admin para operações seguras
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 4. Chamar uma função RPC para fazer a transação de forma atômica
    const amountBRL = amountPoints / POINTS_PER_REAL_WITHDRAWAL;

    const { error: rpcError } = await supabaseAdmin.rpc('request_withdrawal', {
      p_user_id: user.id,
      p_points_to_deduct: amountPoints,
      p_real_amount: amountBRL,
      p_pix_key_type: pixKeyType,
      p_pix_key: pixKey,
    });

    if (rpcError) {
      throw new Error(rpcError.message);
    }

    return new Response(JSON.stringify({ message: 'Solicitação de saque enviada com sucesso! Aguarde a aprovação.' }), {
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
