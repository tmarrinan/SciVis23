<script>
import * as d3 from 'd3';

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
                console.log(message);
            }
        };

        // D3 chart
        let data = [
            {name: 'Thing 1', value: 6},
            {name: 'Thing 2', value: 2},
            {name: 'Thing 3', value: 9},
            {name: 'Thing 4', value: 7}
        ];
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