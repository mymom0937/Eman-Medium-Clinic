# API Documentation

## Base URL
```
http://localhost:3000/api
```

## Authentication

### POST /api/auth
User login and registration.

**Request Body:**
```json
{
  "action": "login" | "register",
  "email": "user@example.com",
  "password": "password",
  "firstName": "John", // required for registration
  "lastName": "Doe",   // required for registration
  "role": "SUPER_ADMIN" // required for registration; one of: SUPER_ADMIN | NURSE | LABORATORIST | PHARMACIST
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "_id": "user_id",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "SUPER_ADMIN"
    },
    "token": "demo-token-1234567890"
  }
}
```

### GET /api/auth
Verify authentication token.

**Query Parameters:**
- `token` (required): Authentication token

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "_id": "user_id",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "SUPER_ADMIN",
      "isActive": true
    }
  }
}
```

## Patients

### GET /api/patients
Get list of patients with pagination and search.

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `search` (optional): Search term for name, phone, or email
- `gender` (optional): Filter by gender

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "patient_id",
      "patientId": "PAT001",
      "firstName": "John",
      "lastName": "Doe",
      "phone": "+1234567890",
      "email": "john@example.com",
      "dateOfBirth": "1990-01-01T00:00:00.000Z",
      "gender": "Male",
      "address": "123 Main St",
      "emergencyContact": "+1234567890",
      "medicalHistory": "Hypertension",
      "allergies": ["Penicillin"],
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "pages": 10
  }
}
```

### POST /api/patients
Create a new patient.

**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+1234567890",
  "email": "john@example.com",
  "dateOfBirth": "1990-01-01",
  "gender": "Male",
  "address": "123 Main St",
  "emergencyContact": "+1234567890",
  "medicalHistory": "Hypertension",
  "allergies": ["Penicillin", "Latex"]
}
```

### PUT /api/patients
Update an existing patient.

**Request Body:**
```json
{
  "patientId": "PAT001",
  "firstName": "John",
  "lastName": "Smith",
  // ... other fields
}
```

### DELETE /api/patients
Delete a patient.

**Query Parameters:**
- `patientId` (required): Patient ID to delete

## Drugs

### GET /api/drugs
Get drug inventory with pagination and search.

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `search` (optional): Search term for name or description
- `category` (optional): Filter by category

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "drug_id",
      "drugId": "DRG001",
      "name": "Paracetamol",
      "description": "Pain reliever",
      "category": "ANALGESIC",
      "price": 5.99,
      "quantity": 100,
      "expiryDate": "2025-12-31T00:00:00.000Z",
      "manufacturer": "Pharma Corp",
      "imageUrl": "/uploads/drugs/paracetamol.jpg",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 50,
    "pages": 5
  }
}
```

### POST /api/drugs
Add a new drug to inventory.

**Request Body:**
```json
{
  "name": "Paracetamol",
  "description": "Pain reliever",
  "category": "ANALGESIC",
  "price": 5.99,
  "quantity": 100,
  "expiryDate": "2025-12-31",
  "manufacturer": "Pharma Corp",
  "imageUrl": "/uploads/drugs/paracetamol.jpg"
}
```

### PUT /api/drugs
Update drug information.

**Request Body:**
```json
{
  "drugId": "DRG001",
  "name": "Paracetamol 500mg",
  "price": 6.99,
  "quantity": 150
}
```

### DELETE /api/drugs
Delete a drug from inventory.

**Query Parameters:**
- `drugId` (required): Drug ID to delete

## Sales

