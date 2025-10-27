import { useState, useCallback } from "react";
import { initMercadoPago, CardPayment } from "@mercadopago/sdk-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

// INICIALIZE O MERCADO PAGO COM SUA PUBLIC KEY
initMercadoPago("APP_USR-eae8b440-4e50-4679-94b2-d77a4760677e", {
  locale: "pt-BR",
});

export const DepositForm = () => {
  const [amount, setAmount] = useState(10); // Valor padrão de depósito
  const [preferenceId, setPreferenceId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const createPreference = useCallback(async () => {
    if (amount <= 0) {
      toast.error("O valor do depósito deve ser maior que zero.");
      return;
    }
    setIsLoading(true);
    setPreferenceId(null); // Reseta a preferência anterior

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error("Você precisa estar logado para fazer um depósito.");
      }

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-preference`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ amount }),
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || "Não foi possível gerar o formulário de pagamento.");
      }

      const { preferenceId } = await response.json();
      setPreferenceId(preferenceId);
    } catch (error: any) {
      toast.error(error.message || "Não foi possível gerar o formulário de pagamento.");
    } finally {
      setIsLoading(false);
    }
  }, [amount]);

  const onError = async (error: any) => {
    console.error("Erro no formulário do Mercado Pago:", error);
    toast.error("Erro ao preencher os dados do cartão. Verifique as informações.");
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="mb-6">
        <Label htmlFor="amount" className="text-lg">
          Valor do Depósito (R$)
        </Label>
        <Input
          id="amount"
          type="number"
          value={amount}
          onChange={(e) => setAmount(Number(e.target.value))}
          placeholder="Ex: 50"
          className="mt-2 text-xl p-4"
          min="1"
        />
      </div>

      {preferenceId ? (
        <CardPayment
          initialization={{
            amount: amount,
            preferenceId: preferenceId,
          }}
          customization={{
            visual: {
              style: {
                theme: "dark",
              },
            },
            paymentMethods: {
              maxInstallments: 1,
            },
          }}
          onReady={() => console.log("Brick de Cartão de Crédito pronto!")}
          onError={onError}
          onSubmit={async () => {
            // O onSubmit agora é usado para feedback, não para processar o pagamento
            toast.success("Pagamento processado! Redirecionando...");
            // O Mercado Pago irá redirecionar para a `back_url` definida na preferência
          }}
        />
      ) : (
        <button onClick={createPreference} disabled={isLoading} className="w-full bg-blue-600 text-white p-3 rounded-md font-semibold hover:bg-blue-700 disabled:bg-gray-500 transition-colors">
          {isLoading ? "Gerando formulário..." : "Ir para o Pagamento"}
        </button>
      )}
    </div>
  );
};