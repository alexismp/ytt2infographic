'use client';

import { useState } from 'react';
import { VideoData } from './types';

export default function Home() {
  const [playlistId, setPlaylistId] = useState('');
  const [videos, setVideos] = useState<VideoData[]>([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState<string | null>(null);
  const [infographics, setInfographics] = useState<Record<string, string>>({});
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');

  const fetchVideos = async () => {
    if (!playlistId) return;
    setLoading(true);
    try {
      // Extract ID if URL is provided
      let id = playlistId;
      const urlMatch = playlistId.match(/[?&]list=([^&]+)/);
      if (urlMatch) {
        id = urlMatch[1];
      }

      const res = await fetch(`/api/playlist?playlistId=${id}`);
      const data = await res.json();
      if (Array.isArray(data)) {
        setVideos(data);
      } else {
        alert('Failed to fetch videos: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      console.error(error);
      alert('Error fetching videos');
    } finally {
      setLoading(false);
    }
  };

  const generateInfographic = async (video: VideoData) => {
    setGenerating(video.playlistItemId);
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ video }),
      });
      const data = await res.json();
      if (data.imageUrl) {
        setInfographics(prev => ({ ...prev, [video.playlistItemId]: data.imageUrl }));
      } else {
        alert('Failed to generate: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      console.error(error);
      alert('Error generating infographic');
    } finally {
      setGenerating(null);
    }
  };

  const filteredVideos = videos.filter(video => {
    const query = searchQuery.toLowerCase();
    return (
      video.title.toLowerCase().includes(query) ||
      video.description.toLowerCase().includes(query)
    );
  });

  return (
    <main className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-6xl mx-auto">
        <header className="mb-12 text-center">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent mb-4">
            YouTube to Infographic
          </h1>
          <p className="text-gray-400">
            Powered by Nano Banana Pro
          </p>
        </header>

        <div className="flex gap-4 mb-12 max-w-2xl mx-auto">
          <input
            type="text"
            value={playlistId}
            onChange={(e) => setPlaylistId(e.target.value)}
            placeholder="Enter YouTube Playlist ID or URL"
            className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-yellow-500"
          />
          <button
            onClick={fetchVideos}
            disabled={loading}
            className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold px-6 py-3 rounded-lg transition-colors disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Fetch Videos'}
          </button>
        </div>

        {videos.length > 0 && (
          <div className="mb-8 max-w-md mx-auto">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search videos..."
                className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-500"
              />
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
        )}

        {videos.length > 0 && videos[0].playlistTitle && (
          <h2 className="text-2xl font-bold text-white mb-6">
            {videos[0].playlistTitle}
          </h2>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredVideos.map((video) => (
            <div key={video.playlistItemId} className="bg-gray-800 rounded-xl overflow-hidden border border-gray-700 flex flex-col">
              <div className="relative aspect-video">
                <img
                  src={video.thumbnailUrl}
                  alt={video.title}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-6 flex-1 flex flex-col">
                <h3 className="font-bold text-lg mb-2 line-clamp-2">{video.title}</h3>
                <p className="text-gray-400 text-sm mb-4 line-clamp-3 flex-1">
                  {video.description}
                </p>

                {infographics[video.playlistItemId] ? (
                  <div className="mt-4">
                    <p className="text-xs text-green-400 mb-2 font-semibold">INFOGRAPHIC GENERATED</p>
                    <img
                      src={infographics[video.playlistItemId]}
                      alt="Infographic"
                      className="w-full rounded-lg border border-gray-600"
                    />
                    <button
                      onClick={() => setSelectedImage(infographics[video.playlistItemId])}
                      className="block w-full text-center mt-2 text-sm text-yellow-500 hover:underline focus:outline-none"
                    >
                      View Full Size
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => generateInfographic(video)}
                    disabled={generating === video.playlistItemId}
                    className="w-full bg-gray-700 hover:bg-gray-600 text-white font-semibold py-2 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {generating === video.playlistItemId ? (
                      <>
                        <span className="animate-spin">⏳</span> Generating...
                      </>
                    ) : (
                      'Generate Infographic'
                    )}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-7xl w-full max-h-[90vh] flex flex-col items-center justify-center">
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute -top-12 right-0 text-white hover:text-yellow-500 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <img
              src={selectedImage}
              alt="Full size infographic"
              className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl border border-gray-700"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </main>
  );
}
