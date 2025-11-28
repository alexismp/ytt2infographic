import { GoogleAIFileManager, FileState } from "@google/generative-ai/server";
import { SchemaType, FunctionDeclaration } from "@google/generative-ai";
import ytdl from "@distube/ytdl-core";
import fs from "fs";
import path from "path";
import os from "os";

const fileManager = new GoogleAIFileManager(process.env.GEMINI_API_KEY || "");

// Tool Definition
export const downloadVideoTool: FunctionDeclaration = {
    name: "downloadVideo",
    description: "Downloads a YouTube video from a given URL and uploads it to Google AI File API for analysis. Returns the file URI and MIME type.",
    parameters: {
        type: SchemaType.OBJECT,
        properties: {
            url: {
                type: SchemaType.STRING,
                description: "The full YouTube video URL to download.",
            },
        },
        required: ["url"],
    },
};

// Tool Implementation
export async function downloadAndUploadVideo(url: string): Promise<{ fileUri: string; mimeType: string }> {
    console.log(`[Tool] Downloading video from: ${url}`);

    const videoId = ytdl.getVideoID(url);
    const tempFilePath = path.join(os.tmpdir(), `${videoId}.mp4`);

    // 1. Download Video
    await new Promise<void>((resolve, reject) => {
        ytdl(url, { quality: "18" }) // '18' is usually 360p, good enough for analysis and faster
            .pipe(fs.createWriteStream(tempFilePath))
            .on("finish", () => resolve())
            .on("error", (err) => reject(err));
    });

    console.log(`[Tool] Video downloaded to: ${tempFilePath}`);

    // 2. Upload to Google AI File API
    console.log(`[Tool] Uploading to Google AI File API...`);
    const uploadResult = await fileManager.uploadFile(tempFilePath, {
        mimeType: "video/mp4",
        displayName: `YouTube Video ${videoId}`,
    });

    const fileUri = uploadResult.file.uri;
    console.log(`[Tool] File uploaded. URI: ${fileUri}`);

    // 3. Wait for processing
    let file = await fileManager.getFile(uploadResult.file.name);
    while (file.state === FileState.PROCESSING) {
        console.log(`[Tool] Processing file...`);
        await new Promise((resolve) => setTimeout(resolve, 2000));
        file = await fileManager.getFile(uploadResult.file.name);
    }

    if (file.state === FileState.FAILED) {
        throw new Error("Video processing failed.");
    }

    console.log(`[Tool] File ready for analysis.`);

    // 4. Cleanup local file
    fs.unlinkSync(tempFilePath);

    return {
        fileUri: fileUri,
        mimeType: file.mimeType,
    };
}
