-- Drop existing Users table if it exists
DROP TABLE IF EXISTS Action;
DROP TABLE IF EXISTS Review;
DROP TABLE IF EXISTS Users;

-- Create new Users table
CREATE TABLE Users (
    UserID INT PRIMARY KEY AUTO_INCREMENT,
    Email VARCHAR(255) NOT NULL UNIQUE,
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    LastLoginAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create index on Email for faster lookups
CREATE INDEX idx_users_email ON Users(Email); 