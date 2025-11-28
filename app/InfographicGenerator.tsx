'use client';

import { useState, useEffect } from 'react';
import { VideoData } from './types';

interface InfographicGeneratorProps {
    videoUrl: string;
}

export default function InfographicGenerator({ videoUrl }: InfographicGeneratorProps) {
    const [video, setVideo] = useState<VideoData | null>(null);
    const [infographic, setInfographic] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [generating, setGenerating] = useState(false);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);

    useEffect(() => {
        const fetchVideoData = async () => {
            setLoading(true);
            try {
                const videoId = new URL(videoUrl).searchParams.get('v');
                if (!videoId) {
                    alert('Invalid YouTube URL');
                    return;
                }
                const res = await fetch(`/api/playlist?videoId=${videoId}`);
                const data = await res.json();
                if (data && !data.error) {
                    setVideo(data);
                    generateInfographic(data);
                } else {
                    alert('Failed to fetch video data: ' + (data.error || 'Unknown error'));
                }
            } catch (error) {
                console.error(error);
                alert('Error fetching video data');
            } finally {
                setLoading(false);
            }
        };

        if (videoUrl) {
            fetchVideoData();
        }
    }, [videoUrl]);

    const generateInfographic = async (videoData: VideoData) => {
        setGenerating(true);
        try {
            const res = await fetch('/api/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ video: videoData }),
            });
            const data = await res.json();
            if (data.imageUrl) {
                setInfographic(data.imageUrl);
            } else {
                alert('Failed to generate: ' + (data.error || 'Unknown error'));
            }
        } catch (error) {
            console.error(error);
            alert('Error generating infographic');
        } finally {
            setGenerating(false);
        }
    };

    if (loading) {
        return <p className="text-center">Loading video data...</p>;
    }

    if (!video) {
        return null;
    }

    return (
        <div className="max-w-2xl mx-auto">
            <div className="bg-gray-800 rounded-xl overflow-hidden border border-gray-700 flex flex-col">
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

                    {generating && (
                        <div className="mt-4 text-center">
                            <span className="animate-spin">⏳</span> Generating Infographic...
                        </div>
                    )}

                    {infographic && (
                        <div className="mt-4">
                            <p className="text-xs text-green-400 mb-2 font-semibold">INFOGRAPHIC GENERATED</p>
                            <img
                                src={infographic}
                                alt="Infographic"
                                className="w-full rounded-lg border border-gray-600"
                            />
                            <button
                                onClick={() => setSelectedImage(infographic)}
                                className="block w-full text-center mt-2 text-sm text-yellow-500 hover:underline focus:outline-none"
                            >
                                View Full Size
                            </button>
                        </div>
                    )}
                </div>
            </div>
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
        </div>
    );
}
