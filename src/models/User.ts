import mongoose from 'mongoose'

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  image: {
    type: String,
  },
  bio: {
    type: String,
    default: '',
  },
  interests: [{
    type: String,
  }],
  avatar: {
    type: String,
    default: '',
  },
}, {
  timestamps: true,
})

export default mongoose.models.User || mongoose.model('User', UserSchema) 