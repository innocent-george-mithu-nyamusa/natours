const crypto = require('crypto');

const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'A user must have a name'],
    unique: true,
    trim: true,
    maxlegth: [40, 'The name value must not exceed 40 values'],
    minlegth: [2, 'The name value must at least have 2 characters']
  },
  email: {
    type: String,
    required: [true, 'A User must have an email'],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, 'Please provide a valid email']
  },
  photo: { type: String, default: 'default.jpg' },
  role: {
    type: String,
    enum: ['user', 'guide', 'lead-guide', 'admin'],
    default: 'user'
  },
  password: {
    type: String,
    required: [true, 'A user must have a Password'],
    minlegth: 8,
    select: false
  },
  passwordConfirm: {
    type: String,
    required: [true, 'Please confirm your password'],
    validate: {
      validator: function(val) {
        return val === this.password;
      }
    }
  },
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpireAt: Date,
  active: {
    type: Boolean,
    default: true
  }
});

userSchema.pre('save', async function(next) {
  //Only run if password was modified
  if (!this.isModified('password')) return next();
  //encrypt the password before saving it to db
  this.password = await bcrypt.hash(this.password, 12);
  //set password confirm to udefined
  this.passwordConfirm = undefined;
  next();
});
//
userSchema.pre('save', async function(next) {
  if (!this.isModified('password') || this.isNew) return next();
  // redued time by 1 sec to accomodate for the creation
  this.passwordChangedAt = Date.now() - 1000;
  next();
});

userSchema.pre(/^find/, function(next) {
  //This is query middleware , this points to the current doc
  this.find({ active: { $ne: false } });
  next();
});

userSchema.methods.comparePasswords = async function(
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.passwordChangedAfter = function(JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTime = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
    return JWTTimestamp < changedTime;
  }

  return false;
};

userSchema.methods.createPasswordResetToken = function() {
  const resetToken = crypto.randomBytes(32).toString('hex');
  this.passwordResetToken = crypto
    .createHash('256')
    .update(resetToken)
    .digest('hex');

  this.passwordResetExpireAt = Date.now() + 10 * 60 * 1000;
  return resetToken;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
