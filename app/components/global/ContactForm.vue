<template>
  <section id="contact" class="py-16">
    <div class="mx-auto w-full px-4 fixed:max-w-350 fixed:3xl:max-w-screen-2xl">
      <div class="max-w-2xl mx-auto">
        <h2 class="text-3xl md:text-4xl font-bold text-center mb-8">Get In Touch</h2>
        <p class="text-center text-muted-foreground mb-12">
          Have a project in mind or want to collaborate? I'd love to hear from you.
        </p>

        <form @submit.prevent="handleSubmit" class="space-y-6">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label for="name">Name</Label>
              <Input
                id="name"
                v-model="form.name"
                placeholder="Your name"
                required
                class="mt-1"
              />
            </div>
            <div>
              <Label for="email">Email</Label>
              <Input
                id="email"
                v-model="form.email"
                type="email"
                placeholder="your@email.com"
                required
                class="mt-1"
              />
            </div>
          </div>

          <div>
            <Label for="subject">Subject</Label>
            <Input
              id="subject"
              v-model="form.subject"
              placeholder="What's this about?"
              required
              class="mt-1"
            />
          </div>

          <div>
            <Label for="message">Message</Label>
            <Textarea
              id="message"
              v-model="form.message"
              placeholder="Tell me about your project..."
              rows="5"
              required
              class="mt-1"
            />
          </div>

          <Button type="submit" size="lg" class="w-full" :disabled="isSubmitting">
            <span v-if="isSubmitting">Sending...</span>
            <span v-else>Send Message</span>
          </Button>
        </form>

        <!-- Success/Error Messages -->
        <div v-if="message" class="mt-6 p-4 rounded-lg" :class="message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'">
          {{ message.text }}
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
const form = reactive({
  name: '',
  email: '',
  subject: '',
  message: ''
})

const isSubmitting = ref(false)
const message = ref<{ type: 'success' | 'error'; text: string } | null>(null)

const handleSubmit = async () => {
  isSubmitting.value = true
  message.value = null

  try {
    // Simulate API call - replace with actual endpoint
    await new Promise(resolve => setTimeout(resolve, 1000))

    // Reset form
    Object.assign(form, { name: '', email: '', subject: '', message: '' })
    message.value = { type: 'success', text: 'Message sent successfully!' }
  } catch (error) {
    message.value = { type: 'error', text: 'Failed to send message. Please try again.' }
  } finally {
    isSubmitting.value = false
  }
}
</script>