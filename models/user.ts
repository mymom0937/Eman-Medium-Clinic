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

// Force the model to be created in the eman_clinic database
let User;

// Check if we are using the eman_clinic database
const currentDb = mongoose.connection.db ? mongoose.connection.db.databaseName : null;
console.log(`Current database before User model creation: ${currentDb || 'not connected'}`);

if (mongoose.connection.readyState === 1) {
  // If we're connected but not to eman_clinic, switch to it
  if (currentDb && currentDb !== 'eman_clinic') {
    console.log(`Switching from ${currentDb} to eman_clinic database for User model`);
    const emanClinicDb = mongoose.connection.useDb('eman_clinic');
    User = emanClinicDb.models.user || emanClinicDb.model('user', userSchema);
  } else {
    // Normal case when connected to eman_clinic already
    User = mongoose.models.user || mongoose.model('user', userSchema);
  }
} else {
  // Not connected yet, create model normally (connection will determine database)
  User = mongoose.models.user || mongoose.model('user', userSchema);
}

console.log(`User model initialized in database: ${mongoose.connection.db ? mongoose.connection.db.databaseName : 'not connected yet'}`);
console.log("User model collection:", User.collection.name);

export default User; 