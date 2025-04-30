"use strict";

function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _nonIterableSpread(); }

function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance"); }

function _iterableToArray(iter) { if (Symbol.iterator in Object(iter) || Object.prototype.toString.call(iter) === "[object Arguments]") return Array.from(iter); }

function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = new Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } }

var express = require("express");

var mysql = require("mysql2");

var cors = require("cors");

var app = express();
var port = 3001;
app.use(cors());
app.use(express.json()); // MySQL connection

var connection = mysql.createConnection({
  host: "localhost",
  port: 3306,
  user: "root",
  password: "nickhuo*",
  database: "bitematch"
});
connection.connect(function (err) {
  if (err) {
    console.error("Error connecting to the database:", err);
    return;
  }

  console.log("Connected to MySQL database.");
}); // User login/register endpoint

app.post("/api/users/login", function (req, res) {
  var email = req.body.email;
  console.log("Received login request for email:", email);

  if (!email) {
    return res.status(400).json({
      error: "Email is required"
    });
  }

  var findUserQuery = "SELECT * FROM Users WHERE Email = ?";
  console.log("Executing query:", findUserQuery, "with email:", email);
  connection.query(findUserQuery, [email], function (error, results) {
    if (error) {
      console.error("Error finding user:", error);
      return res.status(500).json({
        error: "Database error: " + error.message
      });
    }

    console.log("Query results:", results);

    if (results.length > 0) {
      // User exists
      return res.json({
        user: results[0],
        isNewUser: false
      });
    } else {
      // Create new user
      var createUserQuery = "INSERT INTO Users (Email, Username) VALUES (?, ?)";
      console.log("Creating new user with query:", createUserQuery, "email:", email);
      connection.query(createUserQuery, [email, email], function (createError, createResult) {
        if (createError) {
          console.error("Error creating user:", createError);
          return res.status(500).json({
            error: "Database error: " + createError.message
          });
        }

        console.log("Successfully created new user:", createResult);
        var newUser = {
          UserID: createResult.insertId,
          Username: email,
          Email: email
        };
        return res.json({
          user: newUser,
          isNewUser: true
        });
      });
    }
  });
}); // Fetch ingredients by recipe ID

app.get("/api/ingredients/:recipeId", function (req, res) {
  var recipeId = req.params.recipeId;
  var query = "\n    SELECT IngredientName_Recipe, IngredientName_Nutrition, IngredientID, Quantity\n    FROM ComposedOf\n    WHERE RecipeID = ?\n  ";
  connection.query(query, [recipeId], function (error, results) {
    if (error) {
      console.error("Error executing query:", error);
      return res.status(500).json({
        error: error
      });
    }

    res.json(results);
  });
}); // Get one random recipe

app.get("/api/recipes/random", function (req, res) {
  var query = "SELECT * FROM Recipe ORDER BY RAND() LIMIT 1";
  connection.query(query, function (error, results) {
    if (error) {
      console.error("Error selecting random recipe:", error);
      return res.status(500).json({
        error: error
      });
    }

    if (results.length === 0) {
      return res.status(404).json({
        message: "No recipes found."
      });
    }

    res.json(results[0]);
  });
}); // Fetch specific recipe by ID

app.get("/api/recipes/:id", function (req, res) {
  var recipeId = req.params.id;
  var query = "SELECT * FROM Recipe WHERE RecipeID = ?";
  connection.query(query, [recipeId], function (error, results) {
    if (error) {
      console.error("Error fetching recipe by ID:", error);
      return res.status(500).json({
        error: error
      });
    }

    if (results.length === 0) {
      return res.status(404).json({
        message: "Recipe not found."
      });
    }

    res.json(results[0]);
  });
}); // Search for recipes containing ALL specified ingredients

app.post("/api/search/ingredients", function (req, res) {
  var ingredients = req.body.ingredients;

  if (!Array.isArray(ingredients) || ingredients.length === 0) {
    return res.status(400).json({
      error: "Invalid or empty ingredients list"
    });
  }

  var placeholders = ingredients.map(function () {
    return '?';
  }).join(',');
  var query = "\n    SELECT Recipe.RecipeID, Recipe.RecipeTitle\n    FROM Recipe\n    JOIN ComposedOf ON Recipe.RecipeID = ComposedOf.RecipeID\n    WHERE ComposedOf.IngredientName_Recipe IN (".concat(placeholders, ")\n    GROUP BY Recipe.RecipeID\n    HAVING COUNT(DISTINCT ComposedOf.IngredientName_Recipe) = ?\n  ");
  connection.query(query, [].concat(_toConsumableArray(ingredients), [ingredients.length]), function (err, results) {
    if (err) {
      console.error("Error during multi-ingredient search:", err);
      return res.status(500).json({
        error: "Database error"
      });
    }

    res.json(results);
  });
});
/* // Add review for a recipe
app.post("/api/reviews", (req, res) => {
  const { recipeId, content } = req.body;
  if (!recipeId || !content) {
    return res.status(400).json({ error: "Missing recipeId or content" });
  }
  const query = "INSERT INTO Review (RecipeID, Content) VALUES (?, ?)";
  connection.query(query, [recipeId, content], (error, results) => {
    if (error) {
      console.error("Error adding review:", error);
      return res.status(500).json({ error });
    }
    res.status(201).json({ success: true });
  });
}); */
// Get all reviews for a recipe

