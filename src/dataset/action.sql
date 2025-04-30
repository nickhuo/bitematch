-- 删除表（如果存在）
DROP TABLE IF EXISTS Action;

-- 创建 Action 表
CREATE TABLE Action (
    ActionType VARCHAR(255),
    Time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UserID INT,
    RecipeID INT,
    FOREIGN KEY (UserID) REFERENCES Users(UserID),
    FOREIGN KEY (RecipeID) REFERENCES Recipe(RecipeID)
); 