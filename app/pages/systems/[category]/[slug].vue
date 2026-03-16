<script setup lang="ts">
const route = useRoute()
await navigateTo(`/projects/${route.params.category}/${route.params.slug}`, { redirectCode: 301 })
</script>
