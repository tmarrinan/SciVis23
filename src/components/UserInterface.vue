<script>
import NeuronVis from './NeuronVis.vue';

const BASE_URL = import.meta.env.BASE_URL || '/';

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
            show_diff: false,
            show_tab: 1,
            timestep: 0,
            timestep2: 0,
            timestep_start: 0,
            timestep_end: 9999,
            selected_simulation: 'viz-no-network',
            selected_simulation2: 'viz-no-network',
            global_scalar_range: true,
            displace_neurons: false,
            visibility: [
                {name: 'neurons', description: 'Neurons'},
                {name: 'connections', description: 'Connections'},
                {name: 'neuron-connections', description: 'Neurons & Connections'}
            ],
            selected_visibility: 'neurons',
            simulations: [
                {name: 'viz-no-network', description: 'No Initial Connectivity'},
                {name: 'viz-stimulus', description: 'Stimulation / Learning'},
                {name: 'viz-disable', description: 'Disable Areas / Injury'},
                {name: 'viz-calcium', description: 'Per-Neuron Calcium Targets'}
            ],
            selected_neuron_prop: 'area',
            // TODO: enable local min/max on colormap legend scale
            neuron_properties: {
                area: {name: 'Area', min: 0, max: 47},
                current_calcium: {name: 'Calcium', min: 0.000000, max: 0.790452},
                target_calcium: {name: 'Calcium to Target', min: -0.70, max: 0.70},
                fired: {name: 'Fired', min: 0.0, max: 1.0},
                fired_fraction: {name: 'Fired Rate', min: 0.00, max: 0.06},
                grown_axons: {name: 'Axons', min: 0, max: 27},
                grown_dendrites: {name: 'Dendrites', min: 0, max: 19},
                connected_acons: {name: 'Incoming Synapses', min: 0, max: 27},
                connected_dendrites: {name: 'Outgoing Synapses', min: 0, max: 19}
            },
            neuron_local_ranges: null,
            neuron_diff_range: null
        }
    },
    computed: {
        near_clip() {
            return this.near_clip_slider / 10.0;
        },

        colormap_image() {
            if (this.selected_neuron_prop === 'area') {
                return BASE_URL + 'images/areas_cmap.png';
            }
            else if (!this.show_diff && ['current_calcium', 'fired_fraction', 'grown_axons', 'grown_dendrites',
                                         'connected_acons', 'connected_dendrites'].includes(this.selected_neuron_prop)) {
                return BASE_URL + 'images/lowhigh2_cmap.png';
            }
            else {
                return BASE_URL + 'images/divergent_cmap.png';
            }
        }
    },
    emits: ['update-visibility', 'update-near-clip', 'set-single-diff', 'update-timestep',
            'update-timestep2', 'update-simulation-selection', 'update-simulation-selection2',
            'update-neuron-property', 'use-global-scalar-range', 'displace-neurons'],
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

        colormapLegendMin() {
            let cmap_min = this.neuron_properties[this.selected_neuron_prop].min;
            if (this.selected_neuron_prop !== 'area' && this.show_diff && this.neuron_diff_range != null) {
                cmap_min = this.neuron_diff_range.min;
            }
            else if (!this.global_scalar_range) {
                cmap_min = this.neuron_local_ranges[this.selected_neuron_prop].min;
            }
            return this.formatPropertyRangeValue(cmap_min);
        },

        colormapLegendMax() {
            let cmap_max = this.neuron_properties[this.selected_neuron_prop].max;
            if (this.selected_neuron_prop !== 'area' && this.show_diff && this.neuron_diff_range != null) {
                cmap_max = this.neuron_diff_range.max;
            }
            else if (!this.global_scalar_range) {
                cmap_max = this.neuron_local_ranges[this.selected_neuron_prop].max + 0.000001;
            }
            return this.formatPropertyRangeValue(cmap_max);
        },

        formatPropertyRangeValue(value) {
            if (['current_calcium', 'target_calcium'].includes(this.selected_neuron_prop)) {
                return value.toFixed(3);
            }
            else if (this.selected_neuron_prop === 'fired' && this.show_diff) {
                console.log(value);
                return value > 0 ? '+1' : '-1';
            }
            else if (this.selected_neuron_prop === 'fired') {
                return value === 0 ? 'False' : 'True';
            }
            else if (this.selected_neuron_prop === 'fired_fraction') {
                return (100 * value).toFixed(1) + '%';
            }
            else {
                return parseInt(value);
            }
        },

        toggleShowUi(event) {
            this.show_ui = !this.show_ui;
        },

        updateVisibility(event) {
            this.$emit('update-visibility',  {idx: this.idx, data: this.selected_visibility});
        },

        updateNearClip(event) {
            this.$emit('update-near-clip', {idx: this.idx, data: this.near_clip});
        },

        setUiValues(data) {
            this.show_diff = data.show_diff;
            if (!this.show_diff) this.show_tab = 1;
            this.timestep = data.timestep;
            this.timestep2 = data.timestep2;
            this.selected_simulation = data.simulation;
            this.selected_simulation2 = data.simulation2;
            this.selected_neuron_prop = data.neuron_property;
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
             this.$emit('update-timestep', {idx: this.idx, data: parseInt(this.timestep)});
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

        updateTimestep2(event) {
             this.$emit('update-timestep2', {idx: this.idx, data: parseInt(this.timestep2)});
        },

        decrementTimestep2(event) {
            if (this.timestep2 > this.timestep_start) {
                this.timestep2--;
                this.updateTimestep2();
            }
        },

        incrementTimestep2(event) {
            if (this.timestep2 < this.timestep_end) {
                this.timestep2++;
                this.updateTimestep2();
            }
        },

        updateSimulationSelection(event) {
              this.$emit('update-simulation-selection', {idx: this.idx, data: this.selected_simulation});
        },

        updateSimulationSelection2(event) {
              this.$emit('update-simulation-selection2', {idx: this.idx, data: this.selected_simulation2});
        },

        updateNeuronProperty(event) {
            this.$emit('update-neuron-property', {idx: this.idx, data: this.selected_neuron_prop});
        },

        updateScalarRangeType(event) {
            this.$emit('use-global-scalar-range', {idx: this.idx, data: this.global_scalar_range});
        },

        updateDisplaceNeurons(event) {
            this.$emit('displace-neurons', {idx: this.idx, data: this.displace_neurons});
        },

        toggleDiffCheckbox(event) {
            this.show_diff = !this.show_diff;
            this.$emit('set-single-diff', {idx: this.idx, data: this.show_diff});
        },

        showDiffTab1(event) {
            this.show_tab = 1;
        },

        showDiffTab2(event) {
            this.show_tab = 2;
        },

        setLocalRanges(local_ranges) {
            this.neuron_local_ranges = local_ranges;
        },

        setDiffRange(diff_range) {
            this.neuron_diff_range = diff_range;
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
                <label class="neuron-legend-min">{{ colormapLegendMin() }}</label><br/>
                <label class="neuron-legend-max">{{ colormapLegendMax() }}</label>
            </div>
        </div>
        <div class="widgets">
            <div v-show="show_ui">
                <div style="width: 16.5rem; text-align: right; margin-bottom: 0.5rem;">
                    <button class="show-hide-ui" type="button" @click="toggleShowUi"><img class="show-hide-arrow" src="/images/down-arrow.png" alt="down arrow"/></button>
                </div>
                <div class="sim-group-clear">
                    <label>Visibility:</label><br/>
                    <select class="ui-element" v-model="selected_visibility" @change="updateVisibility">
                        <option v-for="item in visibility" :value="item.name">{{ item.description }}</option>
                    </select>
                    <br/>
                    <label>Displace Neurons:</label>
                    <input class="ui-checkbox" type="checkbox" v-model="displace_neurons" @change="updateDisplaceNeurons"/>
                    <br/>
                    <label>Near Clip: {{ near_clip.toFixed(1) }}</label><br/>
                    <button class="ui-slider-btn last" type="button" @click="decrementNearClip"><img src="/images/left-arrow.png" alt="left arrow"/></button>
                    <input class="ui-slider last" type="range" :min="near_clip_start" :max="near_clip_end" v-model="near_clip_slider" @input="updateNearClip"/>
                    <button class="ui-slider-btn last" type="button" @click="incrementNearClip"><img src="/images/right-arrow.png" alt="right arrow"/></button>
                </div>
                <div class="sim-group">
                    <div class="border-top-left"></div>
                    <div class="center-title">
                        <label>Single</label>
                        <div class="ui-check-slide-container">
                            <div class="ui-check-slide" :selected="show_diff" @click="toggleDiffCheckbox"></div>
                        </div>
                        <label>Diff</label>
                    </div>
                    <div class="border-top-right"></div>
                    <div v-if="show_diff" class="diff-tab-container">
                        <label class="diff-tab" :selected="show_tab === 1" @click="showDiffTab1">Data Set 1</label>
                        <label class="diff-tab" :selected="show_tab === 2" @click="showDiffTab2">Data Set 2</label>
                    </div>
                    <div v-show="!show_diff || show_tab === 1">
                        <label>Timestep: {{ timestep }}</label><br/>
                        <button class="ui-slider-btn" type="button" @click="decrementTimestep"><img src="/images/left-arrow.png" alt="left arrow"/></button>
                        <input class="ui-slider" type="range" :min="timestep_start" :max="timestep_end" v-model="timestep" @change="updateTimestep"/>
                        <button class="ui-slider-btn" type="button" @click="incrementTimestep"><img src="/images/right-arrow.png" alt="right arrow"/></button>
                        <br/>
                        <label>Simulation:</label><br/>
                        <select class="ui-element last" v-model="selected_simulation" @change="updateSimulationSelection">
                            <option v-for="item in simulations" :value="item.name">{{ item.description }}</option>
                        </select>
                    </div>
                    <div v-show="show_diff && show_tab === 2">
                        <label>Timestep: {{ timestep2 }}</label><br/>
                        <button class="ui-slider-btn" type="button" @click="decrementTimestep2"><img src="/images/left-arrow.png" alt="left arrow"/></button>
                        <input class="ui-slider" type="range" :min="timestep_start" :max="timestep_end" v-model="timestep2" @change="updateTimestep2"/>
                        <button class="ui-slider-btn" type="button" @click="incrementTimestep2"><img src="/images/right-arrow.png" alt="right arrow"/></button>
                        <br/>
                        <label>Simulation:</label><br/>
                        <select class="ui-element last" v-model="selected_simulation2" @change="updateSimulationSelection2">
                            <option v-for="item in simulations" :value="item.name">{{ item.description }}</option>
                        </select>
                    </div>
                </div>
                <div class="sim-group-clear">
                    <label>Neuron Property:</label><br/>
                    <select class="ui-element" v-model="selected_neuron_prop" @change="updateNeuronProperty">
                        <option v-for="(item, key) in neuron_properties" :value="key">{{ item.name }}</option>
                    </select>
                    <br/>
                    <label>Global Scalar Range:</label>
                    <input class="ui-checkbox last" type="checkbox" v-model="global_scalar_range" @change="updateScalarRangeType"/>
                </div>
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
    padding: 0.5rem 0.25rem;
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

.ui-checkbox {
    margin: 0 0 1rem 0.75rem;
}

.center-title {
    display: inline-block;
    position: relative;
    top: -1rem;
    width: 80%;
    text-align: center;
}

.diff-tab-container {
    position: relative;
    top: -0.75rem;
    width: 100%;
    text-align: center;
    border-bottom: solid 1px #3A3A3A;
}

.diff-tab {
    display: inline-block;
    border: solid 1px #3A3A3A;
    border-top-left-radius: 0.5rem;
    border-top-right-radius: 0.5rem;
    border-bottom: none;
    width: 45%;
}

.diff-tab[selected=true] {
    background-color: rgba(132, 132, 132, 0.5);
}

.border-top-left {
    display: inline-block;
    position: relative;
    top: -0.5rem;
    left: -0.5rem;
    width: 10%;
    height: 1rem;
    border-top: solid 1px #3A3A3A;
}

.border-top-right {
    display: inline-block;
    position: relative;
    top: -0.5rem;
    left: 0.5rem;
    width: 10%;
    height: 1rem;
    border-top: solid 1px #3A3A3A;
}

.ui-check-slide-container {
    display: inline-block;
    background-color: #FFFFFF;
    width: 3rem;
    height: 1rem;
    border: solid 1px #3A3A3A;
    border-radius: 0.5rem;
    margin: 0 0.5rem;
}

.ui-check-slide {
    width: 0.9rem;
    height: 0.9rem;
    background-color: #317CEC;
    border-radius: 50%;
    transform: translate(-0.975rem, 0);
    transition: transform 0.25s;
}

.ui-check-slide:hover {
    background-color: #285FB0;
}

.ui-check-slide[selected=true] {
    transform: translate(0.925rem, 0);
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

.sim-group {
    border: solid 1px #3A3A3A;
    border-top: none;
    padding: 0.5rem;
    margin: 1rem 0;
}

.sim-group-clear {
    padding: 0 0.5rem;
}

.last {
    margin-bottom: 0;
}

</style>
