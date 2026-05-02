import { SiGithub, SiGitlab, SiBitbucket, SiSlack, SiZoho } from "react-icons/si";

const icons: Record<string, React.ComponentType<{ size?: number; color?: string; className?: string }>> = {
  github: SiGithub,
  gitlab: SiGitlab,
  bitbucket: SiBitbucket,
  slack: SiSlack,
  zoho: SiZoho,
};

const colors: Record<string, string> = {
  github: "#e6edf3",
  gitlab: "#FC6D26",
  bitbucket: "#0052CC",
  slack: "#E01E5A",
  zoho: "#E42527",
};

interface PlatformIconProps {
  platform: string;
  size?: number;
  className?: string;
}

export function PlatformIcon({ platform, size = 16, className }: PlatformIconProps) {
  const Icon = icons[platform];
  if (!Icon) return null;
  return <Icon size={size} color={colors[platform]} className={className} />;
}

export { colors as PLATFORM_COLORS };
