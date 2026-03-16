<script setup lang="ts">
const route = useRoute()
await navigateTo(`/projects/${route.params.category}`, { redirectCode: 301 })
</script>
