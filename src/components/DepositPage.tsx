import { DepositForm } from "@/components/DepositForm";

export const DepositPage = () => {
  return (
    <div className="container mx-auto py-10 px-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Fazer um Depósito</h1>
        <p className="text-muted-foreground mb-8">
          Adicione fundos à sua conta para comprar pontos. O pagamento é processado com segurança pelo Mercado Pago.
        </p>
        <DepositForm />
      </div>
    </div>
  );
};