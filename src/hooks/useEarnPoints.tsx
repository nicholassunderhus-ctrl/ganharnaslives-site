import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export const useEarnPoints = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const earnPoints = useCallback(async (streamId: string) => {
    if (!user) return { success: false, error: "Usuário não autenticado" };

    setLoading(true);
    setError(null);
    try {
      // Chama a Edge Function para creditar os pontos, passando o streamId
      const { data, error: invokeError } = await supabase.functions.invoke('earn-points', {
        body: {
          streamId,
        },
      });

      if (invokeError) {
        throw new Error(invokeError.message);
      }

      if (data.error) {
        throw new Error(data.error);
      }

      return { success: data.success, pointsEarned: data.pointsEarned };

    } catch (error) {
      console.error("Error earning points:", error);
      setError((error as Error).message);
      return { success: false, error: (error as Error).message };
    } finally {
      setLoading(false);
    }
  }, [user]);

  return { earnPoints, loading, error };
};
