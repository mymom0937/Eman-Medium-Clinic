import mongoose from 'mongoose';

const patientSchema = new mongoose.Schema(
  {
    patientId: { type: String, required: true, unique: true }, // Auto-generated unique ID
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    dateOfBirth: { type: Date },
    gender: { 
      type: String, 
      required: true, 
      enum: ['MALE', 'FEMALE', 'OTHER']
    },
    phoneNumber: { type: String },
    email: { type: String },
    address: { type: String },
    emergencyContact: {
      name: { type: String },
      phoneNumber: { type: String },
      relationship: { type: String }
    },
    medicalHistory: { type: String },
    allergies: [{ type: String }],
    isActive: { type: Boolean, default: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'user', required: true },
  },
  { 
    timestamps: true,
    collection: 'patients' 
  }
);

// Force the model to be created in the eman_clinic database
let Patient;

// Check if we are using the eman_clinic database
const currentDb = mongoose.connection.db ? mongoose.connection.db.databaseName : null;
console.log(`Current database before Patient model creation: ${currentDb || 'not connected'}`);

if (mongoose.connection.readyState === 1) {
  // If we're connected but not to eman_clinic, switch to it
  if (currentDb && currentDb !== 'eman_clinic') {
    console.log(`Switching from ${currentDb} to eman_clinic database for Patient model`);
    const emanClinicDb = mongoose.connection.useDb('eman_clinic');
    Patient = emanClinicDb.models.patient || emanClinicDb.model('patient', patientSchema);
  } else {
    // Normal case when connected to eman_clinic already
    Patient = mongoose.models.patient || mongoose.model('patient', patientSchema);
  }
} else {
  // Not connected yet, create model normally (connection will determine database)
  Patient = mongoose.models.patient || mongoose.model('patient', patientSchema);
}

console.log(`Patient model initialized in database: ${mongoose.connection.db ? mongoose.connection.db.databaseName : 'not connected yet'}`);
console.log("Patient model collection:", Patient.collection.name);

export default Patient; 