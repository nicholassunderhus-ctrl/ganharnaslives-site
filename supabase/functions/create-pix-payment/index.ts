import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';
// Interface para os dados recebidos do frontend
interface PayerData {
  monetaryAmount: number;
  firstName: string;
  lastName: string;
  cpf: string;
}
// Interface para a resposta do Mercado Pago
interface MercadoPagoPaymentResponse {
  id: string; // O ID do pagamento é uma string
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
    // 1. Extrai o corpo da requisição
    const { monetaryAmount, firstName, lastName, cpf }: PayerData = await req.json();

    // Limpa e valida os dados de entrada
    const cleanFirstName = firstName?.trim();
    const cleanLastName = lastName?.trim();
    const cleanCpf = cpf?.replace(/\D/g, ''); // Remove todos os caracteres não numéricos

    // Validações básicas
    if (!monetaryAmount || monetaryAmount <= 0) {
      throw new Error('O valor monetário (monetaryAmount) é obrigatório e deve ser maior que zero.');
    }
    if (!cleanFirstName || !cleanLastName || !cleanCpf) {
      throw new Error('Nome, sobrenome e CPF do pagador são obrigatórios.');
    }
    if (cleanCpf.length !== 11) {
      throw new Error('O CPF deve conter 11 dígitos.');
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
    // 4. Cria um cliente Supabase com permissões de administrador
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    // Define a taxa de conversão (ex: 600 pontos por R$1)
    const pointsPerReal = 600;
    const pointsAwarded = Math.floor(monetaryAmount * pointsPerReal);
    // 5. Insere o registro do depósito pendente na tabela 'deposits'
    const { data: depositData, error: depositError } = await supabaseAdmin
      .from('deposits')
      .insert({
        user_id: user.id,
        amount_brl: monetaryAmount,
        points_awarded: pointsAwarded,
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
    const webhookUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/mercado-pago-webhook`;
    const paymentResponse = await fetch('https://api.mercadopago.com/v1/payments', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${mercadoPagoAccessToken}`,
        'Content-Type': 'application/json',
        'X-Idempotency-Key': `deposit-${depositData.id}`, // Evita pagamentos duplicados
      },
      body: JSON.stringify({
        transaction_amount: Number(monetaryAmount),
        description: `Depósito de ${pointsAwarded} pontos para o usuário ${user.id}`,
        payment_method_id: 'pix',
        payer: {
          email: user.email,
          first_name: cleanFirstName,
          last_name: cleanLastName,
          identification: {
            type: 'CPF',
            number: cleanCpf,
          },
        },
        notification_url: webhookUrl,
        external_reference: String(depositData.id),
      }),
    });
    if (!paymentResponse.ok) {
      const errorBody = await paymentResponse.json();
      // Log detalhado do erro do Mercado Pago
      console.error("Erro do Mercado Pago:", JSON.stringify(errorBody, null, 2));
      throw new Error(errorBody.message || `Erro ao criar pagamento no Mercado Pago.`);
    }
    const paymentResult = await paymentResponse.json() as MercadoPagoPaymentResponse;
    // Opcional: Atualizar o registro de depósito com o ID do pagamento do Mercado Pago
    await supabaseAdmin
      .from('deposits')
      .update({ mp_payment_id: String(paymentResult.id) }) // Garante que o ID seja string
      .eq('id', depositData.id);
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
    console.error('Erro em create-pix-payment:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
})
