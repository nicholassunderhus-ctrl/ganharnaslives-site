import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

// Interface para os dados de notificação do Mercado Pago
interface MercadoPagoWebhookNotification {
  id: string; // ID da notificação
  live_mode: boolean;
  type: string; // Ex: "payment"
  date_created: string;
  application_id: number;
  user_id: number;
  version: number;
  api_version: string;
  action: string; // Ex: "payment.created", "payment.updated"
  data: {
    id: string; // ID do pagamento no Mercado Pago
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const notification: MercadoPagoWebhookNotification = await req.json();

    // Verifique se é uma notificação de pagamento e se o ID do pagamento está presente
    if (notification.type !== 'payment' || !notification.data || !notification.data.id) {
      return new Response(JSON.stringify({ message: 'Notificação ignorada: não é um evento de pagamento válido.' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const paymentId = notification.data.id;

    // Crie um cliente Supabase com permissões de administrador
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Obtenha os detalhes do pagamento diretamente do Mercado Pago para verificar o status
    const mercadoPagoAccessToken = Deno.env.get('MERCADO_PAGO_ACCESS_TOKEN');
    if (!mercadoPagoAccessToken) {
      throw new Error('A chave de acesso do Mercado Pago não está configurada.');
    }

    const mpPaymentDetailsResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${mercadoPagoAccessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!mpPaymentDetailsResponse.ok) {
      const errorBody = await mpPaymentDetailsResponse.json();
      throw new Error(`Erro ao buscar detalhes do pagamento no Mercado Pago: ${JSON.stringify(errorBody)}`);
    }

    const paymentDetails = await mpPaymentDetailsResponse.json();
    const paymentStatus = paymentDetails.status; // Ex: "approved", "pending", "rejected"
    const externalReference = paymentDetails.external_reference; // Nosso ID do depósito

    // Atualize o status do depósito no Supabase
    const { error: updateError } = await supabaseAdmin
      .from('deposits')
      .update({ status: paymentStatus, mp_payment_id: paymentId })
      .eq('id', externalReference); // Use externalReference para encontrar o depósito

    if (updateError) {
      throw new Error(`Erro ao atualizar status do depósito no Supabase: ${updateError.message}`);
    }

    return new Response(JSON.stringify({ message: `Depósito ${externalReference} atualizado para status: ${paymentStatus}` }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Erro no webhook do Mercado Pago:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});
