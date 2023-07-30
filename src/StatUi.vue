<script>
import Plotly from 'plotly.js-dist'

export default {
    data() {
        return {
            ws: null,
            ws_open: false,
            joined_room: false,
            room_id: '',
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
                    zerolinecolor: '#FFFFFF',
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
                this.updateState(message.data);
            }
            else {
                console.log(message);
            }
        };

        // Plotly JS chart
        let data1 = [{
            type: 'bar',
            x: ['Thing 1', 'Thing 2', 'Thing 3', 'Thing 4'],
            y: [6, 2, 9, 7]
        }];
        let layout1 = this.generatePlotlyLayout('Histogram: Calcium', null, '# Neurons');

        let data2 = [{
            type: 'bar',
            x: ['Test1', 'Test2', 'Test3'],
            y: [16, 8, 12]
        }];
        let layout2 = this.generatePlotlyLayout('Calcium', 'Something', '# Neurons');

        let data3 = [];
        for (let i = 0; i < 48; i++) {
            let values = [];
            for (let j = 0; j < 12; j++) {
                values.push(0.6 * Math.random() + 0.3);
            }
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
        let layout3 = this.generatePlotlyLayout('Calcium Per Area', 'Area ID', 'Calcium', [0.0, 1.01]);

        Plotly.newPlot('histogram', data1, layout1, {responsive: true});
        Plotly.newPlot('test', data2, layout2, {responsive: true});
        Plotly.newPlot('areas', data3, layout3, {responsive: true});

        setTimeout(() => {
            data1[0].y[1] = 4;
            layout1.title.text = 'Fired Rate'
            Plotly.redraw('histogram');
        }, 2000);
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
        <div id="content" class="row">
            <div id="histogram" class="col-12 col-6-m no-padding"></div>
            <div id="test" class="col-12 col-6-m no-padding"></div>
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

.row {
    margin: 0;
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