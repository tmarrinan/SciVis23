<script>
export default {
    data() {
        return {
            test: 'Hello World!'
        }
    }
}
</script>

<template>
    <p class="test">{{ test }}</p>
</template>

<style scoped>
.test {
    color: #0A8888;
}
</style>