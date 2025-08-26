export type RawAd = any;

export type Classified = {
  adArchiveId?: string;
  pageProfileUri?: string;
  pageId?: string | number;
  pageName?: string;
  isActive: boolean;
  likeCount: number;
  images: string[];       // image URLs
  videos: string[];       // video sd URLs
  contentType: "text" | "image+text" | "text+video";
  textBlocks: string[];   // primary text, headline, description, etc.
  thumbnail?: string | null;
};

// helpers to safely read common FB Ad Library fields
function getStrings(x: any): string[] {
  return (Array.isArray(x) ? x : [x]).filter(Boolean).map(String);
}

export function normalizeAd(ad: RawAd): Classified {
  const likeCount =
    Number(ad?.like_count ?? ad?.insights?.likes ?? ad?.likes ?? 0) || 0;

  const isActive = Boolean(
    ad?.is_active ?? (ad?.ad_delivery_start_time && !ad?.ad_delivery_stop_time) ?? false
  );

  const images = [
    ...(getStrings(ad?.image_sd_url)),
    ...(getStrings(ad?.image_url)),
    ...(Array.isArray(ad?.media) ? ad.media.filter((m: any) => m?.type === "image").map((m: any) => m?.url) : [])
  ].filter(Boolean);

  const videos = [
    ...(getStrings(ad?.video_sd_url)),
    ...(Array.isArray(ad?.media) ? ad.media.filter((m: any) => m?.type === "video").map((m: any) => m?.sd_url || m?.url) : [])
  ].filter(u => typeof u === "string" && u.includes("https://video"));

  const textBlocks = [
    ad?.ad_creative_body,
    ad?.ad_creative_link_caption,
    ad?.ad_creative_link_description,
    ad?.ad_creative_link_title,
    ad?.message,
  ].filter(Boolean).map(String);

  let contentType: Classified["contentType"] = "text";
  const hasImage = images.length > 0;
  const hasVideo = videos.length > 0;

  if (!hasImage && !hasVideo) contentType = "text";
  else if (hasImage && !hasVideo) contentType = "image+text";
  else contentType = "text+video";

  return {
    adArchiveId: ad?.ad_archive_id || ad?.archive_id || ad?.id,
    pageProfileUri: ad?.page_profile_uri || ad?.page_profile_url,
    pageId: ad?.page_id || ad?.page?.id,
    pageName: ad?.page_name || ad?.page?.name,
    isActive,
    likeCount,
    images,
    videos,
    contentType,
    textBlocks,
    thumbnail: ad?.thumbnail_url || ad?.video_thumbnail_url || null,
  };
}

export function passesPrefilter(c: Classified): boolean {
  // only ads with min 1 like and active = true
  return c.likeCount >= 1 && c.isActive === true;
} 