import pandas as pd
from sqlalchemy import create_engine, text

df = pd.DataFrame({
    'ActionType': [],
    'Time': [],
    'UserID': [],
    'RecipeID': []
})

user = 'root'
password = 'nickhuo*'  # Update your password here
host = 'localhost'
port = 3306
database = 'bitematch'

engine = create_engine(f'mysql+pymysql://{user}:{password}@{host}:{port}/{database}')


with engine.connect() as connection:
    check_query = text("SHOW TABLES LIKE 'Action'")
    result = connection.execute(check_query)
    if result.fetchone():
        try:
            connection.execute(text("ALTER TABLE Action DROP FOREIGN KEY action_ibfk_1"))
            connection.execute(text("ALTER TABLE Action DROP FOREIGN KEY action_ibfk_2"))
        except:
            pass 
        

        connection.execute(text("DROP TABLE IF EXISTS Action"))
        print("Dropped existing Action table")
    

    create_table_query = text("""
    CREATE TABLE Action (
        ActionType VARCHAR(255),
        Time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UserID INT,
        RecipeID INT,
        FOREIGN KEY (UserID) REFERENCES Users(UserID),
        FOREIGN KEY (RecipeID) REFERENCES Recipe(RecipeID)
    )
    """)
    connection.execute(create_table_query)
    print("Created Action table successfully")

print("✅ Action table is ready") 