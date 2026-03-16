<script setup lang="ts">
const route = useRoute()
await navigateTo(`/projects/${route.params.category}/${route.params.slug}/access`, { redirectCode: 301 })
</script>
