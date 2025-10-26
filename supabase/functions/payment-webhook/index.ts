import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

// Interfaces para tipar as respostas da API do Mercado Pago
interface MercadoPagoPayment {
  id: number;
  status: 'approved' | 'pending' | 'rejected' | 'cancelled';
  external_reference: string; // ID do nosso depósito
}

interface MercadoPagoNotification {
  action: string;
  api_version: string;
  data: { id: string };
  date_created: string;
  id: string;
  live_mode: boolean;
  type: 'payment';
  user_id: string;
}

console.log('Função Webhook de Pagamento inicializada.');

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // 1. Valida e extrai a notificação do Mercado Pago
    const notification: MercadoPagoNotification = await req.json();
    console.log('Notificação recebida:', JSON.stringify(notification, null, 2));

    // A notificação de webhook do MP para PIX geralmente é do tipo 'payment.updated'
    // ou similar. Vamos focar na ação de pagamento.
    if (notification.type !== 'payment' || !notification.data?.id) {
      console.log('Notificação ignorada: não é do tipo 'payment' ou não tem ID.');
      return new Response('Notificação não relevante.', { status: 200 });
    }

    // 2. Busca os detalhes do pagamento no Mercado Pago
    const mercadoPagoAccessToken = Deno.env.get('MERCADOPAGO_ACCESS_TOKEN');
    if (!mercadoPagoAccessToken) {
      throw new Error('Access Token do Mercado Pago não configurado.');
    }

    const paymentResponse = await fetch(`https://api.mercadopago.com/v1/payments/${notification.data.id}`, {
      headers: {
        'Authorization': `Bearer ${mercadoPagoAccessToken}`,
      },
    });

    if (!paymentResponse.ok) {
      throw new Error(`Erro ao buscar pagamento no Mercado Pago: ${paymentResponse.statusText}`);
    }

    const payment: MercadoPagoPayment = await paymentResponse.json();
    console.log('Detalhes do pagamento:', JSON.stringify(payment, null, 2));

    // 3. Verifica se o pagamento foi aprovado e se temos a referência externa
    if (payment.status !== 'approved' || !payment.external_reference) {
      console.log(`Pagamento ${payment.id} não está aprovado ou não tem referência externa. Status: ${payment.status}`);
      return new Response('Pagamento não aprovado.', { status: 200 });
    }

    const depositId = payment.external_reference;

    // 4. Cria um cliente Supabase Admin para modificar o banco de dados
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 5. Busca o depósito correspondente no nosso banco
    const { data: deposit, error: fetchError } = await supabaseAdmin
      .from('deposits')
      .select('user_id, amount, status')
      .eq('id', depositId)
      .single();

    if (fetchError || !deposit) {
      throw new Error(`Depósito com ID ${depositId} não encontrado.`);
    }

    // 6. Verifica se o depósito já foi processado para evitar duplicidade
    if (deposit.status !== 'pending') {
      console.log(`Depósito ${depositId} já foi processado. Status atual: ${deposit.status}`);
      return new Response('Depósito já processado.', { status: 200 });
    }

    // 7. Chama a função 'add_points' para creditar os pontos ao usuário
    const { error: rpcError } = await supabaseAdmin.rpc('add_points', {
      user_id_input: deposit.user_id,
      points_to_add: deposit.amount, // 'amount' na tabela deposits já são os pontos
    });

    if (rpcError) {
      throw new Error(`Erro ao chamar RPC 'add_points': ${rpcError.message}`);
    }

    console.log(`Pontos (${deposit.amount}) adicionados para o usuário ${deposit.user_id}.`);

    // 8. Atualiza o status do depósito para 'completed'
    const { error: updateError } = await supabaseAdmin
      .from('deposits')
      .update({ status: 'completed' })
      .eq('id', depositId);

    if (updateError) {
      throw new Error(`Erro ao atualizar status do depósito: ${updateError.message}`);
    }

    console.log(`Depósito ${depositId} finalizado com sucesso.`);

    // 9. Retorna 200 OK para o Mercado Pago
    return new Response('Webhook processado com sucesso.', { status: 200 });

  } catch (error) {
    console.error('Erro no processamento do webhook:', error.message);
    // Retorna um status 500 mas sem quebrar a execução para o Deno
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
