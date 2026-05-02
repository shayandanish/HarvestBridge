# Agro-Investment Platform

A full-stack web platform connecting investors with farmers and landowners for agricultural investments.

## 🌟 Features

- **For Investors**: Invest in individual plants and earn returns from harvest yields
- **For Farmers**: Get funding for crops and focus on farming
- **For Landowners**: Monetize land by partnering with experienced farmers
- **Secure Authentication**: JWT-based authentication with role-based access control
- **File Management**: Image upload with compression and cloud storage support
- **RESTful API**: Well-structured API with versioning and comprehensive error handling

## 🛠️ Technology Stack

### Backend

- **Runtime**: Node.js with Express.js
- **Database**: SQLite with Prisma ORM
- **Authentication**: JWT (JSON Web Tokens)
- **Security**: bcrypt, helmet, CORS, rate limiting
- **File Upload**: Multer with Sharp for image processing
- **Cloud Storage**: AWS S3 compatible (configurable)
- **Logging**: Winston
- **Testing**: Jest

### Frontend

- **Framework**: React.js 18
- **Routing**: React Router v6
- **Styling**: Tailwind CSS
- **HTTP Client**: Axios
- **State Management**: React Context API

## 📁 Project Structure

```
plant_Tree/
├── backend/
│   ├── prisma/
│   │   └── schema.prisma          # Database schema
│   ├── src/
│   │   ├── config/                # Configuration files
│   │   ├── controllers/           # Route controllers
│   │   ├── middleware/            # Custom middleware
│   │   ├── routes/                # API routes
│   │   ├── utils/                 # Utility functions
│   │   └── app.js                 # Express app setup
│   ├── tests/                     # Test files
│   ├── .env                       # Environment variables
│   └── server.js                  # Entry point
│
└── frontend/
    ├── public/
    ├── src/
    │   ├── components/            # Reusable components
    │   ├── context/               # React contexts
    │   ├── pages/                 # Page components
    │   ├── services/              # API services
    │   └── App.js                 # Main app component
    └── package.json
```

## 🚀 Getting Started

### Prerequisites

- Node.js (v16 or higher)
- PostgreSQL (v14 or higher)
- npm or yarn

### Backend Setup

1. **Navigate to backend directory**

   ```bash
   cd backend
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Configure environment variables**

   Copy `.env.example` to `.env` and update the values:

   ```bash
   cp .env.example .env
   ```

   Update the following in `.env`:
   - `DATABASE_URL`: Your PostgreSQL connection string
   - `JWT_SECRET`: A secure random string
   - `JWT_REFRESH_SECRET`: Another secure random string
   - Other configuration as needed

4. **Set up the database**

   ```bash
   # Generate Prisma Client
   npx prisma generate

   # Run migrations
   npx prisma migrate dev
   ```

5. **Start the development server**

   ```bash
   npm run dev
   ```

   The backend will run on `http://localhost:5000`

### Frontend Setup

1. **Navigate to frontend directory**

   ```bash
   cd frontend
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Configure environment variables**

   The `.env` file is already created with:

   ```
   REACT_APP_API_URL=http://localhost:5000/api/v1
   ```

4. **Start the development server**

   ```bash
   npm start
   ```

   The frontend will run on `http://localhost:3000`

## 📊 Database Schema

The platform uses the following main entities:

- **Users**: Core user accounts with roles (investor, farmer, landowner, admin)
- **User Profiles**: Extended profile information and KYC details
- **Landowners**: Landowner-specific information
- **Lands**: Land parcels with geolocation and ownership documents
- **Farmers**: Farmer profiles with experience and banking details
- **Farms**: Farm entities linking farmers to land
- **Crop Types**: Catalog of available crops
- **Plants**: Individual plant tracking with unique identifiers
- **Investments**: Investment records with fee breakdown
- **Payments**: Payment transactions and history

## 🔐 API Endpoints

### Authentication

- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login user
- `GET /api/v1/auth/me` - Get current user profile (protected)
- `PUT /api/v1/auth/profile` - Update user profile (protected)
- `PUT /api/v1/auth/change-password` - Change password (protected)

### Health Check

- `GET /health` - Server health check
- `GET /api/v1/health` - API health check

## 🧪 Testing

### Backend Tests

```bash
cd backend
npm test
```

### Run with coverage

```bash
npm test -- --coverage
```

## 🔧 Development Tools

### Prisma Studio

View and edit your database with Prisma Studio:

```bash
cd backend
npx prisma studio
```

### Database Migrations

Create a new migration:

```bash
npx prisma migrate dev --name migration_name
```

Reset database:

```bash
npx prisma migrate reset
```

## 📝 Environment Variables

### Backend (.env)

```env
NODE_ENV=development
PORT=5000
DATABASE_URL=postgresql://user:password@localhost:5432/agro_investment_db
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d
CORS_ORIGIN=http://localhost:3000
```

### Frontend (.env)

```env
REACT_APP_API_URL=http://localhost:5000/api/v1
```

## 🔒 Security Features

- Password hashing with bcrypt (10 rounds)
- JWT-based authentication
- Role-based access control (RBAC)
- Rate limiting on API endpoints
- CORS configuration
- Helmet.js for security headers
- Input validation with express-validator
- SQL injection protection via Prisma ORM

## 📦 Deployment

### Backend Deployment

1. Set `NODE_ENV=production`
2. Configure production database
3. Set secure JWT secrets
4. Configure AWS S3 for file storage
5. Set up proper CORS origins
6. Run migrations: `npx prisma migrate deploy`

### Frontend Deployment

1. Build the production bundle: `npm run build`
2. Deploy the `build` folder to your hosting service
3. Update `REACT_APP_API_URL` to production API URL

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📄 License

This project is licensed under the ISC License.

## 👥 Support

For support, email support@agroinvestment.com or open an issue in the repository.

## 🎯 Roadmap

- [ ] Payment gateway integration
- [ ] Real-time notifications
- [ ] Mobile app (React Native)
- [ ] Advanced analytics dashboard
- [ ] Multi-language support
- [ ] Automated harvest tracking
- [ ] Blockchain integration for transparency

---

Built with ❤️ for sustainable agriculture
