import { useEffect, useState } from "react";
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
  const [hasImageError, setHasImageError] = useState(false);
  const avatarSrc = resolveAssetUrl(avatarUrl);

  useEffect(() => {
    setHasImageError(false);
  }, [avatarUrl]);

  if (avatarSrc && !hasImageError) {
    return (
      <img
        src={avatarSrc}
        alt="Profile"
        className="profile-image"
        onError={() => setHasImageError(true)}
      />
    );
  }

  return <span className="profile-fallback-avatar">{firstLetter(username)}</span>;
}
