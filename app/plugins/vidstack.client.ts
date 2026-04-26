import 'vidstack/styles/base.css'
import 'vidstack/styles/defaults.css'
import 'vidstack/styles/community-skin/audio.css'
import 'vidstack/styles/community-skin/video.css'
import { defineCustomElements } from 'vidstack/elements'

export default defineNuxtPlugin(async () => {
  await defineCustomElements()
})
