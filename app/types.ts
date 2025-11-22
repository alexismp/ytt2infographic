export interface VideoData {
  id: string;
  playlistItemId: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  playlistTitle?: string;
}

export interface InfographicRequest {
  video: VideoData;
}

export interface InfographicResponse {
  imageUrl: string;
}