app.get("/api/reviews/:recipeId", function (req, res) {
  var recipeId = req.params.recipeId;
  var query = "SELECT Comments FROM Review WHERE RecipeID = ?";
  connection.query(query, [recipeId], function (error, results) {
    if (error) {
      console.error("Error fetching reviews:", error);
      return res.status(500).json({
        error: error
      });
    }

    console.log('Raw MySQL results:', results);
    var reviews = [];

    if (Array.isArray(results)) {
      reviews = results.map(function (result) {
        return {
          Comments: result.Comments || ''
        };
      });
    }

    console.log('Processed reviews:', reviews);
    res.json(reviews);
  });
}); // Fetch video by recipe ID

app.get("/api/videos/:recipeId", function (req, res) {
  var recipeId = req.params.recipeId;
  var query = "\n    SELECT VideoTitle as Title, YouTubeLink as Link\n    FROM Video\n    WHERE RecipeID = ?\n  ";
  connection.query(query, [recipeId], function (error, results) {
    if (error) {
      console.error("Error fetching video:", error);
      return res.status(500).json({
        error: error
      });
    }

    if (results.length === 0) {
      return res.status(404).json({
        message: "No video found for this recipe."
      });
    }

    var video = results[0];
    res.json({
      Title: video.Title,
      Link: video.Link
    });
  });
}); // Check if recipe is saved

app.get("/api/actions/check-saved", function (req, res) {
  var _req$query = req.query,
      userId = _req$query.userId,
      recipeId = _req$query.recipeId;

  if (!userId || !recipeId) {
    return res.status(400).json({
      error: "Missing userId or recipeId"
    });
  }

  var query = "SELECT * FROM Action WHERE UserID = ? AND RecipeID = ? AND ActionType = 'save'";
  connection.query(query, [userId, recipeId], function (error, results) {
    if (error) {
      console.error("Error checking saved status:", error);
      return res.status(500).json({
        error: "Database error: " + error.message
      });
    }

    res.json({
      isSaved: results.length > 0
    });
  });
}); // Save recipe action

app.post("/api/actions/save", function (req, res) {
  var _req$body = req.body,
      userId = _req$body.userId,
      recipeId = _req$body.recipeId;

  if (!userId || !recipeId) {
    return res.status(400).json({
      error: "Missing userId or recipeId"
    });
  } // First check if already saved


  var checkQuery = "SELECT * FROM Action WHERE UserID = ? AND RecipeID = ? AND ActionType = 'save'";
  connection.query(checkQuery, [userId, recipeId], function (checkError, checkResults) {
    if (checkError) {
      console.error("Error checking existing save:", checkError);
      return res.status(500).json({
        error: "Database error: " + checkError.message
      });
    }

    if (checkResults.length > 0) {
      return res.status(400).json({
        error: "Recipe already saved"
      });
    } // If not saved, proceed with saving


    var saveQuery = "INSERT INTO Action (ActionType, UserID, RecipeID) VALUES ('save', ?, ?)";
    connection.query(saveQuery, [userId, recipeId], function (saveError, saveResults) {
      if (saveError) {
        console.error("Error saving recipe:", saveError);
        return res.status(500).json({
          error: "Database error: " + saveError.message
        });
      }

      res.json({
        success: true
      });
    });
  });
}); // Get saved recipes for user

app.get("/api/actions/saved/:userId", function (req, res) {
  var userId = req.params.userId;
  var query = "\n    SELECT DISTINCT r.*, a.Time as SavedTime \n    FROM Recipe r \n    JOIN Action a ON r.RecipeID = a.RecipeID \n    WHERE a.UserID = ? AND a.ActionType = 'save'\n    ORDER BY a.Time DESC\n  ";
  connection.query(query, [userId], function (error, results) {
    if (error) {
      console.error("Error fetching saved recipes:", error);
      return res.status(500).json({
        error: "Database error: " + error.message
      });
    }

    res.json(results);
  });
}); // Delete saved recipe

app["delete"]("/api/actions/save", function (req, res) {
  var _req$query2 = req.query,
      userId = _req$query2.userId,
      recipeId = _req$query2.recipeId;

  if (!userId || !recipeId) {
    return res.status(400).json({
      error: "Missing userId or recipeId"
    });
  }

  var query = "DELETE FROM Action WHERE UserID = ? AND RecipeID = ? AND ActionType = 'save'";
  connection.query(query, [userId, recipeId], function (error, results) {
    if (error) {
      console.error("Error deleting saved recipe:", error);
      return res.status(500).json({
        error: "Database error: " + error.message
      });
    }

    res.json({
      success: true
    });
  });
}); // Add review for a recipe

app.post("/api/reviews", function (req, res) {
  var _req$body2 = req.body,
      recipeId = _req$body2.recipeId,
      comments = _req$body2.comments;

  if (!recipeId || !comments) {
    return res.status(400).json({
      error: "Missing recipeId or comments"
    });
  }

  var query = "INSERT INTO Review (RecipeID, Comments) VALUES (?, ?)";
  connection.query(query, [recipeId, comments], function (error, results) {
    if (error) {
      console.error("Error adding review:", error);
      return res.status(500).json({
        error: "Database error"
      });
    }

    res.status(201).json({
      success: true
    });
  });
});
app.listen(port, function () {
  console.log("Server running on port ".concat(port));
});