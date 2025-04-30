CREATE TABLE Users (
    UserID INT AUTO_INCREMENT PRIMARY KEY,
    Username VARCHAR(255) NOT NULL,
    Email VARCHAR(255) NOT NULL
);

CREATE TABLE Recipe (
    RecipeID INT PRIMARY KEY,
    RecipeTitle VARCHAR(255) NOT NULL,
    Directions TEXT,
    Source VARCHAR(255)
);

CREATE TABLE Ingredients (
    IngredientID INT PRIMARY KEY,
    Name VARCHAR(255) NOT NULL,
    CaloriesPerUnit DECIMAL(10,2)
);

CREATE TABLE Video (
    VideoID INT AUTO_INCREMENT PRIMARY KEY,
    RecipeID INT UNIQUE,
    VideoTitle VARCHAR(255),
    YouTubeLink VARCHAR(255),
    ThumbnailUrl VARCHAR(255),
    FOREIGN KEY (RecipeID) REFERENCES Recipe(RecipeID)
);

CREATE TABLE ComposedOf (
    id INT AUTO_INCREMENT,
    RecipeID INT,
    IngredientName_Recipe VARCHAR(512),
    IngredientName_Nutrition VARCHAR(512),
    IngredientID INT,
    Quantity VARCHAR(255),
    PRIMARY KEY (id),
    FOREIGN KEY (RecipeID) REFERENCES Recipe(RecipeID),
    FOREIGN KEY (IngredientID) REFERENCES Ingredients(IngredientID)
);

CREATE TABLE Review (
    ReviewID INT AUTO_INCREMENT PRIMARY KEY,
    RecipeID INT,
    UserID INT,
    Stars INT,
    Comments VARCHAR(1000),
    FOREIGN KEY (RecipeID) REFERENCES Recipe(RecipeID),
    FOREIGN KEY (UserID) REFERENCES Users(UserID)
);

CREATE TABLE Action (
    ActionType VARCHAR(255),
    Time TIMESTAMP,
    UserID INT,
    RecipeID INT,
    FOREIGN KEY (UserID) REFERENCES Users(UserID),
    FOREIGN KEY (RecipeID) REFERENCES Recipe(RecipeID)
);