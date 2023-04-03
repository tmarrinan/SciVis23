#!/usr/bin/env python3

import csv
import time
import numpy as np
import pandas as pd

from natsort import natsorted, ns
from os import listdir
from os import makedirs
from os.path import exists, isfile, join

start = time.time()

DATA_PATH = "/lus/grand/projects/visualization/mvictoras/SciVisContest23/out"
OUT_PATH = "/lus/grand/projects/visualization/mvictoras/SciVisContest23/parquet2"

directories = ['viz-calcium', 'viz-disable', 'viz-no-network', 'viz-stimulus']
for dir in directories:
    mypath = join(DATA_PATH, dir, "monitors")
    out_path = join(OUT_PATH, dir, "monitors")
    files = [f for f in listdir(mypath) if isfile(join(mypath, f))]
    files = natsorted(files, key=lambda y: y.lower())

    for fl in files:
        file = open(join(DATA_PATH, dir, "monitors", fl), 'r')
        print("Processing directory: " + dir + " and file: " + fl)
        
        
        df = pd.read_csv(file)
        if not exists(out_path):
            makedirs(out_path)

        df.to_parquet(join(out_path, fl.split('_')[1].split('.')[0].zfill(6) + ".gzip"), engine='fastparquet', compression='brotli')

        file.close()

end = time.time()
elapsed = end - start
print("Total processing time: " + str(elapsed) + " seconds")
