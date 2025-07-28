# BiteMatch

This was the final project for UIUC [CS-411 Database Systems](https://siebelschool.illinois.edu/academics/courses/cs411), taught by [Prof. Abdussalam Alawini](https://siebelschool.illinois.edu/about/people/all-faculty/alawini). The course covered data models (ER, relational, hierarchical, network), query languages, normalization, query optimization, and distributed databases.

**Highlights:** 

- Users can dynamically input available ingredients to find matching recipes. A refined SQL design ensures only recipes containing *all* selected ingredients are returned.
- To handle YouTube API quota limits, the system checks the database first before fetching new videos, reducing API calls by over 50%.
- A stored procedure calculates total recipe calories by converting diverse units (e.g., cups, cans) to grams. Covers ~90% of recipes accurately.

## Demo

> **Note**: The original demo GIF (144MB) exceeds GitHub's file size limit. See `doc/images/demo-placeholder.md` for details.

## Core Features

- User login and registration
- Random recipe recommendation on homepage
- Ingredient-based recipe search
- Recipe details with ingredients, steps, calories, and video
- Save and manage favorite recipes
- Leave reviews and submit star ratings

## Tech Stack

- **Frontend & Backend**: React.js, Node.js 
- **Database**: MySQL
- **API Integration**: YouTube API for recipe videos

## How to Run the Project

### Prerequisites

Make sure you have the following installed on your system:

- **Node.js** (version 14 or higher)
- **MySQL** (version 8.0 or higher)
- **Python** (version 3.7 or higher) - for data import scripts

### 1. Database Setup

First, set up the MySQL database:

```bash
# Connect to MySQL
mysql -u root -p

# Create the database
CREATE DATABASE bitematch;
USE bitematch;

# Import the database schema
source doc/sql/BiteMatch.sql;

# Import stored procedures (optional)
source doc/sql/CalcRecipeCaloriesSP.sql;
source doc/sql/CommentRestrict.sql;
```

### 2. Import Sample Data

Navigate to the dataset directory and run the Python import scripts:

```bash
cd src/dataset

# Install Python dependencies (if needed)
pip install mysql-connector-python pandas

# Import data (run these in order)
python user.py
python ingredients.py
python recipe.py
python videos.py
python review.py
python ComposedOf.py
```

### 3. Backend Setup

Configure and start the Node.js server:

```bash
cd src/bitematch

# Install backend dependencies
npm install

# Update database connection settings in server.js
# Edit the MySQL connection configuration:
# - host: "localhost" 
# - user: "your_mysql_username"
# - password: "your_mysql_password"
# - database: "bitematch"

# Optional: Set up YouTube API key
# Replace the API key in server.js or set environment variable:
export YOUTUBE_API_KEY="your_youtube_api_key"

# Start the backend server (runs on port 3001)
node server.js
```

### 4. Frontend Setup

In a new terminal, start the React application:

```bash
cd src/bitematch

# Install frontend dependencies (if not already done)
npm install

# Start the React development server (runs on port 3000)
npm start
```

### 5. Access the Application

- **Frontend**: Open your browser and navigate to `http://localhost:3000`
- **Backend API**: The server will be running on `http://localhost:3001`

### Configuration Notes

- **Database Connection**: Update the MySQL connection details in `src/bitematch/server.js`
- **YouTube API**: The application can run without YouTube API, but video features will be limited
- **Port Configuration**: Frontend runs on port 3000, backend on port 3001 by default

### Troubleshooting

- **Database Connection Issues**: Ensure MySQL is running and credentials are correct
- **Port Conflicts**: Change ports in `server.js` (backend) or React scripts if needed
- **Missing Dependencies**: Run `npm install` in the `src/bitematch` directory
- **Data Import Errors**: Ensure Python scripts have database write permissions

## Project Structure

The project documentation is organized in the `/doc` folder with the following structure:

- **`doc/images/`** - Screenshots and demo files
  - `demo-placeholder.md` - Demo placeholder (original file too large for GitHub)
  
- **`doc/sql/`** - Database schema and stored procedures
  - `BiteMatch.sql` - Main database schema
  - `CalcRecipeCaloriesSP.sql` - Recipe calories calculation stored procedure
  - `CommentRestrict.sql` - Comment restriction triggers
  - `update_users_table.sql` - User table updates
  
- **`doc/docs/`** - Project documentation and reports
  - `Project_Proposal.pdf` - Initial project proposal
  - `ER Diagram.pdf` - Entity-Relationship diagram
  - `Conceptual and Logical Database Design.pdf` - Database design documentation
  - `Database Implementation and Indexing.pdf` - Implementation details
  - `Stage4_Final Report.pdf` - Final project report
  
- **`doc/revisions/`** - Development stage revisions
  - `stage2_revisions.md` - Stage 2 feedback and revisions
  - `stage3_revisions.md` - Stage 3 feedback and revisions

---

Contributors: [Jiajun Huo](https://www.linkedin.com/in/nickhuo/), [Yiting Wang](https://www.linkedin.com/in/yiting-wang-870a3133b/), [Yiwen (Yvonne) Zhang](https://www.linkedin.com/in/yiwenillinois/), [Zhihao Cheng](https://www.linkedin.com/in/zhihao-cheng/)

# Why We built it?

Finding the right recipe that fits a user's dietary preferences, calorie needs, and available ingredients can be challenging. Many existing platforms lack personalization, making it difficult for users to discover relevant recipes, track calories, and organize their meal plans efficiently. BiteMatch aims to simplify this process by providing recipe recommendations, meal planning integration, calorie tracking, and grocery list management—all in one seamless experience.

# Usefulness & Uniqueness

## Analysis of Competitive Products

Identify any existing solutions and highlight how your project is different.

### [NYT Cooking](https://cooking.nytimes.com/)

NYT Cooking is a digital culinary platform developed by The New York Times, offering a vast collection of over 22,000 recipes curated by professional editors and chefs. Launched as a standalone app and website, it provides users with a comprehensive cooking experience, featuring recipe search, personalized recommendations, and organizational tools. NYT Cooking stands out for its high-quality content, user-friendly interface, and unique "notes" feature that encourages a collaborative community of home cooks.

### Crouton

Crouton is a recipe management and meal planning app designed for Apple platforms that enables users to collect recipes from various platforms. Its core feature is importing recipes from anywhere using AI technology—including websites, cookbooks, and even handwritten notes. The app also offers a range of functionalities to enhance the cooking experience, such as step-by-step guided cooking, automatic meal planning, integrated timers, and the ability to create shopping lists directly from recipes.

## Uniqueness

NYT Cooking stands out as a premier recipe content provider, offering a rich collection of culinary ideas. In contrast, Crouton serves as an efficient tool for gathering recipes from various platforms and managing meal plans. BiteMatch takes a unique approach, boasting an extensive recipe database that delivers personalized recommendations based on users' ingredients or preferences. This user-centric model eliminates the need for manual recipe collection. Instead, users simply specify their available ingredients or dietary requirements, and BiteMatch presents tailored recipe suggestions.
