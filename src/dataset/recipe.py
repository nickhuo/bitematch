import pandas as pd
from sqlalchemy import create_engine

df = pd.read_csv('src/dataset/sampled_dataset.csv')

user = 'root'
password = 'nickhuo*'
host = 'localhost'
port = 3306
database = 'bitematch'

engine = create_engine(f'mysql+pymysql://{user}:{password}@{host}:{port}/{database}')

table_name = 'Recipe'
df.to_sql(name='Recipe', con=engine, if_exists='append', index=False)

print("✅")
