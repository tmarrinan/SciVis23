#!/usr/bin/env python3

import csv
import h5py
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
#directories = ['viz-calcium']
#hdf5 = h5py.File(join(OUT_PATH, "monitor.hdf5"), "w")
for dir in directories:
    mypath = join(DATA_PATH, dir, "monitors")
    out_path = join(OUT_PATH, dir, "monitors")
    #grp = hdf5.create_group(dir)
    files = [f for f in listdir(mypath) if isfile(join(mypath, f))]
    files = natsorted(files, key=lambda y: y.lower())

    for fl in files:
        file = open(join(DATA_PATH, dir, "monitors", fl), 'r')
        print("Processing directory: " + dir + " and file: " + fl)
        
        
        df = pd.read_csv(file)
        if not exists(out_path):
            makedirs(out_path)

 #grp2 = grp.create_group(fl.split('_')[1].split('.')[0])
        #featherfeathergrp3 = grp2.create_group
        #print(df["neuron"])
        #path = '/calcium/t' + fl.split('_')[1].split('.')[0]
       
        #np.savez_compressed(join(OUT_PATH, fl.split('_')[1].split('.')[0] + ".npz"), a=df.to_numpy())
        #import pyarrow.feather as feather
         
        #feather.write_feather(df, join(OUT_PATH, fl.split('_')[1].split('.')[0] + ".feather"), compression='zstd')
        #df.to_feather(join(OUT_PATH, fl.split('_')[1].split('.')[0] + ".feather"))
        #df.to_pickle(join(OUT_PATH, fl.split('_')[1].split('.')[0] + ".pkl"), compression='bz2')
        df.to_parquet(join(out_path, fl.split('_')[1].split('.')[0].zfill(6) + ".gzip"), engine='fastparquet', compression='brotli')
        #grp2.create_dataset("neuron", df["neuron"].head(10).transpose(), chunks=(10,))
        #for row in df.itertuples(index=True, name='Pandas'):
        #    grp3.create_dataset("neuron", getattr(row, "neuron"))

        file.close()
#hdf5.close()


end = time.time()
elapsed = end - start
print("Total processing time: " + str(elapsed) + " seconds")