### GET /api/sales
Get sales transactions with pagination and search.

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `search` (optional): Search term for sale ID or patient name
- `status` (optional): Filter by payment status
- `method` (optional): Filter by payment method

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "sale_id",
      "saleId": "SALE001",
      "patientId": "PAT001",
      "patientName": "John Doe",
      "items": [
        {
          "drugId": "DRG001",
          "drugName": "Paracetamol",
          "quantity": 2,
          "unitPrice": 5.99,
          "totalPrice": 11.98
        }
      ],
      "totalAmount": 11.98,
      "discount": 0,
      "finalAmount": 11.98,
      "paymentMethod": "CASH",
      "paymentStatus": "COMPLETED",
      "soldBy": "admin",
      "soldAt": "2024-01-01T00:00:00.000Z",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 200,
    "pages": 20
  }
}
```

### POST /api/sales
Create a new sale transaction.

**Request Body:**
```json
{
  "patientId": "PAT001",
  "patientName": "John Doe",
  "items": [
    {
      "drugId": "DRG001",
      "drugName": "Paracetamol",
      "quantity": 2,
      "unitPrice": 5.99,
      "totalPrice": 11.98
    }
  ],
  "totalAmount": 11.98,
  "discount": 0,
  "finalAmount": 11.98,
  "paymentMethod": "CASH",
  "paymentStatus": "PENDING"
}
```

### PUT /api/sales
Update sale status.

**Request Body:**
```json
{
  "saleId": "SALE001",
  "paymentStatus": "COMPLETED",
  "soldBy": "admin"
}
```

### DELETE /api/sales
Delete a sale transaction.

**Query Parameters:**
- `saleId` (required): Sale ID to delete

## Payments

### GET /api/payments
Get payment records with pagination and search.

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `search` (optional): Search term for payment ID or patient name
- `status` (optional): Filter by payment status
- `method` (optional): Filter by payment method

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "payment_id",
      "paymentId": "PAY001",
      "amount": 11.98,
      "method": "CASH",
      "status": "COMPLETED",
      "description": "Payment for sale SALE001",
      "patientId": "PAT001",
      "patientName": "John Doe",
      "reference": "INV-123456",
      "processedBy": "admin",
      "processedAt": "2024-01-01T00:00:00.000Z",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 150,
    "pages": 15
  }
}
```

### POST /api/payments
Create a new payment record.

**Request Body:**
```json
{
  "amount": 11.98,
  "method": "CASH",
  "status": "PENDING",
  "description": "Payment for sale SALE001",
  "patientId": "PAT001",
  "patientName": "John Doe",
  "reference": "INV-123456"
}
```

### PUT /api/payments
Update payment status.

**Request Body:**
```json
{
  "paymentId": "PAY001",
  "status": "COMPLETED",
  "processedBy": "admin"
}
```

## Walk-in Services

### GET /api/walk-in-services
Get walk-in service records with pagination and search.

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `search` (optional): Search term for patient name or serviceId
- `serviceType` (optional): Filter by service type
- `paymentStatus` (optional): Filter by payment status

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "walkin_id",
      "serviceId": "WIS000001",
      "patientId": "PAT001",
      "patientName": "John Doe",
      "patientPhone": "+1234567890",
      "patientAge": 35,
      "patientGender": "MALE",
      "serviceType": "INJECTION",
      "serviceDetails": {
        "injectionType": "IM",
        "injectionSite": "Deltoid",
        "notes": "No adverse reaction"
      },
      "amount": 50,
      "paymentMethod": "CASH",
      "paymentStatus": "COMPLETED",
      "paymentId": "PAY123",
      "recordedBy": "pharmacist_user_id",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "pages": 3
  }
}
```

### POST /api/walk-in-services
Create a new walk-in service record. Amount is entered manually per record (no pre-pricing).

**Request Body:**
```json
{
  "patientId": "PAT001",
  "patientName": "John Doe",
  "patientPhone": "+1234567890",
  "patientAge": 35,
  "patientGender": "MALE",
  "serviceType": "BLOOD_PRESSURE",
  "serviceDetails": {
    "bloodPressure": "120/80 mmHg"
  },
  "amount": 30,
  "paymentMethod": "CASH",
  "paymentStatus": "PENDING"
}
```

### GET /api/walk-in-services/[id]
Get a specific walk-in service record by `serviceId` or database `_id`.

### PUT /api/walk-in-services/[id]
Update a walk-in service record (e.g., details or payment status).

**Request Body:**
```json
{
  "paymentStatus": "COMPLETED",
  "amount": 30,
  "serviceDetails": {
    "notes": "Follow-up in 1 week"
  }
}
```

### DELETE /api/walk-in-services/[id]
Delete a walk-in service record.

### Role-Based Access
- Pharmacist, Super Admin: Full access
- Nurse, Laboratorist: No access

## Services

### GET /api/services
Get services or appointments based on type parameter.

**Query Parameters:**
- `type` (optional): "services" or "appointments" (default: services)
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `search` (optional): Search term
- `category` (optional): Filter by service category (for services)
- `status` (optional): Filter by appointment status (for appointments)

**Response for Services:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "service_id",
      "serviceId": "SRV001",
      "name": "General Consultation",
      "description": "Basic medical consultation",
      "category": "CONSULTATION",
      "price": 50.00,
      "duration": 30,
      "isActive": true,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "pages": 3
  }
}
```

