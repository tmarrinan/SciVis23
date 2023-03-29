<script>
  /** import { Rectangle } from '@babylonjs/gui/2D/controls/rectangle'; */
export default {
    props: {},
    data() {
        return {
            near_clip_slider: 1,
            timestep_slider: 1
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
    methods: {
        updateNearClip(event) {
            this.$emit('update-near-clip', this.near_clip);
        },

        updateTimestep(event) {
             this.$emit('update-timestep', this.timestep);
        }
    }
}
</script>

<template>
    <div class="user-interface">
        <label>Near Clip: {{ near_clip.toFixed(1) }}</label><br/>
        <input class="slider" type="range" min="1" max="250" v-model="near_clip_slider" @input="updateNearClip"/>
    </div>
    <div class="user-interface timestep">
        <label>Timestep: {{ timestep }}</label><br/>
        <input class="slider" type="range" min="0" max="1000" v-model="timestep_slider" @input="updateTimestep"/>
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
</style>
