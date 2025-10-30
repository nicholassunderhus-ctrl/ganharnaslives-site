import { Platform } from "@/types";

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
 * Gera a URL da thumbnail real da live com base na plataforma e no link.
 * @param platform A plataforma da stream (Kick, YouTube, etc.).
 * @param streamUrl O link da live.
 * @returns A URL da imagem de thumbnail.
 */
export const getDynamicThumbnailUrl = (platform: Platform, streamUrl: string): string => {
  try {
    const url = new URL(streamUrl);

    if (platform === Platform.YouTube) {
      // Ex: https://www.youtube.com/watch?v=VIDEO_ID
      const videoId = url.searchParams.get('v');
      if (videoId) {
        // mqdefault é uma boa qualidade para thumbnails
        return `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
      }
    }

    if (platform === Platform.Kick) {
      // Ex: https://kick.com/CHANNEL
      const channel = url.pathname.substring(1).split('/')[0];
      if (channel) {
        return `https://thumbnails.kick.com/stream/${channel.toLowerCase()}/thumbnail.jpeg`;
      }
    }

  } catch (error) {
    console.error("URL de stream inválida para gerar thumbnail:", streamUrl, error);
  }

  // Retorna uma imagem de fallback se não conseguir gerar a thumbnail
  return "https://source.unsplash.com/random/800x450?gaming,live,stream";
};