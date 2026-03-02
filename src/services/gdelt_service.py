import requests
import pandas as pd
import os
import zipfile
import io
from tqdm import tqdm

# GDELT v2 Event Column Headers (Reduced to relevant fields)
# Reference: http://data.gdeltproject.org/documentation/GDELT-EventCodebook-V2.0.pdf
GDELT_COLUMNS = [
    'GlobalEventID', 'Day', 'MonthYear', 'Year', 'FractionDate',
    'Actor1Code', 'Actor1Name', 'Actor1CountryCode', 'Actor1KnownGroupCode', 'Actor1EthnicCode', 'Actor1Religion1Code', 'Actor1Religion2Code', 'Actor1Type1Code', 'Actor1Type2Code', 'Actor1Type3Code',
    'Actor2Code', 'Actor2Name', 'Actor2CountryCode', 'Actor2KnownGroupCode', 'Actor2EthnicCode', 'Actor2Religion1Code', 'Actor2Religion2Code', 'Actor2Type1Code', 'Actor2Type2Code', 'Actor2Type3Code',
    'IsRootEvent', 'EventCode', 'EventBaseCode', 'EventRootCode', 'QuadClass', 'GoldsteinScale', 'NumMentions', 'NumSources', 'NumArticles', 'AvgTone',
    'Actor1Geo_Type', 'Actor1Geo_FullName', 'Actor1Geo_CountryCode', 'Actor1Geo_ADM1Code', 'Actor1Geo_ADM2Code', 'Actor1Geo_Lat', 'Actor1Geo_Long', 'Actor1Geo_FeatureID',
    'Actor2Geo_Type', 'Actor2Geo_FullName', 'Actor2Geo_CountryCode', 'Actor2Geo_ADM1Code', 'Actor2Geo_ADM2Code', 'Actor2Geo_Lat', 'Actor2Geo_Long', 'Actor2Geo_FeatureID',
    'ActionGeo_Type', 'ActionGeo_FullName', 'ActionGeo_CountryCode', 'ActionGeo_ADM1Code', 'ActionGeo_ADM2Code', 'ActionGeo_Lat', 'ActionGeo_Long', 'ActionGeo_FeatureID',
    'DATEADDED', 'SOURCEURL'
]

# CAMEO Codes for Disasters & Aid (User recommended + additions)
# 0243: Provide humanitarian aid
# 074: Fight (sometimes related to civil unrest/disaster response)
# 034: Express intent to provide humanitarian aid
# 183: Assault (sometimes related to crisis)
# 0212: Appeal for humanitarian aid
# 1451: Protest for humanitarian aid
DISASTER_CODES = ['0243', '034', '074', '183', '1833', '0212', '1451', '0841', '0842']

def fetch_latest_gdelt_events(limit=20):
    """Fetches the latest GDELT event update and filters for disaster-related markers."""
    master_url = "http://data.gdeltproject.org/gdeltv2/lastupdate.txt"
    try:
        response = requests.get(master_url)
        response.raise_for_status()
        
        # Get the .export.CSV.zip URL
        latest_file_url = response.text.split('\n')[0].split(' ')[-1]
        print(f"[*] Fetching: {latest_file_url}")
        
        r = requests.get(latest_file_url)
        r.raise_for_status()
        
        # Load directly from zip in memory
        with zipfile.ZipFile(io.BytesIO(r.content)) as z:
            csv_filename = z.namelist()[0]
            with z.open(csv_filename) as f:
                df = pd.read_csv(f, sep='\t', header=None, names=GDELT_COLUMNS, encoding='utf-8')
        
        # Convert EventCode to string
        df['EventCode'] = df['EventCode'].astype(str).str.zfill(4)
        
        # Filter: Disaster RAMEO codes OR high-impact/negative events
        # We want things that ARE being talked about and might be a crisis
        is_disaster = df['EventCode'].isin(DISASTER_CODES)
        is_high_impact = (df['NumArticles'] > 5) & (df['AvgTone'] < -2)
        
        disaster_df = df[is_disaster | is_high_impact].copy()
        
        # Filter out anything without a location
        disaster_df = disaster_df.dropna(subset=['ActionGeo_FullName'])
        
        # Sort by Importance (Number of Articles)
        disaster_df = disaster_df.sort_values(by=['NumArticles', 'AvgTone'], ascending=[False, True])
        
        return disaster_df.head(limit), latest_file_url
        
    except Exception as e:
        print(f"[!] GDELT Fetch Error: {e}")
        return pd.DataFrame(), None

if __name__ == "__main__":
    results = fetch_latest_gdelt_events()
    print(f"Found {len(results)} potential crises.")
    if not results.empty:
        print(results[['ActionGeo_FullName', 'EventCode', 'AvgTone', 'SOURCEURL']].head())
