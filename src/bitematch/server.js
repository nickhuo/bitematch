const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const { google } = require('googleapis');

const app = express();
const port = 3001;

// YouTube API toggle - set to false to disable YouTube API calls
const ENABLE_YOUTUBE_API = true;

// YouTube API configuration
const youtube = ENABLE_YOUTUBE_API ? google.youtube({
  version: 'v3',
  auth: process.env.YOUTUBE_API_KEY || 'AIzaSyBxBbuXh9Im5mKH-rvyaGx9qRTCXjnLGDQ' 
}) : null;

app.use(cors());
app.use(express.json());

// MySQL connection
const connection = mysql.createConnection({
  host: "localhost",
  port: 3306,
  user: "root",
  password: "nickhuo*",
  database: "bitematch"
});

connection.connect((err) => {
  if (err) {
    console.error("Error connecting to the database:", err);
    return;
  }
  console.log("Connected to MySQL database.");
});

// User login/register endpoint
app.post("/api/users/login", (req, res) => {
  const { email } = req.body;

  console.log("Received login request for email:", email);

  if (!email) {
    return res.status(400).json({ error: "Email is required" });
  }

  const findUserQuery = "SELECT * FROM Users WHERE Email = ?";
  console.log("Executing query:", findUserQuery, "with email:", email);

  connection.query(findUserQuery, [email], (error, results) => {
    if (error) {
      console.error("Error finding user:", error);
      return res.status(500).json({ error: "Database error: " + error.message });
    }

    console.log("Query results:", results);

    if (results.length > 0) {
      // User exists
      return res.json({ user: results[0], isNewUser: false });
    } else {
      // Create new user
      const createUserQuery = "INSERT INTO Users (Email, Username) VALUES (?, ?)";
      console.log("Creating new user with query:", createUserQuery, "email:", email);

      connection.query(createUserQuery, [email, email], (createError, createResult) => {
        if (createError) {
          console.error("Error creating user:", createError);
          return res.status(500).json({ error: "Database error: " + createError.message });
        }

        console.log("Successfully created new user:", createResult);

        const newUser = {
          UserID: createResult.insertId,
          Username: email,
          Email: email
        };
        return res.json({ user: newUser, isNewUser: true });
      });
    }
  });
});

// Fetch ingredients by recipe ID
app.get("/api/ingredients/:recipeId", (req, res) => {
  const recipeId = req.params.recipeId;
  const query = `
    SELECT IngredientName_Recipe, IngredientName_Nutrition, IngredientID, Quantity
    FROM ComposedOf
    WHERE RecipeID = ?
  `;
  connection.query(query, [recipeId], (error, results) => {
    if (error) {
      console.error("Error executing query:", error);
      return res.status(500).json({ error });
    }
    res.json(results);
  });
});

// Get one random recipe
app.get("/api/recipes/random", (req, res) => {
  const query = "SELECT * FROM Recipe ORDER BY RAND() LIMIT 1";
  connection.query(query, (error, results) => {
    if (error) {
      console.error("Error selecting random recipe:", error);
      return res.status(500).json({ error });
    }
    if (results.length === 0) {
      return res.status(404).json({ message: "No recipes found." });
    }
    res.json(results[0]);
  });
});

// Fetch specific recipe by ID
app.get("/api/recipes/:id", (req, res) => {
  const recipeId = req.params.id;
  const query = "SELECT * FROM Recipe WHERE RecipeID = ?";
  connection.query(query, [recipeId], (error, results) => {
    if (error) {
      console.error("Error fetching recipe by ID:", error);
      return res.status(500).json({ error });
    }
    if (results.length === 0) {
      return res.status(404).json({ message: "Recipe not found." });
    }
    res.json(results[0]);
  });
});

// Search for recipes containing ALL specified ingredients
app.post("/api/search/ingredients", (req, res) => {
  const ingredients = req.body.ingredients;

  if (!Array.isArray(ingredients) || ingredients.length === 0) {
    return res.status(400).json({ error: "Invalid or empty ingredients list" });
  }

  const placeholders = ingredients.map(() => '?').join(',');
  const query = `
    SELECT Recipe.RecipeID, Recipe.RecipeTitle
    FROM Recipe
    JOIN ComposedOf ON Recipe.RecipeID = ComposedOf.RecipeID
    WHERE ComposedOf.IngredientName_Recipe IN (${placeholders})
    GROUP BY Recipe.RecipeID
    HAVING COUNT(DISTINCT ComposedOf.IngredientName_Recipe) = ?
  `;

  connection.query(query, [...ingredients, ingredients.length], (err, results) => {
    if (err) {
      console.error("Error during multi-ingredient search:", err);
      return res.status(500).json({ error: "Database error" });
    }
    
    res.json(results);
  });
});


