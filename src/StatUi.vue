<script>
import * as d3 from 'd3';

export default {
    data() {
        return {
            ws: null,
            ws_open: false
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
        };

        // D3 chart
        let data = [
            {name: 'Thing 1', value: 6},
            {name: 'Thing 2', value: 2},
            {name: 'Thing 3', value: 9},
            {name: 'Thing 4', value: 7}
        ]
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
             .attr('height', d => (height - y_axis(d.value)));

        d3svg.append('g').classed('d3axis', true)
                         .attr('transform', 'translate(0,' + height + ')')
                         .call(d3.axisBottom(x_axis));

        d3svg.append('g').classed('d3axis', true)
                         .call(d3.axisLeft(y_axis));
    }
}
</script>

<template>
    <svg id="d3-chart"></svg>
</template>

<style scoped>
svg :deep(.d3bar) {
    stroke: #4362A4;
    stroke-width: 5px;
    fill: #2687E8;
}

svg :deep(.d3axis) {
    font-size: 1rem;
}
</style>