const { GoogleGenerativeAI } = require("@google/generative-ai");

const apiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);

async function testGen() {
    try {
        const model = genAI.getGenerativeModel({ model: 'models/gemini-3-pro-image-preview' });
        const prompt = "A futuristic city with flying cars, high resolution, 4k";

        console.log("Generating content...");
        const result = await model.generateContent(prompt);
        const response = await result.response;

        console.log("Response received:");
        // console.log(JSON.stringify(response, null, 2));
        if (response.candidates && response.candidates.length > 0) {
            console.log(JSON.stringify(response.candidates[0].content.parts, null, 2));
        } else {
            console.log("No candidates found");
        }
    } catch (error) {
        console.error("Error generating:", error);
    }
}

testGen();
