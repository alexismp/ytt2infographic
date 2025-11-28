import { google } from 'googleapis';
import { NextResponse } from 'next/server';
import { VideoData } from '../../types';

const youtube = google.youtube('v3');

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const playlistId = searchParams.get('playlistId');
    const videoId = searchParams.get('videoId');

    if (!playlistId && !videoId) {
        return NextResponse.json({ error: 'Playlist ID or Video ID is required' }, { status: 400 });
    }

    const apiKey = process.env.YOUTUBE_API_KEY;
    if (!apiKey) {
        return NextResponse.json({ error: 'YOUTUBE_API_KEY is not set' }, { status: 500 });
    }

    try {
        if (videoId) {
            const videoResponse = await youtube.videos.list({
                key: apiKey,
                part: ['snippet', 'status'],
                id: [videoId],
            });

            const item = videoResponse.data.items?.[0];

            if (!item || item.status?.privacyStatus !== 'public') {
                return NextResponse.json({ error: 'Video not found or is not public' }, { status: 404 });
            }

            const video: VideoData = {
                id: item.id || '',
                playlistItemId: item.id || '',
                title: item.snippet?.title || '',
                description: item.snippet?.description || '',
                thumbnailUrl: item.snippet?.thumbnails?.high?.url || item.snippet?.thumbnails?.default?.url || '',
                playlistTitle: '',
            };

            return NextResponse.json(video);

        } else if (playlistId) {
            // Fetch playlist details to get the title
            const playlistResponse = await youtube.playlists.list({
                key: apiKey,
                part: ['snippet'],
                id: [playlistId],
            });

            const playlistTitle = playlistResponse.data.items?.[0]?.snippet?.title || '';

            let items: any[] = [];
            let nextPageToken: string | undefined = undefined;

            do {
                const response: any = await youtube.playlistItems.list({
                    key: apiKey,
                    part: ['snippet', 'status'],
                    playlistId: playlistId,
                    maxResults: 50,
                    pageToken: nextPageToken,
                });

                items = items.concat(response.data.items || []);
                nextPageToken = response.data.nextPageToken;
            } while (nextPageToken);
            const seenVideoIds = new Set<string>();

            const videos: VideoData[] = items
                .filter(item => {
                    const videoId = item.snippet?.resourceId?.videoId;
                    const isPublic = item.status?.privacyStatus === 'public';

                    if (!videoId || !isPublic) return false;

                    if (seenVideoIds.has(videoId)) {
                        return false;
                    }

                    seenVideoIds.add(videoId);
                    return true;
                })
                .map((item) => ({
                    id: item.snippet?.resourceId?.videoId || '',
                    playlistItemId: item.id || '',
                    title: item.snippet?.title || '',
                    description: item.snippet?.description || '',
                    thumbnailUrl: item.snippet?.thumbnails?.high?.url || item.snippet?.thumbnails?.default?.url || '',
                    playlistTitle: playlistTitle,
                }));

            return NextResponse.json(videos);
        }
    } catch (error) {
        console.error('Error fetching data:', error);
        return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
    }
}
