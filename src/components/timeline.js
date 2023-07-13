import { tableFromIPC } from 'apache-arrow';
import { readParquet } from 'parquet-wasm';

const BASE_URL = 'https://gliese.cs.stthomas.edu:8008/datasets/scivis23/parquet/';

class Timeline {
    constructor() {
        this.simulation = 'viz-no-network'
        this.timestep = 0;
        this.connection_timestep = 0;
        this.stride = 100;
    }

    setTimestep(idx) {
        this.timestep = idx * this.stride;
        this.connection_timestep = (~~(this.timestep / 10000)) * 10000;
    }

    setSimulation(simulation) {
        this.simulation = simulation;
    }

    // XXX update to support sliding window
    getData(fetch_connections) {
        const ts = this.timestep.toString().padStart(6, '0');
        const ts_conn = this.connection_timestep.toString().padStart(6, '0');
        const neuron_file_url = BASE_URL + this.simulation + '/monitors/' + ts + '.gzip';
        const conn_file_url = BASE_URL + this.simulation + '/network/rank_0_step_' + ts_conn + '_in_network.gzip';

        return new Promise((resolve, reject) => {
            let download = [fetch(neuron_file_url)];
            if (fetch_connections) {
                download.push(fetch(conn_file_url));
            }
            Promise.all(download)
            .then((results) => {
                let arrays = [];
                results.forEach((response) => {
                    arrays.push(response.arrayBuffer());
                });
                return Promise.all(arrays);
            })
            .then((buffers) => {
                let data = {
                    neurons: tableFromIPC(readParquet(new Uint8Array(buffers[0]))),
                    connections: null
                };
                if (buffers.length >= 2) {
                    data.connections = tableFromIPC(readParquet(new Uint8Array(buffers[1])));
                }
                resolve(data);
            })
            .catch((error) => {
                console.error('Could not load Parquet data');
                console.error('Reason:', error);
                reject(reason);
            });


            // fetch(DATA_FILE_URL)
            // .then((response) => { 
            //     return response.arrayBuffer();
            // })
            // .then((buffer) => {
            //     let data = tableFromIPC(readParquet(new Uint8Array(buffer)));
            //     resolve(data);
            // })
            // .catch((reason) => {
            //     console.error(`Could not load ${DATA_FILE_URL}`);
            //     console.error(`Reason: ${reason}`);
            //     reject(reason);
            // });
        });
    }
}

export default { Timeline };
