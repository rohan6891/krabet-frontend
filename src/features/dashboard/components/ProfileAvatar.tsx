import { useState } from "react";
import { resolveAssetUrl } from "@/shared/utils/assetUrl";

type ProfileAvatarProps = {
  username: string;
  avatarUrl: string | null;
};

function firstLetter(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) {
    return "U";
  }
  return trimmed.charAt(0).toUpperCase();
}

export function ProfileAvatar({ username, avatarUrl }: ProfileAvatarProps) {
  const [failedAvatarSrc, setFailedAvatarSrc] = useState<string | null>(null);
  const avatarSrc = resolveAssetUrl(avatarUrl);

  if (avatarSrc && avatarSrc !== failedAvatarSrc) {
    return (
      <img
        src={avatarSrc}
        alt="Profile"
        className="profile-image"
        onError={() => setFailedAvatarSrc(avatarSrc)}
      />
    );
  }

  return <span className="profile-fallback-avatar">{firstLetter(username)}</span>;
}
