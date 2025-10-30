import { Platform } from "@/types";

import kickBg from "@/assets/kick-bg.png";
import youtubeBg from "@/assets/youtube-bg.png";
import twitchBg from "@/assets/twitch-bg.png";

/**
 * Converte uma URL de stream normal para uma URL de incorporação (embed).
 * @param url A URL original da stream.
 * @param platform A plataforma (Kick, YouTube, Twitch).
 * @returns A URL de embed pronta para ser usada em um iframe.
 */
export const getEmbedUrl = (url: string, platform: Platform): string => {
  try {
    const urlObj = new URL(url);

    if (platform === Platform.YouTube) {
      // Ex: https://www.youtube.com/watch?v=VIDEO_ID -> https://www.youtube.com/embed/VIDEO_ID
      const videoId = urlObj.searchParams.get("v");
      return videoId ? `https://www.youtube.com/embed/${videoId}?autoplay=1` : url;
    }

    if (platform === Platform.Kick) {
      // Ex: https://kick.com/CHANNEL -> https://player.kick.com/CHANNEL
      const channel = urlObj.pathname.substring(1);
      return channel ? `https://player.kick.com/${channel}?autoplay=true` : url;
    }

    // Para Twitch e outros, a URL de embed é diferente e pode precisar de mais lógica.
    // Por enquanto, retornamos a URL original se não for YouTube ou Kick.
    return url;
  } catch (error) {
    console.error("URL inválida:", url, error);
    return url; // Retorna a URL original em caso de erro
  }
};

/**
 * Retorna a URL da thumbnail de fundo com base na plataforma.
 * @param platform A plataforma da stream.
 * @returns A URL da imagem de thumbnail.
 */
export const getPlatformThumbnail = (platform: Platform): string => {
  switch (platform) {
    case Platform.Kick:
      return kickBg;
    case Platform.YouTube:
      return youtubeBg;
    case Platform.Twitch:
      return twitchBg;
    default:
      // Uma imagem de fallback caso a plataforma não seja reconhecida
      return youtubeBg;
  }
};