// Get all reviews for a recipe
app.get("/api/reviews/:recipeId", (req, res) => {
  const recipeId = req.params.recipeId;
  const query = "SELECT ReviewID, Stars, Comments FROM Review WHERE RecipeID = ?";
  connection.query(query, [recipeId], (error, results) => {
    if (error) {
      console.error("Error fetching reviews:", error);
      return res.status(500).json({ error });
    }
    console.log('Raw MySQL results:', results);
    
    let reviews = [];
    if (Array.isArray(results)) {
      reviews = results.map(result => ({
        ReviewID: result.ReviewID,
        Stars: result.Stars || 0,
        Comments: result.Comments || ''
      }));
    }
    
    console.log('Processed reviews:', reviews);
    res.json(reviews);
  });
});

// Fetch video by recipe ID
app.get("/api/videos/:recipeId", (req, res) => {
  const recipeId = req.params.recipeId;
  const query = `
    SELECT VideoTitle as Title, YouTubeLink as Link
    FROM Video
    WHERE RecipeID = ?
  `;
  connection.query(query, [recipeId], (error, results) => {
    if (error) {
      console.error("Error fetching video:", error);
      return res.status(500).json({ error });
    }
    if (results.length === 0) {
      return res.status(404).json({ message: "No video found for this recipe." });
    }
    const video = results[0];
    res.json({
      Title: video.Title,
      Link: video.Link
    });
  });
});

// Check if recipe is saved
app.get("/api/actions/check-saved", (req, res) => {
  const { userId, recipeId } = req.query;
  
  if (!userId || !recipeId) {
    return res.status(400).json({ error: "Missing userId or recipeId" });
  }

  const query = "SELECT * FROM Action WHERE UserID = ? AND RecipeID = ? AND ActionType = 'save'";
  connection.query(query, [userId, recipeId], (error, results) => {
    if (error) {
      console.error("Error checking saved status:", error);
      return res.status(500).json({ error: "Database error: " + error.message });
    }
    res.json({ isSaved: results.length > 0 });
  });
});

// Save recipe action
app.post("/api/actions/save", (req, res) => {
  const { userId, recipeId } = req.body;
  
  if (!userId || !recipeId) {
    return res.status(400).json({ error: "Missing userId or recipeId" });
  }

  // First check if already saved
  const checkQuery = "SELECT * FROM Action WHERE UserID = ? AND RecipeID = ? AND ActionType = 'save'";
  connection.query(checkQuery, [userId, recipeId], (checkError, checkResults) => {
    if (checkError) {
      console.error("Error checking existing save:", checkError);
      return res.status(500).json({ error: "Database error: " + checkError.message });
    }

    if (checkResults.length > 0) {
      return res.status(400).json({ error: "Recipe already saved" });
    }

    // If not saved, proceed with saving
    const saveQuery = "INSERT INTO Action (ActionType, UserID, RecipeID) VALUES ('save', ?, ?)";
    connection.query(saveQuery, [userId, recipeId], (saveError, saveResults) => {
      if (saveError) {
        console.error("Error saving recipe:", saveError);
        return res.status(500).json({ error: "Database error: " + saveError.message });
      }
      res.json({ success: true });
    });
  });
});

// Get saved recipes for user
app.get("/api/actions/saved/:userId", (req, res) => {
  const userId = req.params.userId;
  const query = `
    SELECT DISTINCT r.*, a.Time as SavedTime 
    FROM Recipe r 
    JOIN Action a ON r.RecipeID = a.RecipeID 
    WHERE a.UserID = ? AND a.ActionType = 'save'
    ORDER BY a.Time DESC
  `;
  
  connection.query(query, [userId], (error, results) => {
    if (error) {
      console.error("Error fetching saved recipes:", error);
      return res.status(500).json({ error: "Database error: " + error.message });
    }
    res.json(results);
  });
});

// Delete saved recipe
app.delete("/api/actions/save", (req, res) => {
  const { userId, recipeId } = req.query;
  
  if (!userId || !recipeId) {
    return res.status(400).json({ error: "Missing userId or recipeId" });
  }

  const query = "DELETE FROM Action WHERE UserID = ? AND RecipeID = ? AND ActionType = 'save'";
  connection.query(query, [userId, recipeId], (error, results) => {
    if (error) {
      console.error("Error deleting saved recipe:", error);
      return res.status(500).json({ error: "Database error: " + error.message });
    }
    res.json({ success: true });
  });
});

