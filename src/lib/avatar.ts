import type { AuthUser } from "./authClient";

export function getAvatarInitials(name: string) {
  const trimmedName = name.trim();
  if (!trimmedName) return "U";

  const words = trimmedName.split(/\s+/).filter(Boolean);
  if (words.length === 1) {
    return words[0].slice(0, 2).toUpperCase();
  }

  return words
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase())
    .join("");
}

export function getAvatarImageUrl(user: AuthUser | null) {
  if (!user) return null;

  const explicitImage = user.avatarUrl ?? user.photoUrl ?? user.profileImageUrl;
  if (explicitImage && explicitImage.trim()) {
    return explicitImage.trim();
  }

  const seed = encodeURIComponent(user.name.trim() || user.email.trim() || "User");
  return `https://api.dicebear.com/9.x/thumbs/svg?seed=${seed}`;
}