**Response for Appointments:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "appointment_id",
      "appointmentId": "APT001",
      "serviceId": "SRV001",
      "serviceName": "General Consultation",
      "patientId": "PAT001",
      "patientName": "John Doe",
      "scheduledAt": "2024-01-15T10:00:00.000Z",
      "status": "PENDING",
      "notes": "Follow-up appointment",
      "doctorId": "DOC001",
      "doctorName": "Dr. Smith",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 30,
    "pages": 3
  }
}
```

### POST /api/services
Create a new service or appointment.

**Request Body for Service:**
```json
{
  "type": "service",
  "name": "General Consultation",
  "description": "Basic medical consultation",
  "category": "CONSULTATION",
  "price": 50.00,
  "duration": 30
}
```

**Request Body for Appointment:**
```json
{
  "type": "appointment",
  "serviceId": "SRV001",
  "serviceName": "General Consultation",
  "patientId": "PAT001",
  "patientName": "John Doe",
  "scheduledAt": "2024-01-15T10:00:00.000Z",
  "notes": "Follow-up appointment",
  "doctorId": "DOC001",
  "doctorName": "Dr. Smith"
}
```

### PUT /api/services
Update service or appointment.

**Request Body for Service:**
```json
{
  "type": "service",
  "id": "SRV001",
  "name": "General Consultation Updated",
  "price": 60.00
}
```

**Request Body for Appointment:**
```json
{
  "type": "appointment",
  "id": "APT001",
  "status": "CONFIRMED",
  "notes": "Confirmed appointment"
}
```

### DELETE /api/services
Delete a service or appointment.

**Query Parameters:**
- `type` (required): "service" or "appointment"
- `id` (required): Service ID or Appointment ID to delete

## File Upload

### POST /api/upload
Upload files (images, documents).

**Request Body (FormData):**
```
file: [File object]
type: "drug-image" | "document" | "general"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "url": "/uploads/drug-image/filename.jpg",
    "fileName": "filename.jpg",
    "originalName": "original.jpg",
    "size": 1024000,
    "type": "image/jpeg"
  }
}
```

### DELETE /api/upload
Delete uploaded files.

**Query Parameters:**
- `fileName` (required): Name of file to delete
- `type` (optional): File type category (default: general)

## Webhooks

### POST /api/webhooks
Process incoming webhooks.

**Headers:**
- `x-webhook-secret`: Webhook secret for authentication

**Request Body:**
```json
{
  "type": "payment_completed" | "inventory_low" | "appointment_reminder" | "drug_expiry",
  "source": "payment_gateway" | "inventory_system" | "scheduler",
  "data": {
    // Webhook-specific data
  }
}
```

### GET /api/webhooks
Get webhook history.

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `type` (optional): Filter by webhook type

## Error Responses

All endpoints return error responses in the following format:

```json
{
  "success": false,
  "error": "Error message description"
}
```

Common HTTP status codes:
- `400` - Bad Request (invalid input)
- `401` - Unauthorized (authentication required)
- `404` - Not Found (resource not found)
- `409` - Conflict (resource already exists)
- `500` - Internal Server Error (server error)

## Rate Limiting

API endpoints are rate-limited to prevent abuse:
- 100 requests per minute per IP address
- 1000 requests per hour per IP address

## Authentication

Most endpoints require authentication. Include the authentication token in the request headers:

```
Authorization: Bearer <token>
```

## Pagination

All list endpoints support pagination with the following parameters:
- `page`: Page number (1-based)
- `limit`: Number of items per page (max 100)

Response includes pagination metadata:
```json
{
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "pages": 10
  }
}
``` 