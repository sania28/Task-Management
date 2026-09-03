import mongoose from 'mongoose';

const teamSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide a team name'],
      trim: true,
      maxlength: 200,
    },
    description: {
      type: String,
      default: '',
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    members: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        role: {
          type: String,
          enum: ['owner', 'manager', 'member'],
          default: 'member',
        },
        joinedAt: { type: Date, default: Date.now },
      },
    ],
    projects: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project',
      },
    ],
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Populate references
teamSchema.pre(/^find/, function (next) {
  if (this.options._recursive !== true) {
    this.populate({
      path: 'owner members.user projects',
      select: 'name email avatar role status',
    });
  }
  next();
});

export default mongoose.model('Team', teamSchema);
