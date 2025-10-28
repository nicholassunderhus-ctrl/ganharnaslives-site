import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';
import { createHmac } from 'https://deno.land/std@0.168.0/node/crypto.ts';

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

async function verifyMercadoPagoSignature(req: Request, rawBody: string): Promise<boolean> {
  const signatureHeader = req.headers.get('x-signature');
  const webhookSecret = Deno.env.get('MERCADO_PAGO_WEBHOOK_SECRET');

  if (!signatureHeader || !webhookSecret) {
    console.warn('Assinatura do webhook ou segredo não encontrados.');
    return false;
  }

  // O formato do header é: ts=<timestamp>,v1=<hash>
  const parts = signatureHeader.split(',').reduce((acc, part) => {
    const [key, value] = part.split('=');
    acc[key.trim()] = value.trim();
    return acc;
  }, {} as Record<string, string>);

  const timestamp = parts['ts'];
  const receivedHash = parts['v1'];

  if (!timestamp || !receivedHash) {
    console.warn('Formato de assinatura inválido.');
    return false;
  }

  const manifest = `id:${(JSON.parse(rawBody) as MercadoPagoWebhookNotification).data.id};request-id:${req.headers.get('x-request-id')};ts:${timestamp};`;

  const hmac = createHmac('sha256', webhookSecret);
  hmac.update(manifest);
  const calculatedHash = hmac.digest('hex');

  return calculatedHash === receivedHash;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Precisamos do corpo bruto (raw body) para verificar a assinatura
    const rawBody = await req.text();
    const notification: MercadoPagoWebhookNotification = JSON.parse(rawBody);

    // Adicionado: Identifica e ignora notificações de teste do Webhook.
    // O Mercado Pago envia uma notificação falsa para validar o endpoint.
    // Se tentarmos processá-la, a busca pelo paymentId falhará.
    // Respondendo com 200 OK, informamos que o endpoint está pronto para receber notificações.
    if (notification.action === 'payment.updated' && notification.data.id === '123456') {
      return new Response(JSON.stringify({ message: 'Notificação de teste recebida com sucesso.' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Valida a assinatura do webhook para garantir que a requisição é legítima
    const isSignatureValid = await verifyMercadoPagoSignature(req, rawBody);
    if (!isSignatureValid) {
      return new Response(JSON.stringify({ error: 'Assinatura inválida.' }), {
        status: 401, // Unauthorized
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

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
    // 1. Encontra o depósito correspondente para obter user_id e points_awarded
    const { data: deposit, error: findError } = await supabaseAdmin
      .from('deposits')
      .select('user_id, points_awarded, status')
      .eq('id', externalReference)
      .single();

    if (findError) {
      throw new Error(`Depósito com external_reference ${externalReference} não encontrado.`);
    }

    // 2. Se o pagamento foi aprovado E o depósito ainda está pendente, credita os pontos.
    if (paymentStatus === 'approved' && deposit.status === 'pending') {
      const { error: rpcError } = await supabaseAdmin.rpc('add_points', {
        user_id_input: deposit.user_id,
        points_to_add: deposit.points_awarded,
      });

      if (rpcError) {
        throw new Error(`Erro ao chamar a função 'add_points': ${rpcError.message}`);
      }
    }

    // 3. Atualize o status do depósito no Supabase
    const { error: updateError } = await supabaseAdmin
      .from('deposits')
      .update({ status: paymentStatus, gateway_payment_id: paymentId })
      .eq('id', externalReference)
      .select(); // Adiciona .select() para garantir a execução e facilitar a depuração

    if (updateError) {
      // Mesmo que a atualização de status falhe, os pontos podem já ter sido creditados.
      // O ideal é logar este erro para investigação manual.
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
