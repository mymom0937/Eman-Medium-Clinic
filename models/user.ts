import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    clerkId: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    role: { 
      type: String, 
      required: true, 
      enum: ['SUPER_ADMIN', 'PHARMACIST', 'CASHIER'],
      default: 'CASHIER'
    },
    isActive: { type: Boolean, default: true },
    lastLoginAt: { type: Date },
  },
  { 
    timestamps: true,
    collection: 'users' 
  }
);

// Create the User model
const User = mongoose.models.user || mongoose.model('user', userSchema);

export default User; 