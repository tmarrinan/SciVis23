<script>
import * as d3 from 'd3';
import timeline from './components/timeline'



export default {
    data() {
        return {
            ws: null,
            ws_open: false,
            joined_room: false,
            room_id: '', 
        }
    },
    methods: {
        joinRoom(event) {
            if (this.room_id !== '' && this.ws_open) {
                let message = {type: 'join', data: {id: this.room_id}};
                this.ws.send(JSON.stringify(message));
            }
        },

        createRoom(event) {
            if (this.room_id !== '' && this.ws_open) {
                let message = {type: 'create', data: {id: this.room_id}};
                this.ws.send(JSON.stringify(message));
            }
        },

        leaveRoom(event) {
            let message = {type: 'leave', data: {id: this.room_id}};
            this.ws.send(JSON.stringify(message));
            this.joined_room = false;
            this.room_id = '';
        },

        joinedRoom(type, success) {
            if (success) {
                this.joined_room = true;
                this.ws.send(JSON.stringify({type: 'getState'}));
            }
            else {
                if (type === 'create') {
                    alert('Error: Could not create room. Try a different ID.');
                }
                else if (type === 'join') {
                    alert('Error: Could not join room. Try creating one or join using a different ID.');
                }
            }
        },

        updateState(state) {
            console.log(state);
        }
    },
    mounted() {
        // WebSocket
        this.ws = new WebSocket('wss://gliese.cs.stthomas.edu:8008');
        this.ws.onopen = (event) => {
            console.log('WebSocket connected!');
            this.ws_open = true;
        };
        this.ws.onclose = (event) => {
            console.log('WebSocket closed');
            this.ws_open = false;
        };
        this.ws.onerror = (event) => {
            console.log('WebSocket error: could not connect');
        };
        this.ws.onmessage = (event) => {
            let message = JSON.parse(event.data);
            if (message.type === 'create' || message.type === 'join') {
                this.joinedRoom(message.type, message.response === 'success');
            }
            else if (message.type === 'updateState') {
                this.updateState(message.data);
            }
            else {
                console.log(message.data);
            }

        

        console.log(message.data.state.simulation)
        console.log(message.data.state.neuron_property)
        console.log(message.data.state.timestep)


        this.timeline = new timeline.Timeline();
        this.timeline.setTimestep(message.data.state.timestep);
        this.timeline.setSimulation(message.data.state.simulation);
        this.timeline.getTimestep()
        .then((table) => {

            console.log(table)


            let sim_data = {};
            let desired_columns = ['current_calcium', 'target_calcium', 'fired', 'fired_fraction', 'grown_axons',
                                   'grown_dendrites', 'connected_axons', 'connected_dendrites'];
            for (let i = 0; i < table.schema.fields.length; i++) {
                if (desired_columns.includes(table.schema.fields[i].name)) {
                    sim_data[table.schema.fields[i].name] = table.data[0].children[i].values;
                }
            }
            let sim_data_ranges = {};
            for (let key in sim_data) {
                if (sim_data.hasOwnProperty(key)) {
                    if (key === 'target_calcium') {
                        sim_data[key] = sim_data[key].map((value, index) => sim_data['current_calcium'][index] - value);
                    }
                    let d_min = sim_data[key][0];
                    let d_max = sim_data[key][0];
                    for (let i = 1; i < sim_data[key].length; i++) {
                        let val = sim_data[key][i];
                        d_min = val < d_min ? val : d_min;
                        d_max = val > d_max ? val : d_max;
                    }
                    sim_data_ranges[key] = {min: d_min, max: d_max};
                }
            };

            console.log(sim_data_ranges)
            
            let data = [];

            let fired = 0;
            let notfired = 0;

            let val_1 = 0;
            let val_2 = 0;
            let val_3 = 0;
            let val_4 = 0;

            let property = message.data.state.neuron_property;


           

            if(message.data.state.neuron_property == 'fired'){
                
                for(let v = 0; v < table.numRows; v++){
                    if(sim_data.fired[v] == 1){
                        fired += 1
                    } else { 
                        notfired +=1
                    }
                    
                    }

                console.log(fired)
                console.log(notfired)
                // D3 chart - for charts with binary values
                data = [
                    {name: 'True', value: fired},
                    {name: 'False', value: notfired},
                ];
            } else {

                // split into 4 'categories'?
                let min = sim_data_ranges[property].min;
                let max = sim_data_ranges[property].max;
                
                let split = (max - min) / 4.0;
                console.log(split)


                for(let v = 0; v < table.numRows; v++){
                    if(sim_data[property][v] <= (min + split)  ){
                        val_1 += 1;
                    } else if (sim_data[property][v] >= (min+split) && sim_data[property][v] <= (min+(split*2))) {
                        val_2 += 1;
                    } else if (sim_data[property][v] >= (min+(split*2)) && sim_data[property][v] <= (min+(split*3))) {
                        val_3 += 1; 
                    } else {
                        val_4 += 1;
                    }
                }
                console.log(val_1)
                console.log(val_2)
                console.log(val_3)
                console.log(val_4)

                // D3 chart
                data = [
                    {name: (min).toFixed(3) + (min + split).toFixed(3), value: val_1},
                    {name: (min + split).toFixed(3) + ' - ' + (min + (split*2)).toFixed(3), value: val_2},
                    {name: (min + (split*2)).toFixed(3) + ' - ' + (min + (split*3)).toFixed(3), value: val_3},
                    {name: (min + (split*3)).toFixed(3) + ' - ' + (max).toFixed(3), value: val_4}
                ];
            }
           

           

           


        
            
        d3.selectAll("svg > *").remove();
        
        let margin = {top: 20, right: 20, bottom: 30, left: 40};
        let width = 600 - margin.left - margin.right;
        let height = 400 - margin.top - margin.bottom;
        let d3svg = d3.select('#d3-chart').attr('width', width + margin.left + margin.right)
                                          .attr('height', height + margin.bottom + margin.top)
                      .append('g').attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

       
                     
                    
        let x_axis = d3.scaleBand().range([0, width]).padding(0.1);
        let y_axis = d3.scaleLinear().range([height, 0]);

        x_axis.domain(data.map(elem => elem.name));
        y_axis.domain([0, d3.max(data, d => d.value)]);

        
        d3svg.selectAll('.d3bar').data(data).enter().append('rect')
             .classed('d3bar', true)
             .attr('x', d => x_axis(d.name))
             .attr('width', x_axis.bandwidth())
             .attr('y', d =>  y_axis(d.value))
             .attr('height', d => (height - y_axis(d.value)))
             .style('stroke-dasharray', d => ((x_axis.bandwidth() + height - y_axis(d.value)) + ',' + x_axis.bandwidth()));
               
        

        d3svg.append('g').classed('d3axis', true)
                         .attr('transform', 'translate(0,' + height + ')')
                         .call(d3.axisBottom(x_axis));

        d3svg.append('g').classed('d3axis', true)
                         .call(d3.axisLeft(y_axis));
  
        
        })
        .catch((reason) => { console.error(reason); });
        };

        

        

        }
}
</script>

