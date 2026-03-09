import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema(
  {
    paymentId: { type: String, required: true, unique: true }, // Auto-generated unique ID
    saleId: { type: mongoose.Schema.Types.ObjectId, ref: 'sale' }, // Optional - can be standalone payment
    serviceId: { type: mongoose.Schema.Types.ObjectId, ref: 'service' }, // Optional - for service payments
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'patient' }, // Optional - for anonymous payments
    amount: { type: Number, required: true },
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
    transactionReference: { type: String },
    notes: { type: String },
    recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'user', required: true }, // User ID (Cashier)
  },
  { 
    timestamps: true,
    collection: 'payments' 
  }
);

// Force the model to be created in the eman_clinic database
let Payment;

// Check if we are using the eman_clinic database
const currentDb = mongoose.connection.db ? mongoose.connection.db.databaseName : null;
console.log(`Current database before Payment model creation: ${currentDb || 'not connected'}`);

if (mongoose.connection.readyState === 1) {
  // If we're connected but not to eman_clinic, switch to it
  if (currentDb && currentDb !== 'eman_clinic') {
    console.log(`Switching from ${currentDb} to eman_clinic database for Payment model`);
    const emanClinicDb = mongoose.connection.useDb('eman_clinic');
    Payment = emanClinicDb.models.payment || emanClinicDb.model('payment', paymentSchema);
  } else {
    // Normal case when connected to eman_clinic already
    Payment = mongoose.models.payment || mongoose.model('payment', paymentSchema);
  }
} else {
  // Not connected yet, create model normally (connection will determine database)
  Payment = mongoose.models.payment || mongoose.model('payment', paymentSchema);
}

console.log(`Payment model initialized in database: ${mongoose.connection.db ? mongoose.connection.db.databaseName : 'not connected yet'}`);
console.log("Payment model collection:", Payment.collection.name);

export default Payment; 