import pandas as pd
from sqlalchemy import create_engine

df = pd.read_csv("C:/Users/jimch/Documents/GitHub/sp25-cs411-team096-query/src/dataset/ingredients.csv")


user = 'root'
password = 'aaaa'
host = 'localhost'
port = 3306
database = 'bitematch'

engine = create_engine(f'mysql+pymysql://{user}:{password}@{host}:{port}/{database}')

table_name = 'Ingredients'
df.to_sql(name='Ingredients', con=engine, if_exists='append', index=False)

print("✅")