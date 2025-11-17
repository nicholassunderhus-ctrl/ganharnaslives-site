import React, { useEffect, useRef } from 'react';
import videojs from 'video.js';
import 'video.js/dist/video-js.css';
import 'videojs-ima'; // Importa o plugin de anúncios do Google (IMA)

// --- SEU LINK DE ANÚNCIO VAST ---
const VAST_AD_URL = 'https://shadowy-apartment.com/dMm.F/zrdTGpNxvkZMG/Uj/reHmC9/uTZ/U-lzkOPYTgYN3_MCDRcWw/MWDLUTtoNyjicgwpNwzZAHw/NKg_';

/**
 * Props que o componente espera receber.
 * @param streamUrl - A URL direta da transmissão (ex: .m3u8).
 * @param streamType - O tipo do stream (ex: 'application/x-mpegURL' para HLS).
 */
interface LiveStreamPlayerProps {
  streamUrl: string;
  streamType: string;
}

const LiveStreamPlayer: React.FC<LiveStreamPlayerProps> = ({ streamUrl, streamType }) => {
  const videoNode = useRef<HTMLVideoElement>(null);
  const playerRef = useRef<videojs.Player | null>(null);
  const adIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Garante que o player seja criado apenas uma vez
    if (videoNode.current && !playerRef.current) {
      const player = videojs(videoNode.current, {
        autoplay: true,
        controls: true,
        fluid: true, // Faz o player se adaptar ao tamanho do container
        sources: [{
          src: streamUrl,
          type: streamType,
        }],
      });

      playerRef.current = player;

      // --- Configuração dos Anúncios (Google IMA) ---
      const imaOptions = {
        id: 'live-stream-player',
        adTagUrl: VAST_AD_URL,
        // Adicione outras configurações do IMA aqui se necessário
      };
      player.ima(imaOptions);
      // ---------------------------------------------

      // Função para solicitar um anúncio
      const requestAd = () => {
        if (playerRef.current) {
          console.log('Tentando exibir um anúncio...');
          // Pausa a live e solicita o anúncio
          playerRef.current.ima.requestAds();
        }
      };

      // Inicia o intervalo para exibir anúncios a cada 5 minutos
      // 5 minutos = 300.000 milissegundos
      adIntervalRef.current = setInterval(requestAd, 300000);

      // Ouve o evento de fim do anúncio para garantir que a live volte a tocar
      player.on('adsended', () => {
        console.log('Anúncio terminou. Retomando a live.');
        player.play();
      });

      // Inicializa o player para a primeira vez (necessário para o autoplay funcionar em alguns navegadores)
      player.play();
    }

    // Função de limpeza: é executada quando o componente é removido da tela
    return () => {
      // Destrói o player de vídeo para liberar memória
      if (playerRef.current) {
        playerRef.current.dispose();
        playerRef.current = null;
      }
      // Limpa o intervalo do anúncio
      if (adIntervalRef.current) {
        clearInterval(adIntervalRef.current);
      }
    };
  }, [streamUrl, streamType]); // Apenas re-executa se a URL do stream mudar

  return (
    // O `div` e o `video` são os elementos que o video.js usará para criar o player
    <div data-vjs-player>
      <video ref={videoNode} className="video-js vjs-default-skin" playsInline></video>
    </div>
  );
};

export default LiveStreamPlayer;