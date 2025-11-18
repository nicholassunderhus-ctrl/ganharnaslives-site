import { Link, useLocation } from "react-router-dom";
import { Home, Eye, Wallet, PiggyBank, Upload, CircleDollarSign } from "lucide-react";
import { cn } from "@/lib/utils";

export const MobileNav = () => {
  const location = useLocation();

  const items = [
    {
      label: "Início",
      icon: Home,
      href: "/dashboard",
    },
    {
      label: "Assistir",
      icon: Eye,
      href: "/dashboard/watch",
    },
    {
      label: "Missões",
      icon: CircleDollarSign,
      href: "/dashboard/missions",
    },
    {
      label: "Sacar",
      icon: Wallet,
      href: "/dashboard/withdraw",
    },
    {
      label: "Depositar",
      icon: PiggyBank,
      href: "/dashboard/deposit",
    },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border">
      <div className="grid grid-cols-5 gap-1 p-2">
        {items.map((item) => {
          const isActive = location.pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 py-2 px-1 rounded-lg transition-colors",
                isActive
                  ? "text-primary bg-primary/10"
                  : "text-muted-foreground hover:text-primary hover:bg-primary/5"
              )}
            >
              <Icon className={cn("w-5 h-5", isActive ? "text-primary" : "text-muted-foreground")} />
              <span className={cn("text-xs font-medium truncate", isActive ? "font-semibold text-primary" : "")}>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};