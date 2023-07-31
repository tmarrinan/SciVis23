<script>
import Plotly from 'plotly.js-dist'
import timeline from './components/timeline'

const BASE_URL = import.meta.env.BASE_URL || '/';

export default {
    data() {
        return {
            ws: null,
            ws_open: false,
            joined_room: false,
            room_id: '',
            view_idx: 0,
            timeline: null,
            sim_data: {},
            sim_data_ranges: {},
            sim_property: 'area',
            property_names: {
                area: 'Area',
                current_calcium: 'Calcium',
                target_calcium: 'Calcium to Target',
                fired: 'Fired',
                fired_fraction: 'Fired Rate',
                grown_axons: 'Axons',
                grown_dendrites: 'Dendrites',
                connected_acons: 'Incoming Connections',
                connected_dendrites: 'Outgoing Connections'
            },
            neuron_areas: [],
            area_colors: [
                '#808080',
                '#2f4f4f',
                '#556b2f',
                '#6b8e23',
                '#a0522d',
                '#8b0000',
                '#483d8b',
                '#008000',
                '#3cb371',
                '#b8860b',
                '#bdb76b',
                '#008b8b',
                '#4682b4',
                '#000080',
                '#d2691e',
                '#9acd32',
                '#32cd32',
                '#8fbc8f',
                '#8b008b',
                '#b03060',
                '#ff4500',
                '#ffa500',
                '#ffd700',
                '#6a5acd',
                '#ffff00',
                '#0000cd',
                '#00ff00',
                '#ba55d3',
                '#8a2be2',
                '#00ff7f',
                '#dc143c',
                '#00ffff',
                '#00bfff',
                '#f4a460',
                '#f08080',
                '#adff2f',
                '#ff6347',
                '#b0c4de',
                '#ff00ff',
                '#6495ed',
                '#dda0dd',
                '#ff1493',
                '#afeeee',
                '#98fb98',
                '#7fffd4',
                '#ffe4b5',
                '#ff69b4',
                '#ffb6c1'
            ]
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
        },

        generatePlotlyLayout(title, x_axis, y_axis, range) {
            return {
                paper_bgcolor: 'rgba(0, 0, 0, 0.0)',
                plot_bgcolor: 'rgba(0, 0, 0, 0.0)',
                title: {
                    text: title,
                    font: {
                        family: 'Arial, Helvetica, sans-serif',
                        size: 24,
                        color: '#FFFFFF'
                    }
                },
                xaxis: {
                    title: {
                        text: x_axis,
                        font: {
                            family: 'Arial, Helvetica, sans-serif',
                            size: 16,
                            color: '#FFFFFF'
                        }
                    },
                    linecolor: '#FFFFFF',
                    linewidth: 1,
                    minor: {
                        tickcolor: '#FFFFFF',
                    },
                    tickfont: {
                        family: 'Arial, Helvetica, sans-serif',
                        size: 12,
                        color: '#FFFFFF'
                    }
                },
                yaxis: {
                    title: {
                        text: y_axis,
                        font: {
                            family: 'Arial, Helvetica, sans-serif',
                            size: 16,
                            color: '#FFFFFF'
                        }
                    },
                    linecolor: '#FFFFFF',
                    linewidth: 1,
                    tickcolor: '#FFFFFF',
                    tickfont: {
                        family: 'Arial, Helvetica, sans-serif',
                        size: 12,
                        color: '#FFFFFF'
                    },
                    range: range
                }
            };
        }
    },
    mounted() {
        // Plotly - chart update
        let updateChartData = (table) => {
            let sim_data = {};
            let desired_columns = ['current_calcium', 'target_calcium', 'fired', 'fired_fraction', 'grown_axons',
                                   'grown_dendrites', 'connected_acons', 'connected_dendrites'];
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
                    //if (d_min < 0 && d_max < 0) d_max = 0;
                    //else if (d_min > 0 && d_max > 0) d_min = 0;
                    d_max += 0.01 * (d_max - d_min);
                    sim_data_ranges[key] = {min: d_min, max: d_max};
                }
            };

            this.sim_data = sim_data;
            this.sim_data_ranges = sim_data_ranges;
        };

        let redrawCharts = () => {
            let hist_x, hist_y;
            let area_values = new Array(48);
            for (let i = 0; i < 48; i++) area_values[i] = [];
            let area_range = [0, 0];
            if (this.sim_property === 'area') {
                hist_x = ['N/A'];
                hist_y = [0];
            }
            else if (this.sim_property === 'fired') {
                hist_x = ['True', 'False'];
                hist_y = [0, 0];
                for (let i = 0; i < this.sim_data.fired.length; i++) {
                    hist_y[1 - this.sim_data.fired[i]]++;
                    area_values[this.neuron_areas[i]].push(this.sim_data.fired[i]);
                }
                area_range[0] = 0;
                area_range[1] = 1;
            }
            else {
                let num_categories = 5;
                let min = this.sim_data_ranges[this.sim_property].min;
                let max = this.sim_data_ranges[this.sim_property].max;
                let split = (max - min) / num_categories;

                hist_x = [
                    '[' + min.toFixed(3) + ',' + (min + split).toFixed(3) + ']',
                    '[' + (min + split).toFixed(3) + ',' + (min + (2 * split)).toFixed(3) + ']',
                    '[' + (min + (2 * split)).toFixed(3) + ',' + (min + (3 * split)).toFixed(3) + ']',
                    '[' + (min + (3 * split)).toFixed(3) + ',' + (min + (4 * split)).toFixed(3) + ']',
                    '[' + (min + (4 * split)).toFixed(3) + ',' + max.toFixed(3) + ']'
                ];
                hist_y = [0, 0, 0, 0, 0];
                for (let i = 0; i < this.sim_data[this.sim_property].length; i++) {
                    let prop_value = this.sim_data[this.sim_property][i];
                    let hist_idx = 4;
                    if (prop_value < (min + split)) hist_idx = 0;
                    else if (prop_value < (min + (2 *split))) hist_idx = 1;
                    else if (prop_value < (min + (3 * split))) hist_idx = 2;
                    else if (prop_value < (min + (4 * split))) hist_idx = 3;

                    hist_y[hist_idx]++;
                    area_values[this.neuron_areas[i]].push(prop_value);
                }
                area_range[0] = min;
                area_range[1] = max;
            }
            data1[0].x = hist_x;
            data1[0].y = hist_y;
            layout1.title.text = 'Histogram: ' + this.property_names[this.sim_property];
            Plotly.redraw('histogram');

            // let sub_size = this.neuron_areas.length / 10;
            // let calcium_sub = new Float32Array(sub_size);
            // let fired_rate_sub = new Float32Array(sub_size);
            // let axons_sub = new Float32Array(sub_size);
            // let dendrites_sub = new Float32Array(sub_size);
            // for (let i = 0; i < sub_size; i++) {
            //     let neuron_idx = i * 10;
            //     calcium_sub[i] = this.sim_data.current_calcium[neuron_idx];
            //     fired_rate_sub[i] = this.sim_data.fired_fraction[neuron_idx];
            //     axons_sub[i] = this.sim_data.grown_axons[neuron_idx];
            //     dendrites_sub[i] = this.sim_data.grown_dendrites[neuron_idx];
            // }
            data2[0].dimensions[0].values = this.sim_data.current_calcium;
            data2[0].dimensions[1].values = this.sim_data.fired_fraction;
            data2[0].dimensions[2].values = this.sim_data.grown_axons;
            data2[0].dimensions[3].values = this.sim_data.grown_dendrites;
            Plotly.redraw('parallel');

            for (let i = 0; i < 48; i++) {
                data3[i].y = area_values[i];
            }
            layout3.title.text = this.property_names[this.sim_property] + ' per Area';
            layout3.yaxis.range = area_range;
            Plotly.redraw('areas');
        };

        // Neuron Areas
        this.getCSV(BASE_URL + 'data/viz-no-network_positions.csv')
        .then((neurons) => {
            console.log(neurons.length + ' points');
            neurons.forEach((neuron) => {
                this.neuron_areas.push(parseInt(neuron[3]));
            });
        })
        .catch((err) => {
            console.log(err);
        });


        // WebSocket
        //this.ws = new WebSocket('wss://gliese.cs.stthomas.edu:8008');
        this.ws = new WebSocket('wss://scivis23-ws.onrender.com');
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
                //this.updateState(message.data);
                console.log(message.data);
                this.view_idx = message.data.view;
                this.sim_property = message.data.state.neuron_property;
                this.timeline.setTimestep(message.data.state.timestep);
                this.timeline.setSimulation(message.data.state.simulation);
                this.timeline.getData()
                .then((table) => {
                    updateChartData(table.neurons);
                    redrawCharts();
                })
                .catch((reason) => { console.error(reason); });
            }
            else {
                console.log(message);
            }
        };

        // Plotly JS chart
        let data1 = [{
            type: 'bar',
            x: ['N/A'],
            y: [0]
        }];
        let layout1 = this.generatePlotlyLayout('Histogram: Area', null, '# Neurons');

        let data2 = [{
            type: 'parcoords',
            line: {
                color: '#E7462A'
            },
            labelfont: {
                family: 'Arial, Helvetica, sans-serif',
                size: 16,
                color: '#FFFFFF'
            },
            rangefont: {
                family: 'Arial, Helvetica, sans-serif',
                size: 12,
                color: '#FFFFFF'
            },
            tickfont: {
                family: 'Arial, Helvetica, sans-serif',
                size: 12,
                color: '#FFFFFF'
            },
            tickcolor: '#FFFFFF',
            dimensions: [
                {
                    label: 'Calcium',
                    range: [0.0, 0.790452],
                    values: [0]
                },
                {
                    label: 'Fired Rate',
                    range: [0.0, 0.06],
                    values: [0.0]
                },
                {
                    label: 'Axons',
                    range: [0, 27],
                    values: [0]
                },
                {
                    label: 'Dendrites',
                    range: [0, 19],
                    values: [0]
                }
            ]
        }];
        let layout2 = this.generatePlotlyLayout('Neuron Properties', null, null);

        let data3 = [];
        for (let i = 0; i < 48; i++) {
            let values = [0];
            data3.push({
                type: 'box',
                name: i.toString(),
                y: values,
                marker: {
                    color: this.area_colors[i]
                },
                boxpoints: false
            });
        }
        let layout3 = this.generatePlotlyLayout('Area per Area', 'Area ID', 'Calcium', [0.0, 1.01]);

        Plotly.newPlot('histogram', data1, layout1, {responsive: true});
        Plotly.newPlot('parallel', data2, layout2, {responsive: true});
        Plotly.newPlot('areas', data3, layout3, {responsive: true});

        // Timeline
        this.timeline = new timeline.Timeline();
        this.timeline.getData()
        .then((table) => {
            updateChartData(table.neurons);
            redrawCharts();
        })
        .catch((reason) => { console.error(reason); });
    }
}
</script>

