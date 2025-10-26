import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

interface UserPoints {
  points: number;
  total_earned: number;
}

export const useUserPoints = () => {
  const { user } = useAuth();
  const [userPoints, setUserPoints] = useState<UserPoints | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPoints = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      const { data, error } = await (supabase as any).from("user_points").select("points, total_earned").eq("user_id", user.id).single();

      if (error) {
        console.error("Error fetching user points:", error);
      } else {
        setUserPoints(data);
      }
      
      setLoading(false);
    };

    fetchPoints();

    // Set up realtime subscription
    const channel = (supabase as any)
      .channel("user_points_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "user_points",
          filter: `user_id=eq.${user?.id}`,
        },
        (payload: any) => {
          if (payload.new && typeof payload.new === "object") {
            setUserPoints({
              points: payload.new.points,
              total_earned: payload.new.total_earned,
            });
          }
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [user]);

  return { userPoints, loading };
};
