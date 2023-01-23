<script>
import UserInterface from './components/UserInterface.vue'
import NeuronVis from './components/NeuronVis.vue'

export default {
    data() {
        return {}
    },
    components: {
        UserInterface,
        NeuronVis
    }
}
</script>

<template>
    <UserInterface/>
    <NeuronVis/>
</template>
