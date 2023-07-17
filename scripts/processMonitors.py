#!/usr/bin/env python3

import csv
import h5py
import time

from natsort import natsorted, ns
from os import listdir
from os import makedirs
from os.path import exists, isfile, join

start = time.time()

DATA_PATH = "/lus/grand/projects/visualization/mvictoras/SciVisContest23/data"
OUT_PATH = "/lus/grand/projects/visualization/mvictoras/SciVisContest23/out"

directories = ['viz-calcium', 'viz-disable', 'viz-no-network', 'viz-stimulus']
for dir in directories:
    mypath = join(DATA_PATH, dir, "monitors")

    files = [f for f in listdir(mypath) if isfile(join(mypath, f))]
    files = natsorted(files, key=lambda y: y.lower())

    timesteps = range(0, 1000000, 100)

    out_path = join(OUT_PATH, dir, "monitors")

    if not exists(out_path):
        makedirs(out_path)

    tstep_dict = {}
    file_dict = {}
    headers = ['neuron', 'step', 'fired', 'fired_fraction', 'x', 'secondary_variable', 'calcium', 'target_calcium', 'synaptic_input', 'background_activity', 'grown_axons', 'connected_axons', 'grown_excitatory_dendrites', 'connected_excitatory_dendrites']

    for timestep in timesteps:
        file = open(join(out_path, "0_" + f"{timestep:04}" + ".csv"), 'w')
        tstep_dict[str(timestep)] = csv.writer(file, delimiter=',', quotechar='"', quoting=csv.QUOTE_MINIMAL)
        tstep_dict[str(timestep)].writerow(headers)
        file_dict[str(timestep)] = file

    for fl in files:
        file = open(join(DATA_PATH, dir, "monitors", fl), 'r')
        print("Processing directory: " + dir + " and file: " + fl)
        neuron = fl.split('_')[1].split('.')[0]
        csv_reader = csv.reader(file, delimiter=';')
        timestep = 0
        for row in csv_reader:
            row[0] = neuron
            tstep_dict[str(timestep)].writerow(row)
            timestep = timestep + 100
        file.close()

    for timestep in timesteps:
        file_dict[str(timestep)].close()

end = time.time()
elapsed = end - start
print("Total processing time: " + str(elapsed) + " seconds")




