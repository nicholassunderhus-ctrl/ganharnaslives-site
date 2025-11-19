import React from 'react';
import YouTube, { YouTubeProps } from 'react-youtube';
import { Card } from './ui/card';
import { Button } from './ui/button';

interface YouTubeMissionPlayerProps {
  videoId: string;
  onVideoEnd: () => void;
  onClose: () => void;
}

export const YouTubeMissionPlayer: React.FC<YouTubeMissionPlayerProps> = ({ videoId, onVideoEnd, onClose }) => {
  
  const onPlayerReady: YouTubeProps['onReady'] = (event) => {
    // Inicia o vídeo automaticamente
    event.target.playVideo();
  };

  const opts: YouTubeProps['opts'] = {
    height: '390',
    width: '640',
    playerVars: {
      autoplay: 1,
    },
  };

  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-3xl bg-background p-6 relative">
        <div className="aspect-video">
          <YouTube videoId={videoId} opts={opts} onReady={onPlayerReady} onEnd={onVideoEnd} className="w-full h-full" />
        </div>
        <Button variant="outline" onClick={onClose} className="mt-4">
          Fechar Player
        </Button>
      </Card>
    </div>
  );
};