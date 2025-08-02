# Eman Clinic - Digital Clinic Management System

## Overview

Eman Clinic is a comprehensive digital clinic management system built with Next.js 15, TypeScript, and TailwindCSS. The system provides complete management of patient records, drug inventory, sales, payments, medical services, and appointments.

## Features

### Core Modules

- **Authentication & Authorization**: Secure user management with role-based access control
- **Patient Records Management**: Complete patient information tracking
- **Drug Inventory Management**: Stock tracking, expiry monitoring, and low stock alerts
- **Sales Management**: Point-of-sale system with payment processing
- **Payment Management**: Multiple payment methods and transaction tracking
- **Service Management**: Medical services and appointment scheduling
- **Reporting & Analytics**: Comprehensive dashboards and reports

### User Roles

- **Super Admin (Owner)**: Full system access and management
- **Pharmacist**: Drug inventory and sales management
- **Cashier**: Sales and payment processing

## Technology Stack

- **Frontend**: Next.js 15 (App Router), TypeScript, TailwindCSS
- **Backend**: Next.js API Routes, MongoDB Atlas
- **Authentication**: Clerk (planned)
- **Database**: MongoDB Atlas
- **File Storage**: Cloudinary (planned)
- **Deployment**: Vercel (recommended)

## Project Structure

```
Eman-Clinic/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Authentication pages
│   ├── (dashboard)/       # Dashboard pages
│   ├── api/               # API routes
│   └── globals.css        # Global styles
├── components/            # React components
│   ├── common/           # Reusable components
│   ├── dashboard/        # Dashboard components
│   ├── forms/            # Form components
│   ├── layout/           # Layout components
│   ├── ui/               # UI components
│   └── ...
├── constants/            # Application constants
├── docs/                # Documentation
├── hooks/               # Custom React hooks
├── lib/                 # Utility libraries
│   ├── auth/            # Authentication utilities
│   ├── config/          # Configuration
│   ├── db/              # Database utilities
│   ├── services/        # Business logic services
│   └── utils/           # Utility functions
├── types/               # TypeScript type definitions
└── public/              # Static assets
```

## Getting Started

### Prerequisites

- Node.js 18+ 
- MongoDB Atlas account
- Clerk account (for authentication)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd Eman-Clinic
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

4. Configure your environment variables in `.env.local`

5. Run the development server:
```bash
npm run dev
```

## Environment Variables

```bash
# Database
MONGODB_URI=your_mongodb_connection_string
MONGODB_DB_NAME=eman_clinic

# Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Application
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

## API Documentation

### Authentication
- `POST /api/auth` - User login/registration
- `GET /api/auth` - Verify authentication token

### Patients
- `GET /api/patients` - Get patient list
- `POST /api/patients` - Create new patient
- `PUT /api/patients` - Update patient
- `DELETE /api/patients` - Delete patient

### Drugs
- `GET /api/drugs` - Get drug inventory
- `POST /api/drugs` - Add new drug
- `PUT /api/drugs` - Update drug
- `DELETE /api/drugs` - Delete drug

### Sales
- `GET /api/sales` - Get sales list
- `POST /api/sales` - Create new sale
- `PUT /api/sales` - Update sale
- `DELETE /api/sales` - Delete sale

### Payments
- `GET /api/payments` - Get payments list
- `POST /api/payments` - Create new payment
- `PUT /api/payments` - Update payment status

### Services
- `GET /api/services` - Get services/appointments
- `POST /api/services` - Create service/appointment
- `PUT /api/services` - Update service/appointment
- `DELETE /api/services` - Delete service/appointment

### File Upload
- `POST /api/upload` - Upload files
- `DELETE /api/upload` - Delete files

### Webhooks
- `POST /api/webhooks` - Process webhooks
- `GET /api/webhooks` - Get webhook history

## Development Guidelines

### Code Style
- Use TypeScript for type safety
- Follow ESLint and Prettier configurations
- Use meaningful component and function names
- Add JSDoc comments for complex functions

### Component Structure
- Keep components small and focused
- Use composition over inheritance
- Implement proper error boundaries
- Add loading states for async operations

### Database Design
- Use MongoDB Atlas for scalability
- Implement proper indexing for performance
- Follow MongoDB best practices
- Use transactions for critical operations

## Deployment

### Vercel (Recommended)

1. Connect your GitHub repository to Vercel
2. Configure environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Manual Deployment

1. Build the application:
```bash
npm run build
```

2. Start the production server:
```bash
npm start
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions, please contact the development team or create an issue in the repository. 