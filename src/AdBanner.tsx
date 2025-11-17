import React, { useEffect } from 'react';

const AdBanner: React.FC = () => {
  useEffect(() => {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    // Otimização para mobile: Carrega o banner após um pequeno atraso para não impactar a renderização inicial.
    if (isMobile) {
      setTimeout(() => {
        const script = document.createElement('script');
        script.src = "//miserableconcept.com/bhXXVosnd.Gilr0fY/W/cy/vekmg9OuUZsUwlQkgPdTWYq3kMFDtc/w/NMTJQItCNUjwcBw-NYzUAa1vNWQH";
        script.async = true;
        script.referrerPolicy = 'no-referrer-when-downgrade';
        document.body.appendChild(script);
      }, 1000); // Atraso de 1 segundo
    } else {
      // Para desktop, o script pode ser carregado de forma mais direta.
      // Mantive a lógica original para garantir compatibilidade.
      (window as any).hilltopads_banner = true;
    }
  }, []);

  return null; // O componente não renderiza nada visível diretamente.
};

export default AdBanner;