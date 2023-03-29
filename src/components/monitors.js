import { tableFromArrays, tableFromIPC, tableToIPC } from "apache-arrow";
import {
  readParquet,
  writeParquet,
  Compression,
  WriterPropertiesBuilder,
} from "parquet-wasm";

class Monitor {
//export default {

  hdf5;
  hdf5_url = "http://tatooine.cels.anl.gov/~vmateevitsi/data/0000.gzip";
  constructor(){
    console.log("Truing to load: " + this.hdf5_url);
    fetch(this.hdf5_url)
      .then(function(response) { 
        console.log("arrayBuffer");
        return response.arrayBuffer() 
      })
      .then(function(buffer) {
        console.log("Loading monitor hdf5 file");
        const parquetUint8Array = new Uint8Array(buffer);
        const table = tableFromIPC(readParquet(parquetUint8Array));
        console.log(table.schema.toString());
        //var f = new hdf5.File(buffer, filename);
        //const table = tableFromIPC(readParquet(parquetBuffer));
        //this.hdf5 = f;
        // do something with f;
        // let g = f.get('group');
        // let d = f.get('group/dataset');
        // let v = d.value;
        // let a = d.attrs;
      });
  }

  loadMonitors(timestep){
    console.log("Loading monitor timestep: " + timestep);
    //let g = this.hdf5.get('calcium');
    }

}

export default { Monitor };
