<script>
export default {
    props: {},
    data() {
        return {
            num_views: 1
        }
    },
    methods: {
        updateNumViews(event) {
            this.$emit('update-num-views', this.num_views);
        }
    }
}
</script>

<template>
    <div id="global-gui">
        <span id="gui-title">Brain Plasticity</span>
        <label>Views:</label>
        <input class="num-input" type="number" min="1" max="8" v-model="num_views" @input="updateNumViews"/>
        <label>Other stuff here...</label>
    </div>
</template>

<style scoped>
#gui-title {
    font-size: 1.2rem;
    font-weight: bold;
    margin-right: 8rem;
}

#global-gui {
    padding: 0.5rem;
    font-size: 1rem;
}

.num-input {
    width: 3.5rem;
    margin: 0 2rem 0 0.5rem;
}
</style>