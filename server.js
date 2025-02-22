import express from 'express'
import cors from 'cors'
import mongoose from 'mongoose'
import dotenv from 'dotenv'
import listEndpoints from 'express-list-endpoints'

dotenv.config()

const mongoUrl = process.env.MONGO_URL || "mongodb://localhost/happyThoughts"
mongoose.connect(mongoUrl, { useNewUrlParser: true, useUnifiedTopology: true })
mongoose.Promise = Promise

const port = process.env.PORT || 8080
const app = express()

app.use(cors())
app.use(express.json());

app.use((req, res, next) => {
  if (mongoose.connection.readyState === 1) {
    next()
  } else {
    res.status(503).json({ error: 'Service unavaliable' })
  }
})

const thoughtSchema = new mongoose.Schema({
  message: {
    type: String,
    required: true,
    minlength: 5,
    maxlength: 140
  },
  hearts: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
})

const Thought = mongoose.model('Thought', thoughtSchema)

app.get('/', (req, res) => {
  res.send(listEndpoints(app))
})

app.get('/thoughts', async (req, res) => {
  try {
    const thoughts = await Thought.find().sort({ createdAt: 'desc' }).limit(20).exec()
    res.json(thoughts)
  } catch (err) {
    res.status(400).json({ message: 'could not find list of thoughts', error: err.errors })
  }
})

app.post('/thoughts', async (req, res) => {
  const { message } = req.body
  const thought = new Thought({ message })

  try {
    const savedThought = await thought.save()
    res.status(201).json(savedThought)
  } catch (err) {
    res.status(400).json({ message: 'Could not save thought to the database', error: err.errors })
  }
})

app.post('/thoughts/:thoughtId/like', async (req, res) => {
  const { thoughtId } = req.params

  try {
    const likes = await Thought.updateOne({ _id: thoughtId }, { $inc: { hearts: 1 } })
    if (likes) {
      res.status(200).json(likes)
    } else {
      res.status(404).json({ error: 'Not found' })
    }
  } catch (err) {
    res.status(400).json({ message: 'Invalid request', error: err.errors })
  }
})

app.delete('/thoughts/:thoughtId', async (req, res) => {
  const { thoughtId } = req.params
  try {
    const deletedThought = await Thought.findOneAndDelete({ _id: thoughtId })
    if (deletedThought) {
      res.json(deletedThought)
    } else {
      res.status(404).json({ message: 'Not found' })
    }
  } catch (error) {
    res.status(400).json({ message: 'Invalid request', error })
  }
})

app.listen(port, () => {
  // eslint-disable-next-line
  console.log(`Server running on http://localhost:${port}`)
})
