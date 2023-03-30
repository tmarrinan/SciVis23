import { tableFromIPC } from "apache-arrow";
import { readParquet } from "parquet-wasm";


class Timeline {

  constructor() {
    this.WINDOW_SIZE = 1;
    this.STRIDE = 100;

    this.curIdx = 0;
    this.startIdx = 0;
    this.endIdx = this.WINDOW_SIZE;

    //this.loadMonitor(0);
    /*
    for (let i = this.startIdx; i < this.endIdx; ++i) {
      this.loadMonitor(i * this.STRIDE)
        .then(function(response) {
          console.log(response.schema.toString());
        })
        .catch((reason) => {
        });

    }*/
  }

  // XXX update to support sliding window
  updateIndex(idx) {
    console.log("New value: " + new String(idx));
    this.curIdx = idx;
    return new Promise((resolve, reject) => {
      this.loadMonitor(idx)
        .then(function(data) {
          resolve(data);
        })
        .catch((reason) => {
          console.error(`Could not load ${DATA_FILE_URL}`);
          console.error(`Reason: ${reason}`);
          reject(reason);
        });
    });
  }

  loadMonitor(idx) {
    const BASE_URL = "http://tatooine.cels.anl.gov/~vmateevitsi/data/";
    const DATA_FILE_URL = BASE_URL + idx.toString().padStart(4, '0') + ".gzip";
    
    return new Promise((resolve, reject) => {
      fetch(DATA_FILE_URL)
        .then(function(response) { 
          return response.arrayBuffer() 
        })
        .then(function(buffer) {
          const parquetUint8Array = new Uint8Array(buffer);
          let data = tableFromIPC(readParquet(parquetUint8Array));
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
