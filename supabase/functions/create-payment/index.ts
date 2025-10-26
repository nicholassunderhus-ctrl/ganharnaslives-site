import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

// Definindo a interface para os dados do pagamento do Mercado Pago
interface MercadoPagoPaymentResponse {
  id: number;
  point_of_interaction: {
    transaction_data: {
      qr_code: string;
      qr_code_base64: string;
    };
  };
}

const POINTS_PER_REAL = 600; // Taxa de conversão

serve(async (req) => {
  // Trata a requisição pre-flight do CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 1. Extrai o valor em BRL do corpo da requisição
    const { amount } = await req.json()
    if (!amount || typeof amount !== 'number' || amount <= 0) {
      throw new Error('O valor do depósito (amount) é obrigatório e deve ser um número positivo.')
    }

    // 2. Cria um cliente Supabase para validar o usuário
    const authHeader = req.headers.get('Authorization')!
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )

    // 3. Obtém os dados do usuário autenticado
    const { data: { user } } = await supabaseClient.auth.getUser()
    if (!user) {
      return new Response(JSON.stringify({ error: 'Usuário não autenticado.' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // 4. Calcula a quantidade de pontos correspondente
    const amount_points = Math.floor(amount * POINTS_PER_REAL);

    // 5. Cria um cliente Supabase com permissões de administrador
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 6. Insere o registro do depósito pendente na tabela (com o valor em PONTOS)
    const { data: depositData, error: depositError } = await supabaseAdmin
      .from('deposits')
      .insert({
        user_id: user.id,
        amount: amount_points, // Salva a quantidade de pontos
        status: 'pending',
      })
      .select()
      .single();

    if (depositError) {
      throw new Error(`Erro ao criar depósito no Supabase: ${depositError.message}`);
    }

    // 7. Prepara para criar o pagamento no Mercado Pago (com o valor em BRL)
    const mercadoPagoAccessToken = Deno.env.get('MERCADO_PAGO_ACCESS_TOKEN');
    if (!mercadoPagoAccessToken) {
      throw new Error('A chave de acesso do Mercado Pago não está configurada.');
    }

    const webhookUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/payment-webhook`;

    const paymentResponse = await fetch('https://api.mercadopago.com/v1/payments', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${mercadoPagoAccessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        transaction_amount: Number(amount.toFixed(2)), // Usa o valor em BRL
        description: `Depósito de R${amount.toFixed(2)} (${amount_points} pontos) para o usuário ${user.id}`,
        payment_method_id: 'pix',
        payer: {
          email: user.email || 'payer@email.com', // O email é obrigatório
        },
        notification_url: webhookUrl,
        external_reference: depositData.id,
      }),
    });

    if (!paymentResponse.ok) {
      const errorBody = await paymentResponse.json();
      throw new Error(`Erro ao criar pagamento no Mercado Pago: ${JSON.stringify(errorBody)}`);
    }

    const paymentResult = await paymentResponse.json() as MercadoPagoPaymentResponse;

    // 7. Retorna os dados do PIX para o frontend
    return new Response(JSON.stringify({
      payment_id: paymentResult.id,
      qr_code: paymentResult.point_of_interaction.transaction_data.qr_code,
      qr_code_base64: paymentResult.point_of_interaction.transaction_data.qr_code_base64,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
})