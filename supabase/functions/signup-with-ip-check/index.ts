import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { email, password, username } = await req.json()

    const ip_address = req.headers.get('x-forwarded-for')
    if (!ip_address) {
      // Se não conseguir identificar o IP, retorna a mensagem solicitada.
      return new Response(
        JSON.stringify({ error: 'Não foi possível identificar o endereço de IP. Para sua segurança, use a VPN gratuita do navegador Opera GX.' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const today = new Date().toISOString().split('T')[0];

    // VERIFICA SE O IP JÁ FOI USADO HOJE (seja em login ou em outro cadastro)
    const { data: existingIp, error: ipCheckError } = await supabaseAdmin
      .from('daily_ip_usage')
      .select('id')
      .eq('ip_address', ip_address)
      .eq('usage_date', today)
      .single()

    if (ipCheckError && ipCheckError.code !== 'PGRST116') { // PGRST116 = "not found"
      throw ipCheckError
    }

    // Se o IP já foi usado hoje, bloqueia o cadastro com a mensagem personalizada.
    if (existingIp) {
      return new Response(
        JSON.stringify({ error: 'Este IP já foi usado hoje. Para criar múltiplas contas, use a VPN gratuita do navegador Opera GX.' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 429 } // 429: Too Many Requests
      )
    }

    // Se o IP está liberado, cria o novo usuário
    const { data: { user }, error: signUpError } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true,
      user_metadata: { username: username },
    })

    if (signUpError) {
      if (signUpError.message.includes('User already registered')) {
        return new Response(
          JSON.stringify({ error: 'Este email já está cadastrado.' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 409 }
        )
      }
      throw signUpError
    }

    // Se o usuário foi criado com sucesso, REGISTRA o IP na tabela de uso diário
    await supabaseAdmin
      .from('daily_ip_usage')
      .insert({ ip_address: ip_address, usage_date: today })

    return new Response(
      JSON.stringify({ user }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})
