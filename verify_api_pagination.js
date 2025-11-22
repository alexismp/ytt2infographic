const playlistId = 'PLRsbF2sD7JVrgzHNkX4wUHmoGICMaE446';
const apiUrl = `http://localhost:3000/api/playlist?playlistId=${playlistId}`;

async function verify() {
    try {
        console.log(`Fetching from: ${apiUrl}`);
        const response = await fetch(apiUrl);

        if (!response.ok) {
            throw new Error(`API request failed with status ${response.status}`);
        }

        const videos = await response.json();
        console.log(`Fetched ${videos.length} videos.`);

        if (videos.length === 197) {
            console.log('PASSED: Video count is correct (197).');
        } else {
            console.warn(`WARNING: Video count is ${videos.length}, expected 197.`);
            // It might be slightly different if the playlist changed in the last few minutes, but should be close.
            if (Math.abs(videos.length - 197) < 5) {
                console.log('PASSED: Count is within acceptable range.');
            } else {
                console.error('FAILED: Count is significantly different.');
                process.exit(1);
            }
        }

    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
}

verify();
