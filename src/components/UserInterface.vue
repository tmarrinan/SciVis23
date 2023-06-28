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
            near_clip_start: 5,
            near_clip_end: 300,
            timestep: 0,
            timestep_start: 0,
            timestep_end: 1000,
            selected_simulation: 'viz-no-network',
            simulations: [
                {name: 'viz-no-network', description: 'No Initial Connectivity'},
                {name: 'viz-stimulus', description: 'Stimulation / Learning'},
                {name: 'viz-disable', description: 'Disable Areas / Injury'},
                {name: 'viz-calcium', description: 'Per-Neuron Calcium Targets'}
            ],
            selected_neuron_prop: 'area',
            neuron_properties: {
                area: {name: 'Area', min: 0, max: 48},
                calcium: {name: 'Calcium', min: 0.0, max: 1.1},
                calcium_target: {name: 'Calcium to Target', min: -0.7, max: 0.7},
                fired: {name: 'Fired', min: 'False', max: 'True'},
                fired_fraction: {name: 'Fired Rate', min: 0.0, max: 1.0},
                grown_axons: {name: 'Axons', min: 0, max: 50},
                grown_excitatory_dendrites: {name: 'Dendrites', min: 0, max: 50},
                connected_axons: {name: 'Incoming Connections', min: 0, max: 50},
                connected_excitatory_dendrites: {name: 'Outgoing Connections', min: 0, max: 50}
            }
        }
    },
    computed: {
        near_clip() {
            return this.near_clip_slider / 10.0;
        },

        colormap_image() {
            if (this.selected_neuron_prop === 'area') {
                return '/images/areas_cmap.png';
            }
            else if (['calcium', 'fired_fraction', 'grown_axons', 'grown_excitatory_dendrites',
                      'connected_axons', 'connected_excitatory_dendrites'].includes(this.selected_neuron_prop)) {
                return '/images/lowhigh2_cmap.png';
            }
            else {
                return '/images/divergent_cmap.png';
            }
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

        decrementNearClip(event) {
            if (this.near_clip_slider > this.near_clip_start) {
                this.near_clip_slider--;
                this.updateNearClip();
            }
        },

        incrementNearClip(event) {
            if (this.near_clip_slider < this.near_clip_end) {
                this.near_clip_slider++;
                this.updateNearClip();
            }
        },

        updateTimestep(event) {
             this.$emit('update-timestep', {idx: this.idx, data: this.timestep});
        },

        decrementTimestep(event) {
            if (this.timestep > this.timestep_start) {
                this.timestep--;
                this.updateTimestep();
            }
        },

        incrementTimestep(event) {
            if (this.timestep < this.timestep_end) {
                this.timestep++;
                this.updateTimestep();
            }
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
            <label>{{ neuron_properties[selected_neuron_prop].name }}</label><br/>
            <img :src="colormap_image" alt="colormap" />
            <div style="width: 100%; text-align: right;">
                <label class="neuron-legend-min">{{ neuron_properties[selected_neuron_prop].min }}</label><br/>
                <label class="neuron-legend-max">{{ neuron_properties[selected_neuron_prop].max }}</label>
            </div>
        </div>
        <div class="widgets">
            <div v-show="show_ui">
                <div style="width: 16rem; text-align: right; margin-bottom: 0.5rem;">
                    <button class="show-hide-ui" type="button" @click="toggleShowUi"><img class="show-hide-arrow" src="/images/down-arrow.png" alt="down arrow"/></button>
                </div>
                <label>Near Clip: {{ near_clip.toFixed(1) }}</label><br/>
                <button class="ui-slider-btn" type="button" @click="decrementNearClip"><img src="/images/left-arrow.png" alt="left arrow"/></button>
                <input class="ui-slider" type="range" :min="near_clip_start" :max="near_clip_end" v-model="near_clip_slider" @input="updateNearClip"/>
                <button class="ui-slider-btn" type="button" @click="incrementNearClip"><img src="/images/right-arrow.png" alt="left arrow"/></button>
                <br/>
                <label>Timestep: {{ timestep }}</label><br/>
                <button class="ui-slider-btn" type="button" @click="decrementTimestep"><img src="/images/left-arrow.png" alt="left arrow"/></button>
                <input class="ui-slider" type="range" :min="timestep_start" :max="timestep_end" v-model="timestep" @change="updateTimestep"/>
                <button class="ui-slider-btn" type="button" @click="incrementTimestep"><img src="/images/right-arrow.png" alt="left arrow"/></button>
                <br/>
                <label>Simulation:</label><br/>
                <select class="ui-element" v-model="selected_simulation" @change="updateSimulationStimulus">
                    <option v-for="item in simulations" :value="item.name">{{ item.description }}</option>
                </select>
                <br/>
                <label>Neuron Property:</label><br/>
                <select class="ui-element last" v-model="selected_neuron_prop" @change="updateNeuronProperty">
                    <option v-for="(item, key) in neuron_properties" :value="key">{{ item.name }}</option>
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

.neuron-legend-min {
    position: relative;
    top: -1.25rem;
    right: 5rem;
}

.neuron-legend-max {
    position: relative;
    top: -11.5rem;
    right: 5rem;
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

.ui-slider {
    width: 13rem;
    margin: 0 0.25rem 1rem 0.25rem;
}

.ui-slider-btn {
    width: 1.25rem;
    height: 1.25rem;
    padding: 0.25rem;
    border: none;
    border-radius: 25%;
    background-color: #EEEEEE;
}

.ui-slider-btn:active {
    background-color: #A8A8A8;
}

.ui-slider-btn img {
    width: 0.75rem;
    height: 0.75rem;
}

.last {
    margin-bottom: 0;
}

</style>
