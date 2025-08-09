# Walk-in Services Feature

## Overview

The Walk-in Services feature allows pharmacists to handle simple medical services for walk-in patients without going through the full clinic workflow. This is designed for patients who come for basic services like injections, health checks, or consultations.

## Features

### Service Types
- **Injection Services**: Administer prescribed injections with type and site tracking
- **Blood Pressure Check**: Measure and record blood pressure readings
- **Diabetes Screening**: Test blood glucose levels
- **Temperature Check**: Measure body temperature
- **Weight Check**: Measure body weight
- **Height Check**: Measure height
- **Basic Consultation**: Provide basic health consultation and advice
- **Wound Dressing**: Apply wound dressings and bandaging
- **Wound Cleaning**: Clean and disinfect wounds
- **Other Services**: Custom services as needed

### Key Features
- **Quick Patient Registration**: Register walk-in patients with basic information
- **Service-Specific Forms**: Dynamic forms based on selected service type
- **Automatic Pricing**: Pre-configured pricing for each service type
- **Payment Integration**: Direct payment processing for services
- **Service Tracking**: Complete audit trail of all services provided
- **Statistics Dashboard**: Real-time statistics and revenue tracking

## User Roles

### Pharmacist Access
- Pharmacists can access the Walk-in Services page
- They can create, view, edit, and delete service records
- They can process payments for services
- They can view service statistics and reports

### Super Admin Access
- Super admins have full access to all walk-in service features
- They can view all service records and statistics
- They can manage service configurations

## Service Pricing

| Service Type | Price (ETB) |
|--------------|-------------|
| Injection Service | 50 |
| Blood Pressure Check | 30 |
| Diabetes Screening | 40 |
| Temperature Check | 20 |
| Weight Check | 15 |
| Height Check | 15 |
| Basic Consultation | 100 |
| Wound Dressing | 60 |
| Wound Cleaning | 45 |
| Other Service | 50 |

## Workflow

1. **Patient Arrival**: Walk-in patient arrives at the clinic
2. **Service Selection**: Pharmacist selects the appropriate service type
3. **Patient Registration**: Quick registration with basic patient information
4. **Service Details**: Record service-specific details (e.g., injection type, blood pressure reading)
5. **Payment Processing**: Process payment using available methods (Cash, Card, Mobile Money)
6. **Service Completion**: Record is saved with complete audit trail

## Integration with Existing Systems

### Payment System
- Walk-in services are integrated with the main payment system
- Services appear in payment reports and statistics
- Payment types are tracked separately for reporting

### Patient Management
- Walk-in patients can be optionally linked to existing patient records
- Patient information is stored for future reference
- Contact information is captured for follow-up if needed

## API Endpoints

### Walk-in Services API
- `GET /api/walk-in-services` - Get all walk-in services
- `POST /api/walk-in-services` - Create new walk-in service
- `GET /api/walk-in-services/[id]` - Get specific walk-in service
- `PUT /api/walk-in-services/[id]` - Update walk-in service
- `DELETE /api/walk-in-services/[id]` - Delete walk-in service

## Database Schema

### WalkInService Model
```typescript
interface WalkInService {
  serviceId: string;           // Auto-generated service ID (WIS000001)
  patientId?: string;          // Optional link to existing patient
  patientName: string;         // Patient's full name
  patientPhone?: string;       // Contact phone number
  patientEmail?: string;       // Contact email
  patientAge?: number;         // Patient age
  patientGender?: string;      // Patient gender (MALE/FEMALE)
  serviceType: string;         // Type of service provided
  serviceDetails: {            // Service-specific details
    injectionType?: string;
    injectionSite?: string;
    bloodPressure?: string;
    bloodGlucose?: string;
    temperature?: string;
    weight?: string;
    height?: string;
    notes?: string;
  };
  amount: number;              // Service cost
  paymentMethod: string;       // Payment method used
  paymentStatus: string;       // Payment status
  paymentId?: string;          // Optional payment reference
  recordedBy: string;          // Staff member who recorded the service
  createdAt: Date;            // Service creation timestamp
  updatedAt: Date;            // Last update timestamp
}
```

## Usage Instructions

### For Pharmacists

1. **Access the Walk-in Services page** from the sidebar navigation
2. **Click "New Service"** to create a new walk-in service record
3. **Fill in patient information**:
   - Patient name (required)
   - Age, gender, phone, email (optional)
4. **Select service type** from the dropdown menu
5. **Fill in service-specific details** based on the selected service
6. **Select payment method** and process payment
7. **Add any notes** or observations
8. **Click "Record Service"** to save the record

### Service-Specific Fields

#### Injection Services
- **Injection Type**: Intramuscular (IM), Subcutaneous (SC), Intravenous (IV), Intradermal (ID), Other
- **Injection Site**: Deltoid (Arm), Gluteus (Buttock), Vastus Lateralis (Thigh), Abdomen, Other

#### Health Checks
- **Blood Pressure**: Enter reading in format "120/80 mmHg"
- **Blood Glucose**: Enter level in format "120 mg/dL"
- **Temperature**: Enter in format "37.2°C"
- **Weight**: Enter in format "70 kg"
- **Height**: Enter in format "170 cm"

## Reporting and Analytics

### Statistics Dashboard
- Total services provided
- Total revenue from walk-in services
- Today's services and revenue
- Service type breakdown
- Payment method distribution

### Integration with Main Reports
- Walk-in services are included in overall clinic revenue reports
- Service statistics appear in the main dashboard
- Payment data is integrated with the payment system

## Security and Permissions

### Role-Based Access
- **Pharmacist**: Full access to walk-in services
- **Super Admin**: Full access to all features
- **Nurse**: No access (follows normal clinic workflow)
- **Laboratorist**: No access (follows normal clinic workflow)

### Data Privacy
- Patient information is stored securely
- Service records are protected by role-based permissions
- Audit trail maintains complete service history

## Future Enhancements

### Planned Features
- **Patient History**: Link walk-in services to patient medical history
- **Prescription Integration**: Link services to prescriptions from other clinics
- **Follow-up Scheduling**: Schedule follow-up appointments for walk-in patients
- **Inventory Integration**: Track supplies used for walk-in services
- **Advanced Reporting**: Detailed analytics and trend analysis

### Potential Integrations
- **Electronic Health Records**: Integration with external EHR systems
- **Insurance Processing**: Support for insurance claims for walk-in services
- **Mobile App**: Patient-facing mobile app for service booking
- **SMS Notifications**: Automated reminders for follow-up appointments

## Support and Maintenance

### Technical Support
- For technical issues, contact the development team
- Database backups are performed regularly
- System monitoring ensures service availability

### User Training
- Training materials are available for pharmacists
- Onboarding sessions can be scheduled for new staff
- Documentation is updated regularly

## Conclusion

The Walk-in Services feature provides a streamlined way for pharmacists to handle simple medical services for walk-in patients. It maintains the integrity of the clinic's workflow while providing flexibility for basic services that don't require the full clinical process.

This feature enhances the clinic's ability to serve patients efficiently while maintaining proper records and payment processing for all services provided.
