import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import logo from "@/assets/logo.png";

export const Navbar = () => {
  return (
    <nav className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-lg border-b border-border">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
          <img src={logo} alt="Ganhar Nas Lives" className="h-12 w-12" />
          <span className="text-2xl font-bold bg-gradient-to-r from-primary to-[hsl(var(--twitch-purple))] bg-clip-text text-transparent">
            Ganhar Nas Lives
          </span>
        </Link>
        
        <div className="flex items-center gap-4">
          <Link to="/auth">
            <Button variant="ghost">Entrar</Button>
          </Link>
          <Link to="/auth">
            <Button variant="gradient" size="lg">
              Começar Agora
            </Button>
          </Link>
        </div>
      </div>
    </nav>
  );
};
