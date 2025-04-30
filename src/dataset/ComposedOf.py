import pandas as pd
from sqlalchemy import create_engine

df = pd.read_csv('C:/Users/jimch/Documents/GitHub/sp25-cs411-team096-query/src/dataset/ComposedOf.csv')

user = 'root'
password = 'aaaa'
host = 'localhost'  
port = 3306
database = 'bitematch'

engine = create_engine(f'mysql+pymysql://{user}:{password}@{host}:{port}/{database}')

with engine.connect() as conn:
    existing_recipe_ids = pd.read_sql("SELECT RecipeID FROM Recipe", conn)['RecipeID'].astype(int).tolist()
    existing_ingredient_ids = pd.read_sql("SELECT IngredientID FROM Ingredients", conn)['IngredientID'].astype(int).tolist()


df = df[(df['RecipeID'].isin(existing_recipe_ids)) & 
        (df['IngredientID'].isnull() | df['IngredientID'].isin(existing_ingredient_ids))]


df.to_sql(name='ComposedOf', con=engine, if_exists='append', index=False)

print("✅")