import { serve, ConnInfo } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

serve(async (req: Request, connInfo: ConnInfo) => { // Adicionado connInfo
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Validação do token do usuário não é mais necessária aqui.
    // A função será chamada publicamente, apenas para registrar o IP.

    // Pega o IP do usuário da conexão.
    // O cabeçalho 'x-forwarded-for' é o padrão usado pela infraestrutura do Supabase.
    const ip_address = req.headers.get('x-forwarded-for')?.split(',')[0].trim();

    if (!ip_address) {
      // Se não conseguir pegar o IP, apenas retorna sem erro para não bloquear o login.
      return new Response(JSON.stringify({ message: 'IP not found' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const today = new Date().toISOString().split('T')[0];

    // Tenta inserir o IP. Se já existir para o dia de hoje, o BD vai gerar um erro de violação de unicidade (código 23505), que nós simplesmente ignoramos.
    // Isso é mais eficiente do que fazer um SELECT e depois um INSERT.
    await supabaseAdmin
      .from('daily_ip_usage')
      .insert({ ip_address: ip_address, usage_date: today });

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    // Se o erro for de violação de chave única (IP já logado hoje), consideramos sucesso.
    if (error.code === '23505') {
      return new Response(JSON.stringify({ success: true, message: 'IP already logged today.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }
    // Para outros erros, logamos no servidor mas não retornamos erro para o cliente.
    console.error('Error in log-ip-on-signin:', error.message);
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200, // Retorna 200 para não quebrar o fluxo de login do cliente.
    });
  }
})
