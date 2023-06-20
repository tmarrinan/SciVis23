import { tableFromIPC } from 'apache-arrow';
import { readParquet } from 'parquet-wasm';


class Timeline {
    constructor() {
        this.simulation = 'viz-no-network'
        this.idx = 0;
        this.stride = 100;
    }

    setTimestep(idx) {
        this.idx = idx * this.stride;
    }

    setSimulation(simulation) {
        this.simulation = simulation;
    }

    // XXX update to support sliding window
    getTimestep() {
        const BASE_URL = 'https://gliese.cs.stthomas.edu:8008/datasets/scivis23/parquet/';
        const DATA_FILE_URL = BASE_URL + this.simulation + '/monitors/' + this.idx.toString().padStart(6, '0') + '.gzip';
        
        return new Promise((resolve, reject) => {
        fetch(DATA_FILE_URL)
            .then((response) => { 
                return response.arrayBuffer();
            })
            .then((buffer) => {
                let data = tableFromIPC(readParquet(new Uint8Array(buffer)));
                resolve(data);
            })
            .catch((reason) => {
                console.error(`Could not load ${DATA_FILE_URL}`);
                console.error(`Reason: ${reason}`);
                reject(reason);
            });
        });
    }
}

export default { Timeline };
