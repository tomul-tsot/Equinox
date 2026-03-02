import requests
import pandas as pd
from tqdm import tqdm

# --- 1. Get the URL of the most recent GDELT update ---
# The master file updates every 15 minutes and contains several links.
master_url = "http://data.gdeltproject.org/gdeltv2/lastupdate.txt"
response = requests.get(master_url)

# The file contains rows of: [size] [hash] [url]. 
# We split the first line by spaces and take the last part (the URL).
latest_file_url = response.text.split('\n')[0].split(' ')[-1]

print(f"Targeting Latest GDELT File: {latest_file_url}")

# --- 2. Download with a progress bar (tqdm) ---
r = requests.get(latest_file_url, stream=True)
total_size = int(r.headers.get('content-length', 0))

with open("latest_data.zip", "wb") as f, tqdm(
    total=total_size, unit='B', unit_scale=True, desc="Downloading GDELT"
) as pbar:
    for chunk in r.iter_content(chunk_size=1024):
        if chunk:
            f.write(chunk)
            pbar.update(len(chunk))

# --- 3. Load into Pandas ---
# GDELT files are tab-separated (\t) and do not have headers in the file.
# This will load the zipped CSV directly into a DataFrame.
df = pd.read_csv("latest_data.zip", sep='\t', compression='zip', header=None)

print("\n--- Latest 5 GDELT Events ---")
print(df.head())
