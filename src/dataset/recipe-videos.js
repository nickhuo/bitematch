// npm install googleapis csv-writer csv-parser dotenv fs-extra

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const { google } = require('googleapis');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

const DATASET_PATH = path.join(__dirname, '../dataset/sampled_dataset.csv');
const OUTPUT_PATH = path.join(__dirname, './videos.csv');
const SAMPLE_SIZE = 30;

const youtube = google.youtube({
  version: 'v3',
  auth: process.env.YOUTUBE_API_KEY
});


async function readRecipes() {
  return new Promise((resolve, reject) => {
    const recipes = [];
    fs.createReadStream(DATASET_PATH)
      .pipe(csv())
      .on('data', (data) => recipes.push(data))
      .on('end', () => resolve(recipes))
      .on('error', (err) => reject(err));
  });
}


async function readExistingResults() {
  return new Promise((resolve, reject) => {
    // Check if file exists
    if (!fs.existsSync(OUTPUT_PATH)) {
      return resolve([]);
    }
    
    const results = [];
    fs.createReadStream(OUTPUT_PATH)
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', () => resolve(results))
      .on('error', (err) => reject(err));
  });
}


function getRandomRecipes(recipes, count) {
  const shuffled = [...recipes].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}


async function searchYouTubeVideo(recipe) {
  try {
    console.log(`Searching for videos about "${recipe.RecipeTitle}"...`);
    
    const response = await youtube.search.list({
      part: 'snippet',
      q: `${recipe.RecipeTitle} recipe cooking`,
      maxResults: 1, // Just get the top result
      type: 'video'
    });

    if (!response.data.items || response.data.items.length === 0) {
      console.log(`No videos found for "${recipe.RecipeTitle}"`);
      return null;
    }

    const video = response.data.items[0];
    return {
      RecipeID: recipe.RecipeID,
      RecipeTitle: recipe.RecipeTitle,
      VideoTitle: video.snippet.title,
      YouTubeLink: `https://youtube.com/watch?v=${video.id.videoId}`,
      ThumbnailUrl: video.snippet.thumbnails.high.url
    };
  } catch (error) {
    console.error(`Error searching for "${recipe.RecipeTitle}":`, error.message);
    return null;
  }
}

// Generate CSV file with results
async function generateCSV(videoResults) {
  const csvWriter = createCsvWriter({
    path: OUTPUT_PATH,
    header: [
      {id: 'RecipeID', title: 'RecipeID'},
      {id: 'RecipeTitle', title: 'RecipeTitle'},
      {id: 'VideoTitle', title: 'VideoTitle'},
      {id: 'YouTubeLink', title: 'YouTubeLink'},
      {id: 'ThumbnailUrl', title: 'ThumbnailUrl'}
    ]
  });

  try {
    await csvWriter.writeRecords(videoResults.filter(result => result !== null));
    console.log(`CSV file generated: ${OUTPUT_PATH}`);
    return OUTPUT_PATH;
  } catch (error) {
    console.error('Error generating CSV file:', error.message);
    throw error;
  }
}

// Main function
async function main() {
  try {
    if (!process.env.YOUTUBE_API_KEY) {
      console.error('Error: YOUTUBE_API_KEY environment variable not set');
      console.log('Please create a .env file and add: YOUTUBE_API_KEY=your_youtube_api_key');
      return;
    }

    // Read existing results first
    const existingResults = await readExistingResults();
    console.log(`Found ${existingResults.length} existing recipe videos in results file`);
    

    const existingRecipeIds = new Set(existingResults.map(result => result.RecipeID));
    

    const allRecipes = await readRecipes();
    console.log(`Found ${allRecipes.length} recipes in the dataset`);
    
    // Filter out recipes that are already in results
    const newRecipes = allRecipes.filter(recipe => !existingRecipeIds.has(recipe.RecipeID));
    console.log(`Found ${newRecipes.length} recipes that don't have YouTube videos yet`);
    

    const sampledRecipes = getRandomRecipes(newRecipes, SAMPLE_SIZE);
    console.log(`Selected ${sampledRecipes.length} random recipes for YouTube search`);
    

    const newResults = [];
    for (const recipe of sampledRecipes) {
      const result = await searchYouTubeVideo(recipe);
      if (result) newResults.push(result);
      
      // Add a small delay to avoid hitting API rate limits
      await new Promise(resolve => setTimeout(resolve, 300));
    }
    

    const allResults = [...existingResults, ...newResults];
    console.log(`Adding ${newResults.length} new videos to existing ${existingResults.length} videos`);
    

    await generateCSV(allResults);
    console.log(`Successfully saved ${allResults.length} videos total`);
    console.log(`Results saved to: ${OUTPUT_PATH}`);
  } catch (error) {
    console.error('Program execution failed:', error.message);
  }
}

main();