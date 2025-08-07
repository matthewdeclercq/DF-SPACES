import mongoose from 'mongoose'

const FeedbackQuestionSchema = new mongoose.Schema({
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
}, {
  timestamps: true,
})

export default mongoose.models.FeedbackQuestion || mongoose.model('FeedbackQuestion', FeedbackQuestionSchema)
