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
  if (avatarUrl) {
    return <img src={avatarUrl} alt="Profile" className="profile-image" />;
  }

  return <span className="profile-fallback-avatar">{firstLetter(username)}</span>;
}
