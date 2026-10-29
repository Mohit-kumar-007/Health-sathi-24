import mongoose from 'mongoose'
import { createApp } from './app'
import { config } from './config'

await mongoose.connect(config.MONGODB_URI)
const { app } = createApp()

app.listen(config.PORT, () => {
  console.log(`HealthSathi24 API listening on port ${config.PORT}`)
})