<template>
    <div id="main">
        <div id="gui" class="row">
            <div class="col-12 col-4-m padding-top-0-25rem">
                <h1 id="gui-title">Brain Plasticity</h1>
            </div>
            <div v-if="!joined_room" class="col-12 col-8-m padding-top-1rem padding-top-0-25rem-m">
                <label>Room:</label>
                <input class="text-input space-left space-right-half" type="text" placeholder="Enter ID" v-model="room_id"/>
                <button :class="'button-input ' + (ws_open ? 'join-btn' : 'disable-btn')" type="button" @click="joinRoom">Join</button>
                <button :class="'button-input ' + (ws_open ? 'create-btn' : 'disable-btn')" type="button" @click="createRoom">Create</button>
            </div>
            <div v-else class="col-12 col-8-m padding-top-1rem padding-top-0-25rem-m">
                <label class="text-display">{{ room_id }}</label>
                <button :class="'button-input ' + (ws_open ? 'leave-btn' : 'disable-btn')" type="button" @click="leaveRoom">Leave</button>
            </div>
        </div>
        <div id="info-container" class="row">
            <div class="col-12">
                <h2 id="info-bar"><span class="bold">View: </span>{{ view_idx }}, <span class="bold">Simulation: </span>"{{ timeline ? timeline.simulation : '--' }}", <span class="bold">Timestep: </span>{{ timeline ? timeline.timestep / 100: '--' }}</h2>
            </div>
        </div>
        <div id="content" class="row">
            <div id="histogram" class="col-12 col-6-m no-padding"></div>
            <div id="parallel" class="col-12 col-6-m no-padding"></div>
            <div id="areas" class="col-12 no-padding"></div>
        </div>
    </div>
</template>

<style scoped>
input, select, option, button {
    font-size: 1rem;
}

#main {
    width: 100%;
    min-height: 100%;
    background-color: #3C3C3C;
    color: #FFFFFF;
}

#gui {
    padding: 0.5rem;
}

#content {
    background-color: #1A1A1A;
    width: 100%;
    min-height: 100%;
    overflow-x: hidden;
}

#gui-title {
    font-size: 1.2rem;
    font-weight: bold;
}

#info-container {
    border-bottom: solid 1px #DCDCDC;
    border-top: solid 1px #DCDCDC;
    padding: 0.5em 0;
}

#info-bar {
    font-size: 1rem;
    font-weight: normal;
    margin-left: 0.5rem;
}

.row {
    margin: 0;
}

.bold {
    font-weight: bold;
}

.space-right {
    margin-right: 2rem;
}

.space-right-half {
    margin-right: 1rem;
}

.space-left {
    margin-left: 0.5rem;
}

.no-padding {
    padding: 0;
}

.text-input {
    width: 8rem;
}

.button-input {
    display: inline-block;
    width: 4.5rem;
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