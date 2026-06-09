import mongoose from 'mongoose'

const JobSchema = new mongoose.Schema(
  {
    company: {
      type: String,
      required: [true, 'Please provide data source'],
      maxlength: 50,
    },
    position: {
      type: String,
      required: [true, 'Please provide report title'],
      maxlength: 100,
    },
    status: {
      type: String,
      enum: ['draft', 'review', 'published'],
      default: 'draft',
    },
    jobType: {
      type: String,
      enum: ['sales', 'marketing', 'finance', 'operations'],
      default: 'sales',
    },
    jobLocation: {
      type: String,
      default: 'executive team',
      required: true,
    },
    createdBy: {
      type: mongoose.Types.ObjectId,
      ref: 'User',
      required: [true, 'Please provide user'],
    },
  },
  { timestamps: true }
)

export default mongoose.model('Job', JobSchema)