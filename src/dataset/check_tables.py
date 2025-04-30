import pandas as pd
from sqlalchemy import create_engine, text

user = 'root'
password = 'nickhuo*'
host = 'localhost'
port = 3306
database = 'bitematch'

engine = create_engine(f'mysql+pymysql://{user}:{password}@{host}:{port}/{database}')

table_query = """
SELECT TABLE_NAME 
FROM information_schema.tables 
WHERE table_schema = 'bitematch'
"""

with engine.connect() as connection:
    # Get all table names
    tables = pd.read_sql(table_query, connection)
    
    print("\n=== Table Row Counts ===")
    print("------------------------")
    
    # Get row count for each table
    for table in tables['TABLE_NAME']:
        count_query = f"SELECT COUNT(*) as count FROM {table}"
        count = pd.read_sql(text(count_query), connection)
        print(f"{table}: {count['count'].iloc[0]} rows") 