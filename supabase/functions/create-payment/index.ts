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

serve(async (req) => {
  // Trata a requisição pre-flight do CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 1. Extrai o corpo da requisição e o token de autenticação do usuário
    const { amount_points } = await req.json()
    if (!amount_points) {
      throw new Error('A quantidade de pontos (amount_points) é obrigatória.')
    const { amount_brl } = await req.json()
    if (!amount_brl || typeof amount_brl !== 'number' || amount_brl <= 0) {
      throw new Error('O valor do depósito (amount_brl) é obrigatório e deve ser um número positivo.')
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

    // 4. Cria um cliente Supabase com permissões de administrador para interagir com o banco
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 5. Insere o registro do depósito pendente na tabela
    const { data: depositData, error: depositError } = await supabaseAdmin
      .from('deposits')
      .insert({
        user_id: user.id,
        amount: amount_points,
        amount: amount_brl, // Armazena o valor em BRL
        status: 'pending',
      })
      .select()
      .single();

    if (depositError) {
      throw new Error(`Erro ao criar depósito no Supabase: ${depositError.message}`);
    }

    // 6. Prepara para criar o pagamento no Mercado Pago
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
        transaction_amount: Number(amount_points),
        description: `Depósito de ${amount_points} pontos para o usuário ${user.id}`,
        transaction_amount: Number(amount_brl),
        description: `Depósito de R$${amount_brl.toFixed(2)} para o usuário ${user.id}`,
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