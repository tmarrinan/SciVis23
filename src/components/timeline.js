import { tableFromIPC } from 'apache-arrow';
import { readParquet } from 'parquet-wasm';

//const BASE_URL = 'https://gliese.cs.stthomas.edu:8008/datasets/scivis23/';
const BASE_URL = 'https://web.cels.anl.gov/projects/VisWebData/scivis23/';

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
        const neuron_file_url = BASE_URL + 'parquet/' + this.simulation + '/monitors/' + ts + '.gzip';
        //const conn_file_url = BASE_URL + 'parquet/' + this.simulation + '/network/rank_0_step_' + ts_conn + '_in_network.gzip';
        const conn_area_file_url = BASE_URL + 'network_by_area/' + this.simulation + '_' + ts_conn + '.csv';

        return new Promise((resolve, reject) => {
            // let download = [fetch(neuron_file_url)];
            // if (fetch_connections) {
            //     download.push(fetch(conn_file_url));
            // }
            // Promise.all(download)
            // .then((results) => {
            //     let arrays = [];
            //     results.forEach((response) => {
            //         arrays.push(response.arrayBuffer());
            //     });
            //     return Promise.all(arrays);
            // })
            // .then((buffers) => {
            //     let data = {
            //         neurons: tableFromIPC(readParquet(new Uint8Array(buffers[0]))),
            //         connections: null
            //     };
            //     if (buffers.length >= 2) {
            //         data.connections = tableFromIPC(readParquet(new Uint8Array(buffers[1])));
            //     }
            //     resolve(data);
            // })
            // .catch((error) => {
            //     console.error('Could not load Parquet data');
            //     console.error('Reason:', error);
            //     reject(reason);
            // });
            let download = [fetch(neuron_file_url)];
            if (fetch_connections) {
                download.push(fetch(conn_area_file_url));
            }
            Promise.all(download)
            .then((results) => {
                let arrays = [results[0].arrayBuffer()];
                if (results.length >= 2) {
                    arrays.push(results[1].text());
                }
                return Promise.all(arrays);
            })
            .then((buffers) => {
                let data = {
                    neurons: tableFromIPC(readParquet(new Uint8Array(buffers[0]))),
                    connections: null
                };
                if (buffers.length >= 2) {
                    let csv = buffers[1].split(/\r?\n/).filter(el => el.length !== 0)
                                        .map(line => line.split(','));
                    let headers = csv.splice(0, 1);
                    data.connections = {columns: headers, values: csv};
                }
                resolve(data);
            })
            .catch((error) => {
                console.error('Could not load Parquet/CSV data');
                console.error('Reason:', error);
                reject(reason);
            });
        });
    }
}

export default { Timeline };
