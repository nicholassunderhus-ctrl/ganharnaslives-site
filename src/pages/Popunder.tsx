import { useEffect, useRef } from 'react';

interface PopunderProps {
  url: string;
  width?: number;
  height?: number;
}

const Popunder: React.FC<PopunderProps> = ({ url, width = 150, height = 150 }) => {
  // Usamos useRef para garantir que o pop-under seja aberto apenas uma vez.
  const hasOpened = useRef(false);

  useEffect(() => {
    const handleFirstClick = () => {
      // Verifica se o pop-under já foi aberto.
      if (!hasOpened.current) {
        hasOpened.current = true;

        // Especificações da nova janela (minúscula e sem barras de ferramentas)
        const features = `width=${width},height=${height},menubar=no,toolbar=no,location=no,resizable=no,scrollbars=no,status=no`;
        
        // Abre a nova janela. O nome '_blank' garante que seja uma nova janela.
        const popunderWindow = window.open(url, '_blank', features);

        if (popunderWindow) {
          // O "truque" do pop-under: tira o foco da nova janela.
          popunderWindow.blur();
          // Garante que a janela principal mantenha o foco.
          window.focus();
        }
        
        // Remove o listener após o primeiro clique para não abrir múltiplas janelas.
        document.removeEventListener('click', handleFirstClick);
      }
    };

    // Adiciona o listener para o primeiro clique em qualquer lugar do documento.
    document.addEventListener('click', handleFirstClick);

    // Este componente não renderiza nada visível na página.
    return () => document.removeEventListener('click', handleFirstClick);
  }, [url, width, height]); // Dependências do useEffect

  return null;
};

export default Popunder;