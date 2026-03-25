'use client';

import { useEffect, useState } from 'react';

type Props = {
  playerName: string;
  size?: number;
};

export function PlayerAvatar({ playerName, size = 36 }: Props) {
  const fallback = `https://ui-avatars.com/api/?name=${encodeURIComponent(playerName)}&background=1e3a8a&color=fff`;
  const [src, setSrc] = useState<string>(fallback);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        const response = await fetch(`/api/espn-headshot?name=${encodeURIComponent(playerName)}`);
        if (!response.ok) {
          return;
        }

        const payload = (await response.json()) as { imageUrl?: string | null };
        if (mounted && payload.imageUrl) {
          setSrc(payload.imageUrl);
        }
      } catch {
        // keep fallback avatar
      }
    };

    setSrc(fallback);
    void load();

    return () => {
      mounted = false;
    };
  }, [playerName, fallback]);

  return (
    <img
      src={src}
      alt={playerName}
      width={size}
      height={size}
      loading="lazy"
      referrerPolicy="no-referrer"
      onError={() => setSrc(fallback)}
    />
  );
}
