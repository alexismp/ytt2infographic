const fs = require('fs');
const { google } = require('googleapis');

// Load env vars manually
const envConfig = fs.readFileSync('.env.local', 'utf8');
const apiKeyLine = envConfig.split('\n').find(line => line.startsWith('YOUTUBE_API_KEY='));
const apiKey = apiKeyLine ? apiKeyLine.split('=')[1].trim() : null;

if (!apiKey) {
    console.error('YOUTUBE_API_KEY not found in .env.local');
    process.exit(1);
}

const youtube = google.youtube('v3');
const playlistId = 'PLRsbF2sD7JVrgzHNkX4wUHmoGICMaE446';

async function run() {
    try {
        console.log(`Fetching playlist: ${playlistId}`);

        let totalItems = 0;
        let nextPageToken = undefined;
        let pageCount = 0;
        const seenIds = new Set();

        do {
            pageCount++;
            process.stdout.write(`Fetching page ${pageCount}... `);

            const response = await youtube.playlistItems.list({
                key: apiKey,
                part: ['snippet', 'status'],
                playlistId: playlistId,
                maxResults: 50,
                pageToken: nextPageToken,
            });

            const items = response.data.items || [];
            console.log(`found ${items.length} items.`);

            items.forEach(item => {
                const videoId = item.snippet.resourceId.videoId;
                // Only count public videos to match our app logic
                if (item.status.privacyStatus === 'public' && !seenIds.has(videoId)) {
                    seenIds.add(videoId);
                    totalItems++;
                }
            });

            nextPageToken = response.data.nextPageToken;
        } while (nextPageToken);

        console.log(`\nTotal unique public videos found: ${totalItems}`);

    } catch (error) {
        console.error('Error:', error.message);
    }
}

run();
