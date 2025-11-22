import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';
import { InfographicRequest } from '../../types';
import { downloadVideoTool, downloadAndUploadVideo } from './tools';

export const maxDuration = 300; // 5 minutes timeout for video processing

export async function POST(request: Request) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        return NextResponse.json({ error: 'GEMINI_API_KEY is not set' }, { status: 500 });
    }

    try {
        const body: InfographicRequest = await request.json();
        const { video } = body;

        if (!video) {
            return NextResponse.json({ error: 'Video data is required' }, { status: 400 });
        }

        const genAI = new GoogleGenerativeAI(apiKey);

        // --- Step 1: Analyze Video with Gemini 3 Pro ---
        console.log('--- Step 1: Analyzing Video ---');
        const analysisModel = genAI.getGenerativeModel({
            model: 'models/gemini-3-pro-preview',
            tools: [{ functionDeclarations: [downloadVideoTool] }],
        });

        const chat = analysisModel.startChat();

        const analysisPrompt = `
            You are an expert visual designer. 
            I need you to analyze the YouTube video at this URL: https://www.youtube.com/watch?v=${video.id}
            
            First, use the 'downloadVideo' tool to access the video content.
            
            Once you have access to the video, analyze it to determine:
            1. The core theme and key topics.
            2. The visual style, color palette, and mood of the video.
            3. Key imagery or scenes that would make a compelling infographic.
            
            Output a detailed description for an infographic that summarizes this video. 
            Focus on visual elements that I can pass to an image generation model.
        `;

        console.log('Sending analysis prompt...');
        const result1 = await chat.sendMessage(analysisPrompt);
        const call = result1.response.functionCalls()?.[0];

        let analysisText = "";

        if (call) {
            if (call.name === 'downloadVideo') {
                const { url } = call.args as { url: string };
                console.log('Model requested video download for:', url);

                // Execute Tool
                const { fileUri, mimeType } = await downloadAndUploadVideo(url);

                // Send Tool Response + File Data
                console.log('Sending tool response and video file to model...');
                const result2 = await chat.sendMessage([
                    {
                        functionResponse: {
                            name: 'downloadVideo',
                            response: { fileUri, mimeType, status: 'success' }
                        }
                    },
                    {
                        fileData: {
                            fileUri: fileUri,
                            mimeType: mimeType
                        }
                    },
                    {
                        text: "Here is the video file. Please proceed with the visual analysis for the infographic."
                    }
                ]);

                analysisText = result2.response.text();
            }
        } else {
            // Fallback if model didn't call tool (unlikely with this prompt)
            console.warn('Model did not call the tool. Using text-only analysis.');
            analysisText = result1.response.text();
        }

        console.log('Analysis received:', analysisText.slice(0, 100) + '...');

        // --- Step 2: Generate Infographic with Gemini 3 Pro Image ---
        console.log('--- Step 2: Generating Infographic ---');
        const imageModel = genAI.getGenerativeModel({ model: 'models/gemini-3-pro-image-preview' });

        const imagePrompt = `
            Create a professional, high-resolution infographic based on the following video analysis:
            
            ${analysisText}
            
            Context:
            Title: "${video.title}"
            ${video.playlistTitle ? `Playlist: "${video.playlistTitle}"` : ''}
            
            Design Requirements:
            - Modern, clean, professional design.
            - Vibrant colors matching the video's mood.
            - Engaging typography.
            - Include the video title prominently.
        `;

        console.log('Generating image...');
        const imageResult = await imageModel.generateContent(imagePrompt);
        const imageResponse = await imageResult.response;

        const candidate = imageResponse.candidates?.[0];
        const part = candidate?.content?.parts?.[0];

        if (part && part.inlineData && part.inlineData.data) {
            const mimeType = part.inlineData.mimeType || 'image/png';
            const imageBase64 = part.inlineData.data;
            return NextResponse.json({ imageUrl: `data:${mimeType};base64,${imageBase64}` });
        } else {
            throw new Error('No image data in response');
        }

    } catch (error: any) {
        console.error('Error generating infographic:', error);
        return NextResponse.json({ error: error.message || 'Failed to generate infographic' }, { status: 500 });
    }
}
