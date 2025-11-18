import { Link, useLocation } from "react-router-dom";
import { Home, Eye, Upload, Wallet, LogOut, Coins, PiggyBank, Shield, CircleDollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import logo from "@/assets/logo.png";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface SidebarProps { points?: number; }

export const Sidebar = ({ points = 0 }: SidebarProps) => {
  const location = useLocation();
  const { signOut } = useAuth();

  const handleSignOut = async () => {
    const { error } = await signOut();
    if (error) {
      toast.error("Erro ao sair");
    } else {
      toast.success("Logout realizado com sucesso!");
    }
  };
  
  const navItems = [
    { to: "/dashboard", icon: Home, label: "Início" },
    { to: "/dashboard/watch", icon: Eye, label: "Assistir" },
    { to: "/dashboard/missions", icon: CircleDollarSign, label: "Missões Diárias" },
    { to: "/dashboard/my-streams", icon: Upload, label: "Streamer" },
    { to: "/dashboard/deposit", icon: PiggyBank, label: "Depositar" },
    { to: "/dashboard/withdraw", icon: Wallet, label: "Sacar" },
    { to: "/dashboard/vpn", icon: Shield, label: "VPN" },
  ];

  return (
    // Hidden on small screens. On md+ it becomes a fixed sidebar.
    <aside className="hidden md:fixed md:left-0 md:top-0 md:h-full md:w-64 md:flex flex-col bg-sidebar border-r border-sidebar-border pt-20">
      <div className="p-6">
        <Link to="/dashboard" className="flex items-center gap-3">
          <img src={logo} alt="Logo" className="h-10 w-10" />
          <span className="font-bold text-lg bg-gradient-to-r from-primary to-[hsl(var(--twitch-purple))] bg-clip-text text-transparent">
            Ganhar Nas Lives
          </span>
        </Link>
      </div>

      <div className="px-4 mb-4">
        <div className="bg-card rounded-lg p-4 border border-border">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Seus Pontos</span>
            <Coins className="w-4 h-4 text-primary" />
          </div>
          <div className="text-2xl font-bold text-primary">{points.toLocaleString()}</div>
          <div className="text-xs text-muted-foreground mt-1">
            ≈ R$ {(points / 1400).toFixed(2)}
          </div>
        </div>
      </div>

      <nav className="flex-1 px-4 space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.to;
          
          return (
            <Link key={item.to} to={item.to}>
              <Button
                variant="ghost"
                className={cn(
                  "w-full justify-start gap-3",
                  isActive && "bg-sidebar-accent text-sidebar-accent-foreground"
                )}
              >
                {/* Destaque especial para Início: ícone maior quando ativo */}
                <Icon className={cn("transition-all", isActive ? "w-6 h-6 text-primary" : "w-5 h-5 text-muted-foreground")} />
                <span className={cn(isActive ? "font-semibold text-primary" : "")}>{item.label}</span>
              </Button>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-sidebar-border">
        <Button 
          variant="ghost" 
          className="w-full justify-start gap-3 text-destructive hover:text-destructive hover:bg-destructive/10"
          onClick={handleSignOut}
        >
          <LogOut className="w-5 h-5" />
          Sair
        </Button>
      </div>
    </aside>
  );
};
