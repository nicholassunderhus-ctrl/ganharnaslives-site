import { Link } from "react-router-dom";
import { Coins } from "lucide-react";
import logo from "@/assets/logo.png";
import { useUserPoints } from "@/hooks/useUserPoints";

export const MobileHeader = () => {
  const { userPoints } = useUserPoints();
  const points = userPoints?.points ?? 0;

  return (
    <header className="md:hidden fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
      <div className="flex items-center justify-between p-3">
        <Link to="/dashboard" className="flex items-center gap-2">
          <img src={logo} alt="Logo" className="h-8 w-8" />
          <span className="font-bold text-base bg-gradient-to-r from-primary to-[hsl(var(--twitch-purple))] bg-clip-text text-transparent">
            Ganhar Nas Lives
          </span>
        </Link>

        <div className="flex items-center gap-1.5 bg-card/50 rounded-full py-1.5 px-3 border border-border">
          <Coins className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium">
            {points.toLocaleString()}
          </span>
        </div>
      </div>
    </header>
  );
};