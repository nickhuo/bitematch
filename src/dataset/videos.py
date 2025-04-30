import pandas as pd
from sqlalchemy import create_engine

# Read CSV file
df = pd.read_csv('src/dataset/videos.csv')

# Only keep needed columns
df = df[['RecipeID', 'VideoTitle', 'YouTubeLink', 'ThumbnailUrl']]

user = 'root'
password = 'nickhuo*'  # Use your actual password
host = 'localhost'
port = 3306
database = 'bitematch'

engine = create_engine(f'mysql+pymysql://{user}:{password}@{host}:{port}/{database}')

# Import data into Video table
df.to_sql(name='Video', con=engine, if_exists='append', index=False)

print("✅ Data imported successfully!")
