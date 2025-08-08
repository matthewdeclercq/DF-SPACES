import mongoose from 'mongoose'

const FeedbackQuestionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  category: {
    type: String,
    required: true,
    enum: ['company', 'project', 'coworkers', 'self'],
  },
  questions: [{
    type: String,
    required: true,
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  isArchived: {
    type: Boolean,
    default: false,
    index: true,
  },
}, {
  timestamps: true,
})

export default mongoose.models.FeedbackQuestion || mongoose.model('FeedbackQuestion', FeedbackQuestionSchema)
