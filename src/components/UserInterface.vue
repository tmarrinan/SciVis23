<script>
export default {
    props: {
        idx: {type: Number},
        num_views: {type: Number}
    },
    data() {
        return {
            show_ui: true,
            near_clip_slider: 5,
            timestep: 0,
            selected_simulation: 'viz-no-network',
            simulations: [
                {name: 'viz-no-network', description: 'No Initial Connectivity'},
                {name: 'viz-stimulus', description: 'Stimulation / Learning'},
                {name: 'viz-disable', description: 'Disable Areas / Injury'},
                {name: 'viz-calcium', description: 'Per-Neuron Calcium Targets'}
            ],
            selected_neuron_prop: 'area',
            neuron_properties: {
                area: 'Area',
                calcium: 'Calcium',
                calcium_target: 'Calcium to Target',
                fired: 'Fired',
                fired_fraction: 'Fired Rate',
                grown_axons: 'Axons',
                grown_excitatory_dendrites: 'Dendrites',
                connected_axons: 'Incoming Connections',
                connected_excitatory_dendrites: 'Outgoing Connections'
            }
        }
    },
    computed: {
        near_clip() {
            return this.near_clip_slider / 10.0;
        }
    },
    emits: ['update-near-clip', 'update-timestep', 'update-simulation-selection', 'update-neuron-property'],
    methods: {
        getLocationRight() {
            let rows = (this.num_views > 2) ? 2 : 1;
            let cols = this.num_views / rows;
            let x = this.idx % cols;
            return ((cols - x - 1) * (100 / cols)) + '%';
        },

        getLocationTop() {
            let rows = (this.num_views > 2) ? 2 : 1;
            let cols = this.num_views / rows;
            let y = ~~(this.idx / cols);
            return ((y) * (100 / rows)) + '%';
        },

        toggleShowUi(event) {
            this.show_ui = !this.show_ui;
        },

        updateNearClip(event) {
            this.$emit('update-near-clip', {idx: this.idx, data: this.near_clip});
        },

        updateTimestep(event) {
             this.$emit('update-timestep', {idx: this.idx, data: this.timestep});
        },

        updateSimulationStimulus(event) {
              this.$emit('update-simulation-selection', {idx: this.idx, data: this.selected_simulation});
        },

        updateNeuronProperty(event) {
            this.$emit('update-neuron-property', {idx: this.idx, data: this.selected_neuron_prop});
        }
    },
    mounted() {
        if (this.idx > 0) this.show_ui = false;
    }
}
</script>

<template>
    <div class="user-interface" :style="'right: calc(' + getLocationRight() + ' + 1rem); top: calc(' + getLocationTop() + ' + 1rem);'">
        <div class="neuron-legend">
            <label>Neurons:</label><br/>
            <label>{{ neuron_properties[selected_neuron_prop] }}</label>
            <img src="/images/areas_cmap.png" alt="colormap" />
        </div>
        <div class="widgets">
            <div v-show="show_ui">
                <div style="width: 16rem; text-align: right; margin-bottom: 0.5rem;">
                    <button class="show-hide-ui" type="button" @click="toggleShowUi"><img class="show-hide-arrow" src="/images/down-arrow.png" alt="down arrow"/></button>
                </div>
                <label>Near Clip: {{ near_clip.toFixed(1) }}</label><br/>
                <input class="ui-element" type="range" min="5" max="300" v-model="near_clip_slider" @input="updateNearClip"/>
                <br/>
                <label>Timestep: {{ timestep }}</label><br/>
                <input class="ui-element" type="range" min="0" max="1000" v-model="timestep" @change="updateTimestep"/>
                <br/>
                <label>Simulation:</label><br/>
                <select class="ui-element" v-model="selected_simulation" @change="updateSimulationStimulus">
                    <option v-for="item in simulations" :value="item.name">{{ item.description }}</option>
                </select>
                <br/>
                <label>Neuron Property:</label><br/>
                <select class="ui-element last" v-model="selected_neuron_prop" @change="updateNeuronProperty">
                    <option v-for="(item, key) in neuron_properties" :value="key">{{ item }}</option>
                </select>
            </div>
            <div v-show="!show_ui">
                <button class="show-hide-ui" type="button"  @click="toggleShowUi"><img class="show-hide-arrow" src="/images/left-arrow.png" alt="left arrow"/></button>
            </div>
        </div>
    </div>
</template>

<style scoped>
label, input, select, option {
    font-size: 1rem;
}

.user-interface {
    position: absolute;
    z-index: 2;
}

.widgets {
    position: relative;
    padding: 0.5rem;
    border-radius: 0.5rem;
    background-color: rgba(255, 255, 255, 0.8);
    color: #000000;
}

.neuron-legend {
    position: absolute;
    right: 0rem;
    top: 5rem;
    width: 6.5rem;
    text-align: center;
}

.neuron-legend label {
    color: #FFFFFF;
}

.neuron-legend img {
    width: 6.5rem;
    height: 10rem;
    image-rendering: pixelated;
    transform: scale(0.2, 1.54) rotate(-90deg);
    margin-top: 1rem;
}

.show-hide-ui {
    width: 1.5rem;
    height: 1.5rem;
    padding: 0.1rem;
}

.show-hide-arrow {
    width: 1.1rem;
    height: 1.1rem;
    margin: 0;
}

.ui-element {
    width: 16rem;
    margin-bottom: 1rem;
}

.last {
    margin-bottom: 0;
}

</style>
