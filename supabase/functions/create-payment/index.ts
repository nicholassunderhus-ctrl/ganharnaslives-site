        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        transaction_amount: Number(amount_brl),
        description: `Depósito de R$${amount_brl.toFixed(2)} para o usuário ${user.email}`,
        payment_method_id: 'pix',
        payer: {
          email: user.email || 'payer@email.com', // O email é obrigatório

