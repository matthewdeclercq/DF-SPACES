import mongoose from 'mongoose'

const QuestionSetVersionSchema = new mongoose.Schema({
  questionSetId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FeedbackQuestion',
    required: true,
    index: true,
  },
  version: {
    type: Number,
    required: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  questions: [{
    type: String,
    required: true,
  }],
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: false,
})

QuestionSetVersionSchema.index({ questionSetId: 1, version: -1 }, { unique: true })

export default mongoose.models.QuestionSetVersion || mongoose.model('QuestionSetVersion', QuestionSetVersionSchema)


