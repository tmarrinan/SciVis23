<script>
export default {
    props: {}
}
</script>

<template>
    <div class="user-interface">
        <p @click="testFunc">Test 1</p>
        <p>Test 2</p>
    </div>
</template>

<style scoped>
.user-interface {
    position: absolute;
    right: 1rem;
    top: 1rem;
    width: 12rem;
    padding: 0.5rem;
    border-radius: 0.5rem;
    background-color: rgba(255, 255, 255, 0.8);
    z-index: 2;
}
</style>
