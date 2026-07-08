// Read ID3 / MP4 tags from an audio file in the browser.
// Returns best-effort track info; every field may be empty.

import jsmediatags from "jsmediatags/dist/jsmediatags.min.js";

export type TrackMeta = {
  title: string;
  artist: string;
  album: string; // often the movie / soundtrack name
  year: string;
};

type JsTagsResult = {
  tags: {
    title?: string;
    artist?: string;
    album?: string;
    year?: string;
    TIT2?: { data?: string };
    TPE1?: { data?: string };
    TALB?: { data?: string };
    TYER?: { data?: string };
  };
};

export function readAudioMetadata(file: File): Promise<TrackMeta> {
  return new Promise((resolve) => {
    const empty: TrackMeta = { title: "", artist: "", album: "", year: "" };
    try {
      jsmediatags.read(file, {
        onSuccess: (res: JsTagsResult) => {
          const t = res.tags || {};
          resolve({
            title: (t.title || t.TIT2?.data || "").toString().trim(),
            artist: (t.artist || t.TPE1?.data || "").toString().trim(),
            album: (t.album || t.TALB?.data || "").toString().trim(),
            year: (t.year || t.TYER?.data || "").toString().trim(),
          });
        },
        onError: () => resolve(empty),
      });
    } catch {
      resolve(empty);
    }
  });
}
