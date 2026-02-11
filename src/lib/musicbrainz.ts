const MB_BASE = "https://musicbrainz.org/ws/2";
const MB_USER_AGENT = "MusicReviewAssistant/1.0 (music-review-assistant)";

export interface MBRelease {
  id: string;
  title: string;
  date?: string;
  country?: string;
  status?: string;
  "label-info"?: { label: { name: string } }[];
  "release-group"?: {
    id: string;
    title: string;
    "primary-type"?: string;
    "secondary-types"?: string[];
  };
  "artist-credit"?: {
    artist: { id: string; name: string; "sort-name": string };
  }[];
  media?: {
    "track-count": number;
    tracks?: { title: string; position: number; length?: number }[];
  }[];
}

export interface MBArtist {
  id: string;
  name: string;
  type?: string;
  country?: string;
  "life-span"?: { begin?: string; end?: string; ended?: boolean };
  "begin-area"?: { name: string };
  tags?: { name: string; count: number }[];
  genres?: { name: string; count: number }[];
}

export interface MBStructuredData {
  artist: {
    name: string;
    type?: string;
    country?: string;
    activeFrom?: string;
    tags: string[];
  } | null;
  release: {
    title: string;
    date?: string;
    type?: string;
    label?: string;
    trackCount: number;
    tracks: string[];
  } | null;
}

async function mbFetch<T>(path: string): Promise<T | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(`${MB_BASE}${path}`, {
      signal: controller.signal,
      headers: { "User-Agent": MB_USER_AGENT, Accept: "application/json" },
    });

    clearTimeout(timeout);
    if (!response.ok) return null;
    return response.json() as Promise<T>;
  } catch {
    return null;
  }
}

/**
 * 한국어 포함 여부를 확인한다.
 */
function containsKorean(text: string): boolean {
  return /[\uAC00-\uD7AF\u1100-\u11FF\u3130-\u318F]/.test(text);
}

interface MBArtistSearchResult {
  id: string;
  name: string;
  aliases?: { name: string; locale?: string; type?: string }[];
  score: number;
}

/**
 * 한국어 아티스트명을 MusicBrainz에서 검색하여 영문명을 반환한다.
 * MusicBrainz는 한국어 alias를 인덱싱하므로 한국어 이름으로 검색 가능.
 * 찾지 못하면 원래 이름을 그대로 반환.
 */
export async function resolveArtistName(
  artistName: string
): Promise<{ original: string; resolved: string }> {
  if (!containsKorean(artistName)) {
    return { original: artistName, resolved: artistName };
  }

  const query = encodeURIComponent(artistName);
  const result = await mbFetch<{ artists: MBArtistSearchResult[] }>(
    `/artist/?query=${query}&fmt=json&limit=3`
  );

  if (!result?.artists?.length) {
    return { original: artistName, resolved: artistName };
  }

  // score가 높은 첫 번째 결과의 영문명 사용
  const best = result.artists[0];
  if (best.score >= 80) {
    return { original: artistName, resolved: best.name };
  }

  return { original: artistName, resolved: artistName };
}

export async function searchRelease(
  artistName: string,
  albumName: string
): Promise<MBRelease | null> {
  const query = encodeURIComponent(
    `release:"${albumName}" AND artist:"${artistName}"`
  );
  const result = await mbFetch<{ releases: MBRelease[] }>(
    `/release/?query=${query}&fmt=json&limit=1&inc=artist-credits+labels+recordings+release-groups`
  );
  return result?.releases?.[0] ?? null;
}

export async function fetchArtist(
  artistId: string
): Promise<MBArtist | null> {
  return mbFetch<MBArtist>(`/artist/${artistId}?fmt=json&inc=tags+genres`);
}

export async function fetchMusicBrainzData(
  artistName: string,
  albumName: string
): Promise<MBStructuredData> {
  const release = await searchRelease(artistName, albumName);

  let artist: MBArtist | null = null;
  if (release?.["artist-credit"]?.[0]?.artist?.id) {
    // MusicBrainz rate limit 준수: 1초 대기
    await new Promise((resolve) => setTimeout(resolve, 1100));
    artist = await fetchArtist(release["artist-credit"][0].artist.id);
  }

  return {
    artist: artist
      ? {
          name: artist.name,
          type: artist.type,
          country: artist.country,
          activeFrom: artist["life-span"]?.begin,
          tags: (artist.tags ?? artist.genres ?? [])
            .sort((a, b) => b.count - a.count)
            .slice(0, 5)
            .map((t) => t.name),
        }
      : null,
    release: release
      ? {
          title: release.title,
          date: release.date,
          type: release["release-group"]?.["primary-type"],
          label: release["label-info"]?.[0]?.label?.name,
          trackCount: release.media?.[0]?.["track-count"] ?? 0,
          tracks: (release.media?.[0]?.tracks ?? [])
            .sort((a, b) => a.position - b.position)
            .map((t) => t.title),
        }
      : null,
  };
}
