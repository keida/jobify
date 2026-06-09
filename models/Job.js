import mongoose from 'mongoose'

const JobSchema = new mongoose.Schema(
  {
    company: {
      type: String,
      required: [true, 'Please provide company'],
      maxlength: 50,
    },
    position: {
      type: String,
      required: [true, 'Please provide position'],
      maxlength: 100,
    },
    status: {
      type: String,
      enum: ['interview', 'declined', 'pending'],
      default: 'pending',
    },
    jobType: {
      type: String,
      enum: ['full-time', 'part-time', 'remote', 'internship'],
      default: 'full-time',
    },
    jobLocation: {
      type: String,
      default: 'my city',
      required: true,
    },
    createdBy: {
      type: mongoose.Types.ObjectId,
      ref: 'User',
      required: [true, 'Please provide user'],
    },
    source: {
      type: String,
      enum: ['manual', 'seek'],
      default: 'manual',
    },
    sourceUrl: {
      type: String,
      maxlength: 500,
    },
    externalId: {
      type: String,
      maxlength: 200,
    },
    salary: {
      type: String,
      maxlength: 120,
    },
    listedAt: {
      type: Date,
    },
  },
  { timestamps: true }
)

JobSchema.index(
  { createdBy: 1, source: 1, externalId: 1 },
  { unique: true, partialFilterExpression: { source: 'seek', externalId: { $exists: true } } }
);

export default mongoose.model('Job', JobSchema)
