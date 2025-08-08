import mongoose from 'mongoose'

const FeedbackRequestSchema = new mongoose.Schema({
  category: {
    type: String,
    required: true,
    enum: ['company', 'project', 'coworkers', 'self'],
  },
  questionSet: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FeedbackQuestion',
    required: true,
  },
  targets: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false,
    default: [],
  }],
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false,
  },
  recipients: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: [],
  }],
  deadline: {
    type: Date,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
}, {
  timestamps: true,
})

export default mongoose.models.FeedbackRequest || mongoose.model('FeedbackRequest', FeedbackRequestSchema)
