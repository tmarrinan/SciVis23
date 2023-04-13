<script>
export default {
    props: {},
    data() {
        return {
            show_ui: true,
            near_clip_slider: 5,
            timestep: 0,
            sim_dataset: 'viz-no-network'
        }
    },
    computed: {
        near_clip() {
            return this.near_clip_slider / 10.0;
        }
    },
    emits: ['update-near-clip', 'update-timestep', 'update-simulation-selection'],
    methods: {
        toggleShowUi(event) {
            this.show_ui = !this.show_ui;
        },

        updateNearClip(event) {
            this.$emit('update-near-clip', this.near_clip);
        },

        updateTimestep(event) {
             this.$emit('update-timestep', this.timestep);
        },

        updateSimulationStimulus(event) {
              this.$emit('update-simulation-selection', this.sim_dataset);
        }
    }
}
</script>

<template>
    <div class="user-interface">
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
            <select class="ui-element last" v-model="sim_dataset" @change="updateSimulationStimulus">
                <option value="viz-no-network">No Initial Connectivity</option>
                <option value="viz-stimulus">Stimulation / Learning</option>
                <option value="viz-disable">Disable Areas / Injury</option>
                <option value="viz-calcium">Per-Neuron Calcium Targets</option>
            </select>
        </div>
        <div v-show="!show_ui">
            <button class="show-hide-ui" type="button"  @click="toggleShowUi"><img class="show-hide-arrow" src="/images/left-arrow.png" alt="left arrow"/></button>
        </div>
    </div>
</template>

<style scoped>
label, input, select, option {
    font-size: 1rem;
}

.user-interface {
    position: absolute;
    right: 1rem;
    top: 1rem;
    padding: 0.5rem;
    border-radius: 0.5rem;
    background-color: rgba(255, 255, 255, 0.8);
    color: #000000;
    z-index: 2;
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
