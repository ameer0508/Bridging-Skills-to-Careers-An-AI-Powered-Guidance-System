/**
 * User Model
 * Defines the schema for user profiles in the guidance system.
 * Stores personal info, education, skills, and career interests.
 */

const mongoose = require('mongoose');

/**
 * Education sub-schema
 * Represents a single educational qualification.
 */
const educationSchema = new mongoose.Schema(
  {
    institution: {
      type: String,
      trim: true,
    },
    degree: {
      type: String,
      trim: true,
    },
    fieldOfStudy: {
      type: String,
      trim: true,
    },
    startYear: {
      type: Number,
    },
    endYear: {
      type: Number,
    },
    isCurrentlyStudying: {
      type: Boolean,
      default: false,
    },
  },
  { _id: false } // No separate _id for sub-documents
);

/**
 * Main User schema
 */
const userSchema = new mongoose.Schema(
  {
    // ── Basic Info ──────────────────────────────────────────────
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },

    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        'Please provide a valid email address',
      ],
    },

    // ── Education ───────────────────────────────────────────────
    education: {
      type: [educationSchema],
      default: [],
    },

    // ── Skills ──────────────────────────────────────────────────
    skills: {
      type: [
        {
          type: String,
          trim: true,
          lowercase: true,
        },
      ],
      default: [],
      validate: {
        validator: (arr) => arr.length <= 100,
        message: 'Skills array cannot exceed 100 items',
      },
    },

    // ── Career Interests ────────────────────────────────────────
    careerInterests: {
      type: [
        {
          type: String,
          trim: true,
        },
      ],
      default: [],
      validate: {
        validator: (arr) => arr.length <= 20,
        message: 'Career interests cannot exceed 20 items',
      },
    },

    // ── Target Role ─────────────────────────────────────────────
    targetRole: {
      type: String,
      trim: true,
      default: null,
    },

    // ── Integration Hooks (for future AI modules) ───────────────
    // resumeRef: { type: String, default: null },       // Future: resume storage reference
    // skillGapAnalysis: { type: Object, default: null }, // Future: AI skill gap results
    // recommendations: { type: Array, default: [] },    // Future: AI recommendations
  },
  {
    timestamps: true, // Adds createdAt and updatedAt automatically
    versionKey: false, // Removes __v field
  }
);

// ── Indexes ────────────────────────────────────────────────────────────────────
// Note: email unique index is already defined via `unique: true` in the schema field.
// Additional indexes for query performance:
userSchema.index({ targetRole: 1 });
userSchema.index({ skills: 1 });

// ── Instance Methods ───────────────────────────────────────────────────────────

/**
 * Returns a clean public-facing representation of the user.
 * Strips internal fields if needed in the future.
 */
userSchema.methods.toPublicJSON = function () {
  const obj = this.toObject();
  return obj;
};

// ── Static Methods ─────────────────────────────────────────────────────────────

/**
 * Finds a user by email (case-insensitive due to lowercase transform).
 */
userSchema.statics.findByEmail = function (email) {
  return this.findOne({ email: email.toLowerCase().trim() });
};

const User = mongoose.model('User', userSchema);

module.exports = User;
