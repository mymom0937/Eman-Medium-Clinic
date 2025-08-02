import mongoose from 'mongoose';

const drugSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    genericName: { type: String },
    category: { type: String, required: true },
    description: { type: String },
    dosageForm: { type: String, required: true }, // tablet, capsule, syrup, injection, etc.
    strength: { type: String, required: true }, // 500mg, 10ml, etc.
    manufacturer: { type: String, required: true },
    batchNumber: { type: String, required: true },
    expiryDate: { type: Date, required: true },
    purchasePrice: { type: Number, required: true },
    sellingPrice: { type: Number, required: true },
    stockQuantity: { type: Number, required: true, default: 0 },
    minimumStockLevel: { type: Number, required: true, default: 10 },
    imageUrl: { type: String },
    isActive: { type: Boolean, default: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'user', required: true },
  },
  { 
    timestamps: true,
    collection: 'drugs' 
  }
);

// Force the model to be created in the eman_clinic database
let Drug;

// Check if we are using the eman_clinic database
const currentDb = mongoose.connection.db ? mongoose.connection.db.databaseName : null;
console.log(`Current database before Drug model creation: ${currentDb || 'not connected'}`);

if (mongoose.connection.readyState === 1) {
  // If we're connected but not to eman_clinic, switch to it
  if (currentDb && currentDb !== 'eman_clinic') {
    console.log(`Switching from ${currentDb} to eman_clinic database for Drug model`);
    const emanClinicDb = mongoose.connection.useDb('eman_clinic');
    Drug = emanClinicDb.models.drug || emanClinicDb.model('drug', drugSchema);
  } else {
    // Normal case when connected to eman_clinic already
    Drug = mongoose.models.drug || mongoose.model('drug', drugSchema);
  }
} else {
  // Not connected yet, create model normally (connection will determine database)
  Drug = mongoose.models.drug || mongoose.model('drug', drugSchema);
}

console.log(`Drug model initialized in database: ${mongoose.connection.db ? mongoose.connection.db.databaseName : 'not connected yet'}`);
console.log("Drug model collection:", Drug.collection.name);

export default Drug; 