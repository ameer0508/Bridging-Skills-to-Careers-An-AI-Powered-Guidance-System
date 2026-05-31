/**
 * Roadmap Model
 * Stores generated roadmaps for users.
 * Links a user, their current skills, target role, and the generated weekly plan.
 */

const mongoose = require('mongoose');

/**
 * Week step sub-schema
 * Represents a single week in the learning roadmap.
 */
const weekStepSchema = new mongoose.Schema(
  {
    week: {
      type: Number,
      required: true,
    },
    topic: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    resources: {
      type: [String],
      default: [],
    },
  },
  { _id: false }
);

/**
 * Main Roadmap schema
 */
const roadmapSchema = new mongoose.Schema(
  {
    // Optional link to a user profile (null for anonymous/guest requests)
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },

    targetRole: {
      type: String,
      required: [true, 'Target role is required'],
      trim: true,
    },

    currentSkills: {
      type: [String],
      default: [],
    },

    // The generated weekly roadmap steps
    steps: {
      type: [weekStepSchema],
      required: true,
    },

    // Total duration in weeks
    totalWeeks: {
      type: Number,
    },

    // Future: AI-generated flag
    // isAIGenerated: { type: Boolean, default: false },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Pre-save: auto-calculate totalWeeks
roadmapSchema.pre('save', function (next) {
  this.totalWeeks = this.steps.length;
  next();
});

const Roadmap = mongoose.model('Roadmap', roadmapSchema);

module.exports = Roadmap;
