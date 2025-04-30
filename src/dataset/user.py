import pandas as pd
from sqlalchemy import create_engine, text

df = pd.read_csv("/Users/harperrr/Desktop/user.csv")

user = 'root'
password = 'zyw924627'
host = 'localhost'
port = 3306
database = 'bitematch'

engine = create_engine(f'mysql+pymysql://{user}:{password}@{host}:{port}/{database}')


with engine.begin() as connection:
    connection.execute(text("ALTER TABLE Review DROP FOREIGN KEY review_ibfk_2"))
    connection.execute(text("ALTER TABLE Review ADD CONSTRAINT review_ibfk_2 FOREIGN KEY (UserID) REFERENCES Users(UserID) ON DELETE CASCADE"))
    connection.execute(text("DELETE FROM Users"))
    df.to_sql(name='Users', con=connection, if_exists='append', index=False)

print("✅") 