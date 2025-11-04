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
      // Adicionado `mute=1` para contornar as políticas de autoplay de navegadores como o Opera GX.
      // A maioria dos navegadores modernos só permite autoplay se o vídeo estiver sem som.
      return videoId ? `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1` : url;
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
      // Retorna a thumbnail do YouTube se o videoId for encontrado
      if (videoId) return `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
    }

    if (platform === Platform.Kick) {
      // Para Kick, sempre usa a imagem de background padrão da pasta /public
      return '/kick-bg.png';
    }

  } catch (error) {
    console.error("URL de stream inválida para gerar thumbnail:", streamUrl, error);
  }

  // Fallback: Retorna a imagem de fundo da plataforma se a thumbnail dinâmica falhar.
  // Os arquivos devem estar na pasta /public
  switch (platform) {
    case Platform.Kick:
      return '/kick-bg.png';
    case Platform.YouTube:
      return '/youtube-bg.png';
    case Platform.Twitch:
      return '/twitch-bg.png';
    default:
      return '/youtube-bg.png'; // Fallback final
  }
};