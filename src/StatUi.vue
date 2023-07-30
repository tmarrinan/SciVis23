<script>
import Plotly from 'plotly.js-dist'

export default {
    data() {
        return {
            ws: null,
            ws_open: false,
            joined_room: false,
            room_id: ''
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
        let data = [{
            type: 'bar',
            x: ['Thing 1', 'Thing 2', 'Thing 3', 'Thing 4'],
            y: [6, 2, 9, 7]
        }];
        let layout = {
            paper_bgcolor: 'rgba(0, 0, 0, 0.0)',
            plot_bgcolor: 'rgba(0, 0, 0, 0.0)',
            title: {
                text: 'Calcium',
                font: {
                    family: 'Arial, Helvetica, sans-serif',
                    size: 24,
                    color: '#FFFFFF'
                }
            },
            xaxis: {
                tickfont: {
                    family: 'Arial, Helvetica, sans-serif',
                    size: 12,
                    color: '#FFFFFF'
                }
            },
            yaxis: {
                title: {
                    text: '# Nuerons',
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
                }
            }
        }

        Plotly.newPlot('histogram', data, layout, {responsive: true});
        Plotly.newPlot('areas', data, layout, {responsive: true});
        Plotly.newPlot('test', data, layout, {responsive: true});

        setTimeout(() => {
            data[0].y[1] = 4;
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
            <div id="histogram" class="col-12 col-6-m col-4-l"></div>
            <div id="areas" class="col-12 col-6-m col-4-l"></div>
            <div id="test" class="col-12 col-6-m col-4-l"></div>
        </div>
    </div>
</template>

<style scoped>
input, select, option, button {
    font-size: 1rem;
}

/*
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
*/

#main {
    width: 100%;
    background-color: #3C3C3C;
    color: #FFFFFF;
}

#gui {
    padding: 0.5rem;
}

#content {
    background-color: #1A1A1A;
    width: 100%;
    height: 100%;
}

#gui-title {
    font-size: 1.2rem;
    font-weight: bold;
}

.row {
    margin: 0;
}

.chart-container {
    position: relative;
    width: 100%;
    height: 100%;
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