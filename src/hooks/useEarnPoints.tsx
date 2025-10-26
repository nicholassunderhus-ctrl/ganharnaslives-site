import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export const useEarnPoints = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const earnPoints = async (pointsToEarn: number = 1) => {
    if (!user) return { success: false, error: "User not authenticated" };

    setLoading(true);
    try {
      // First, check the last earn timestamp
      const { data: userPoints, error: fetchError } = await supabase
        .from("user_points")
        .select("last_earn_timestamp, points, total_earned")
        .eq("user_id", user.id)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 is "not found"
        throw fetchError;
      }

      const now = new Date();
      const lastEarn = userPoints?.last_earn_timestamp ? new Date(userPoints.last_earn_timestamp) : null;

      // Check if user can earn points (1 point per minute limit)
      if (lastEarn && (now.getTime() - lastEarn.getTime()) < 60000) { // 60 seconds = 1 minute
        return {
          success: false,
          error: "Você só pode ganhar 1 ponto por minuto. Tente novamente em alguns segundos."
        };
      }

      // If no user_points row exists, create one
      if (!userPoints) {
        const { error: insertError } = await supabase
          .from("user_points")
          .insert({
            user_id: user.id,
            points: pointsToEarn,
            total_earned: pointsToEarn,
            last_earn_timestamp: now.toISOString()
          });

        if (insertError) throw insertError;

        return { success: true, pointsEarned: pointsToEarn };
      }

      // Update existing row
      const newPoints = (userPoints.points || 0) + pointsToEarn;
      const newTotalEarned = (userPoints.total_earned || 0) + pointsToEarn;

      const { error: updateError } = await supabase
        .from("user_points")
        .update({
          points: newPoints,
          total_earned: newTotalEarned,
          last_earn_timestamp: now.toISOString()
        })
        .eq("user_id", user.id);

      if (updateError) throw updateError;

      return { success: true, pointsEarned: pointsToEarn };

    } catch (error) {
      console.error("Error earning points:", error);
      return { success: false, error: "Erro ao ganhar pontos. Tente novamente." };
    } finally {
      setLoading(false);
    }
  };

  return { earnPoints, loading };
};
