<script>
export default {
    props: {},
    data() {
        return {
            near_clip_slider: 1
        }
    },
    computed: {
        near_clip() {
            return this.near_clip_slider / 10.0;
        }
    },
    methods: {
        updateNearClip(event) {
            this.$emit('update-near-clip', this.near_clip);
        }
    }
}
</script>

<template>
    <div class="user-interface">
        <label>Near Clip: {{ near_clip.toFixed(1) }}</label><br/>
        <input class="slider" type="range" min="1" max="250" v-model="near_clip_slider" @input="updateNearClip"/>
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

.slider {
    width: 16rem;
}
</style>
