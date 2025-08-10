import mongoose, { Schema, Document } from "mongoose";

export interface IWalkInService extends Document {
  serviceId: string;
  patientId?: string;
  patientName: string;
  patientPhone?: string;
  patientEmail?: string;
  patientAge?: number;
  patientGender?: string;
  serviceType: string;
  serviceDetails: {
    injectionType?: string;
    injectionSite?: string;
    bloodPressure?: string;
    bloodGlucose?: string;
    temperature?: string;
    weight?: string;
    height?: string;
    notes?: string;
  };
  amount: number;
  paymentMethod: string;
  paymentStatus: string;
  paymentId?: string;
  recordedBy: string;
  createdAt: Date;
  updatedAt: Date;
}

const WalkInServiceSchema = new Schema<IWalkInService>(
  {
    serviceId: {
      type: String,
      required: true,
      unique: true,
    },
    patientId: {
      type: String,
      required: false,
    },
    patientName: {
      type: String,
      required: true,
    },
    patientPhone: {
      type: String,
      required: false,
    },
    patientEmail: {
      type: String,
      required: false,
    },
    patientAge: {
      type: Number,
      required: false,
    },
    patientGender: {
      type: String,
      enum: ["MALE", "FEMALE"],
      required: false,
    },
    serviceType: {
      type: String,
      required: true,
      enum: [
        "INJECTION",
        "BLOOD_PRESSURE_CHECK",
        "DIABETES_SCREENING",
        "TEMPERATURE_CHECK",
        "WEIGHT_CHECK",
        "HEIGHT_CHECK",
        "BASIC_CONSULTATION",
        "DRESSING",
        "WOUND_CLEANING",
        "OTHER",
      ],
    },
    serviceDetails: {
      injectionType: {
        type: String,
        required: false,
      },
      injectionSite: {
        type: String,
        required: false,
      },
      bloodPressure: {
        type: String,
        required: false,
      },
      bloodGlucose: {
        type: String,
        required: false,
      },
      temperature: {
        type: String,
        required: false,
      },
      weight: {
        type: String,
        required: false,
      },
      height: {
        type: String,
        required: false,
      },
      notes: {
        type: String,
        required: false,
      },
      customServiceName: {
        type: String,
        required: false,
        trim: true,
      },
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    paymentMethod: {
      type: String,
      required: true,
      enum: ["CASH", "CARD", "MOBILE_MONEY"],
    },
    paymentStatus: {
      type: String,
      required: true,
      enum: ["COMPLETED", "PENDING", "FAILED"],
      default: "COMPLETED",
    },
    paymentId: {
      type: String,
      required: false,
    },
    recordedBy: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Create indexes for better query performance
WalkInServiceSchema.index({ patientName: 1 });
WalkInServiceSchema.index({ serviceType: 1 });
WalkInServiceSchema.index({ createdAt: -1 });

export const WalkInService =
  mongoose.models.WalkInService ||
  mongoose.model<IWalkInService>("WalkInService", WalkInServiceSchema);