<template>
    <div class="box">
        <div class="row header">
            <label>Room:</label>
            <div v-if="!joined_room" style="display: inline;">
                <input class="text-input" type="text" placeholder="Enter ID" v-model="room_id"/>
                <button :class="'button-input ' + (ws_open ? 'join-btn' : 'disable-btn')" type="button" @click="joinRoom">Join</button>
                <button :class="'button-input ' + (ws_open ? 'create-btn' : 'disable-btn')" type="button" @click="createRoom">Create</button>
            </div>
            <div v-else style="display: inline;">
                <label class="text-display">{{ room_id }}</label>
                <button :class="'button-input ' + (ws_open ? 'leave-btn' : 'disable-btn')" type="button" @click="leaveRoom">Leave</button>
            </div>
        </div>
        <div class="row content">
            <svg id="d3-chart"></svg>
        </div>
    </div>
</template>

<style scoped>
input, select, option, button {
    font-size: 1rem;
}

svg :deep(.d3bar) {
    stroke: #4362A4;
    stroke-width: 5px;
    fill: #2687E8;
}

svg :deep(.d3bar:hover) {
    stroke: #6F43A4;
}

svg :deep(.d3axis) {
    font-size: 1rem;
}

.box {
    display: flex;
    flex-flow: column;
    width: 100%;
    height: 100%;
    text-align: center;
    background-color: #3C3C3C;
    color: #FFFFFF;
}

.box .row.header {
    flex: 0 1 auto;
    width: 100%;
    padding: 0.5rem;
    border-bottom: solid 1px #CCCCCC;
}

.box .row.content {
    flex: 1 1 auto;
}

.text-input {
    width: 8rem;
    margin: 0 0.5rem;
}

.button-input {
    width: 5rem;
    height: 1.5rem;
    border-radius: 0.25rem;
    border: none;
    color: #FFFFFF;
    margin: 0 0.5rem 0 0;
}

.join-btn {
    background-color: #4A9056;
}

.create-btn {
    background-color: #585EAC;
}

.leave-btn {
    background-color: #931F1F;
}

.disable-btn {
    background-color: #CDCDCD;
    color: #636363;
}

.text-display {
    display: inline-block;
    background-color: #DCDCDC;
    color: #000000;
    width: 7.6rem;
    margin: 0 0.5rem;
    padding: 0.2rem;
}
</style>