import mongoose from 'mongoose';

const saleItemSchema = new mongoose.Schema({
  drugId: { type: mongoose.Schema.Types.ObjectId, ref: 'drug', required: true },
  drugName: { type: String, required: true },
  quantity: { type: Number, required: true },
  unitPrice: { type: Number, required: true },
  totalPrice: { type: Number, required: true },
  batchNumber: { type: String, required: true }
});

const saleSchema = new mongoose.Schema(
  {
    saleId: { type: String, required: true, unique: true }, // Auto-generated unique ID
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'patient' }, // Optional - can be anonymous sale
    items: [saleItemSchema],
    subtotal: { type: Number, required: true },
    taxAmount: { type: Number, required: true, default: 0 },
    discountAmount: { type: Number, required: true, default: 0 },
    totalAmount: { type: Number, required: true },
    paymentMethod: { 
      type: String, 
      required: true, 
      enum: ['CASH', 'CARD', 'MOBILE_MONEY', 'BANK_TRANSFER']
    },
    paymentStatus: { 
      type: String, 
      required: true, 
      enum: ['PENDING', 'COMPLETED', 'FAILED', 'REFUNDED'],
      default: 'PENDING'
    },
    status: { 
      type: String, 
      required: true, 
      enum: ['PENDING', 'COMPLETED', 'CANCELLED'],
      default: 'PENDING'
    },
    notes: { type: String },
    soldBy: { type: mongoose.Schema.Types.ObjectId, ref: 'user', required: true }, // User ID (Pharmacist)
    recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'user', required: true }, // User ID (Cashier)
  },
  { 
    timestamps: true,
    collection: 'sales' 
  }
);

// Force the model to be created in the eman_clinic database
let Sale;

// Check if we are using the eman_clinic database
const currentDb = mongoose.connection.db ? mongoose.connection.db.databaseName : null;
console.log(`Current database before Sale model creation: ${currentDb || 'not connected'}`);

if (mongoose.connection.readyState === 1) {
  // If we're connected but not to eman_clinic, switch to it
  if (currentDb && currentDb !== 'eman_clinic') {
    console.log(`Switching from ${currentDb} to eman_clinic database for Sale model`);
    const emanClinicDb = mongoose.connection.useDb('eman_clinic');
    Sale = emanClinicDb.models.sale || emanClinicDb.model('sale', saleSchema);
  } else {
    // Normal case when connected to eman_clinic already
    Sale = mongoose.models.sale || mongoose.model('sale', saleSchema);
  }
} else {
  // Not connected yet, create model normally (connection will determine database)
  Sale = mongoose.models.sale || mongoose.model('sale', saleSchema);
}

console.log(`Sale model initialized in database: ${mongoose.connection.db ? mongoose.connection.db.databaseName : 'not connected yet'}`);
console.log("Sale model collection:", Sale.collection.name);

export default Sale; 