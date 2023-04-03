# Scripts to process the data

- `processMonitors.py`: loads the data and converts the monitor files to per timestep csvs, instead of the original dataset, which is per neuron
- `processParquet.py`: loads the per timestep monitors csv (make sure you have already run `processMonitors.py`) and creates parquet files

Use `conda-env.yml` to restore the environment with all the needed packages: `conda env create -n ENVNAME --file conda-env.yml`
