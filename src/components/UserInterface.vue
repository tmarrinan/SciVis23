<script>
export default {
    props: {},
    data() {
        return {
            near_clip_slider: 5,
            timestep_slider: 0
        }
    },
    computed: {
        near_clip() {
            return this.near_clip_slider / 10.0;
        },

        timestep() {
            return this.timestep_slider;
        }
    },
    emits: ['update-near-clip', 'update-timestep', 'update-simulation-selection'],
    methods: {
        updateNearClip(event) {
            this.$emit('update-near-clip', this.near_clip);
        },

        updateTimestep(event) {
             this.$emit('update-timestep', this.timestep);
        },

        updateSimulationStimulus(event) {
              this.$emit('update-simulation-selection', event.srcElement.value);
        }
    }
}
</script>

<template>
    <div class="user-interface">
        <label>Near Clip: {{ near_clip.toFixed(1) }}</label><br/>
        <input class="slider" type="range" min="5" max="300" v-model="near_clip_slider" @input="updateNearClip"/>
    </div>
    <div class="user-interface timestep">
        <label>Timestep: {{ timestep }}</label><br/>
        <input class="slider" type="range" min="0" max="1000" v-model="timestep_slider" @input="updateTimestep"/>
    </div>
    <div class="user-interface simulation">
        <label>Simulation:</label><br/>
        <section>
          <input class="radio" value="viz-calcium" type="radio" name="simulationRadio" checked="checked" @input="updateSimulationStimulus">
          viz-calcium
          <input class="radio" value="viz-disable" type="radio" name="simulationRadio" @input="updateSimulationStimulus">
          viz-disable
          <input class="radio" value="viz-no-network" type="radio" name="simulationRadio" @input="updateSimulationStimulus">
          viz-no-network
          <input class="radio" value="viz-stimulus" type="radio" name="simulationRadio" @input="updateSimulationStimulus">
          viz-stimulus
        </section>
    </div>
</template>

<style scoped>
.user-interface {
    position: absolute;
    right: 1rem;
    top: 1rem;
    width: 16rem;
    padding: 0.5rem;
    border-radius: 0.5rem;
    background-color: rgba(255, 255, 255, 0.8);
    z-index: 2;
}

.timestep {
  top: 6rem !important; 
}

.slider {
    width: 16rem;
}

.simulation {
  top: 12rem;
}
</style>
