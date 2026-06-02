/**
 * User Model — with authentication fields
 */
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Name is required'], trim: true, minlength: 2, maxlength: 100 },
    email: { type: String, required: [true, 'Email is required'], unique: true, trim: true, lowercase: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please provide a valid email'] },
    password: { type: String, required: [true, 'Password is required'], minlength: [6, 'Password must be at least 6 characters'], select: false },
    skills: { type: [{ type: String, trim: true }], default: [] },
    careerInterests: { type: [{ type: String, trim: true }], default: [] },
    targetRole: { type: String, trim: true, default: null },
    education: { type: String, trim: true, default: null },
    resumeData: { type: Object, default: null },
    skillGapData: { type: Object, default: null },
    roadmapData: { type: Object, default: null },
    readinessScore: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true, versionKey: false }
);

// Hash password before save
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Static: find by email
userSchema.statics.findByEmail = function (email) {
  return this.findOne({ email: email.toLowerCase().trim() });
};

userSchema.index({ targetRole: 1 });
userSchema.index({ skills: 1 });

module.exports = mongoose.model('User', userSchema);