// Search YouTube and save video to database
app.post("/api/videos/search", async (req, res) => {
  const { recipeId, recipeTitle } = req.body;
  
  if (!recipeId || !recipeTitle) {
    return res.status(400).json({ error: "Recipe ID and title are required" });
  }

  // Check if YouTube API is disabled
  if (!ENABLE_YOUTUBE_API) {
    console.log("YouTube API is disabled. Skipping video search.");
    return res.status(503).json({ 
      message: "YouTube API is currently disabled",
      disabled: true 
    });
  }


  connection.beginTransaction(async err => {
    if (err) {
      console.error("Error starting transaction:", err);
      return res.status(500).json({ error: "Database error: " + err.message });
    }

    try {
      const checkQuery = "SELECT * FROM Video WHERE RecipeID = ? FOR UPDATE";
      connection.query(checkQuery, [recipeId], async (checkError, checkResults) => {
        if (checkError) {
          connection.rollback(() => {
            console.error("Error checking existing video:", checkError);
            return res.status(500).json({ error: "Database error: " + checkError.message });
          });
          return;
        }

        // If video already exists, return it and commit transaction
        if (checkResults.length > 0) {
          connection.commit(commitErr => {
            if (commitErr) {
              connection.rollback(() => {
                console.error("Error committing transaction:", commitErr);
                return res.status(500).json({ error: "Database error: " + commitErr.message });
              });
              return;
            }

            console.log(`Video for recipe ID ${recipeId} already exists, using existing entry`);
            return res.json({
              Title: checkResults[0].VideoTitle,
              Link: checkResults[0].YouTubeLink
            });
          });
          return;
        }

        // If no video found, search YouTube
        try {
          console.log(`Searching YouTube for "${recipeTitle}" recipe...`);
          
          const response = await youtube.search.list({
            part: 'snippet',
            q: `${recipeTitle} recipe cooking`,
            maxResults: 1,
            type: 'video'
          });

          if (!response.data.items || response.data.items.length === 0) {
            connection.rollback(() => {
              console.log(`No videos found for "${recipeTitle}"`);
              return res.status(404).json({ message: "No videos found for this recipe" });
            });
            return;
          }

          const video = response.data.items[0];
          const videoData = {
            VideoTitle: video.snippet.title,
            YouTubeLink: `https://youtube.com/watch?v=${video.id.videoId}`,
            ThumbnailUrl: video.snippet.thumbnails.high.url,
            RecipeID: recipeId
          };


          const insertQuery = `
            INSERT IGNORE INTO Video (VideoTitle, YouTubeLink, ThumbnailUrl, RecipeID) 
            VALUES (?, ?, ?, ?)
          `;
          
          connection.query(
            insertQuery, 
            [videoData.VideoTitle, videoData.YouTubeLink, videoData.ThumbnailUrl, videoData.RecipeID],
            (insertError, insertResults) => {
              if (insertError) {
                connection.rollback(() => {
                  console.error("Error saving video to database:", insertError);
                  return res.status(500).json({ error: "Database error: " + insertError.message });
                });
                return;
              }

              connection.commit(commitErr => {
                if (commitErr) {
                  connection.rollback(() => {
                    console.error("Error committing transaction:", commitErr);
                    return res.status(500).json({ error: "Database error: " + commitErr.message });
                  });
                  return;
                }

                if (insertResults.affectedRows > 0) {
                  console.log(`Video saved to database for recipe ID ${recipeId}`);
                } else {
                  console.log(`Video for recipe ID ${recipeId} already exists (caught by INSERT IGNORE)`);
                }

                res.json({
                  Title: videoData.VideoTitle,
                  Link: videoData.YouTubeLink
                });
              });
            }
          );
        } catch (youtubeError) {
          connection.rollback(() => {
            console.error(`Error searching YouTube:`, youtubeError.message);
            res.status(500).json({ error: "YouTube API error: " + youtubeError.message });
          });
        }
      });
    } catch (error) {
      connection.rollback(() => {
        console.error("Server error:", error);
        res.status(500).json({ error: "Server error: " + error.message });
      });
    }
  });
});

// Add review for a recipe
app.post("/api/reviews", (req, res) => {
  const { recipeId, comments, stars } = req.body;
  if (!recipeId || !comments) {
    return res.status(400).json({ error: "Missing recipeId or comments" });
  }
  
  const query = stars 
    ? "INSERT INTO Review (RecipeID, Comments, Stars) VALUES (?, ?, ?)"
    : "INSERT INTO Review (RecipeID, Comments) VALUES (?, ?)";
  
  const params = stars ? [recipeId, comments, stars] : [recipeId, comments];
  
  connection.query(query, params, (error, results) => {
    if (error) {
      console.error("Error adding review:", error);
      return res.status(500).json({ error: "Database error" });
    }
    res.status(201).json({ success: true, reviewId: results.insertId });
  });
});

app.get("/api/recipes/:id/calories", (req, res) => {
  const recipeId = req.params.id;
  connection.query("CALL CalcRecipeCalories(?)", [recipeId], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    
    const row = results[0][0]; // <--- ONLY 1 RESULTSET
    res.json({ 
      calories: row ? row.TotalCalories : 0,
      closestRecipeId: row ? row.ClosestRecipeID : null,
      closestRecipeTitle: row ? row.ClosestRecipeTitle : null
    });
  });
});




app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});