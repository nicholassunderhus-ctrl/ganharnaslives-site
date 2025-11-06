import { Platform } from "@/types";
import kickLogo from "@/assets/kick-logo.png";
import youtubeLogo from "@/assets/youtube-logo.png";
import tiktokLogo from "@/assets/tiktok-logo.png"; // Importe o logo do TikTok
 
interface PlatformIconProps {
  platform: Platform;
  className?: string;
}

export const PlatformIcon = ({ platform, className = "w-6 h-6" }: PlatformIconProps) => {
  if (platform === Platform.Kick) {
    return (
      <img src={kickLogo} alt="Kick" className={className} />
    );
  }
  
  if (platform === Platform.TikTok) {
    return (
      <img src={tiktokLogo} alt="TikTok" className={className} />
    );
  }
  
  return (
    <img src={youtubeLogo} alt="YouTube" className={className} />
  );
};
