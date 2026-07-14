# Development Guide

This document provides detailed instructions for setting up and building the Crawford University Staff Appraisal Management System locally.

## Prerequisites

- Node.js (v18 or higher)
- npm (v9 or higher)
- Git
- Firebase account with a project created
- Code editor (VS Code recommended)

## Project Setup

### 1. Clone/Extract the Project

```bash
cd crawford-appraisal-system
```

### 2. Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or use existing
3. Enable these services:
   - Firestore Database (production mode)
   - Firebase Authentication (Email/Password)
   - Storage
4. Go to Project Settings and copy your Web config
5. Create `.env` files in both frontend and backend folders using `.env.example` as template

### 3. Frontend Setup

```bash
cd frontend
npm install

# Create .env file with Firebase credentials
cp .env.example .env
# Edit .env with your Firebase config

# Start development server
npm start
```

Frontend will be available at `http://localhost:3000`

### 4. Backend Setup

```bash
cd ../backend
npm install

# Create .env file with Firebase admin credentials
cp .env.example .env
# Edit .env with your Firebase credentials

# Start backend server
npm start
```

Backend will be available at `http://localhost:5000`

## Project Structure

```
crawford-appraisal-system/
├── frontend/              # React application
│   ├── public/           # Static files
│   ├── src/
│   │   ├── components/   # Reusable components
│   │   ├── pages/        # Role-based page components
│   │   ├── services/     # API and Firebase calls
│   │   ├── context/      # Global state management
│   │   ├── hooks/        # Custom React hooks
│   │   ├── utils/        # Helper functions
│   │   ├── App.js        # Main component
│   │   └── index.js      # Entry point
│   ├── package.json
│   └── .env              # Environment variables
│
├── backend/              # Express.js server
│   ├── src/
│   │   ├── config/       # Firebase admin config
│   │   ├── controllers/  # Request handlers
│   │   ├── routes/       # API routes
│   │   ├── middleware/   # Express middleware
│   │   ├── models/       # Data models
│   │   ├── services/     # Business logic
│   │   ├── utils/        # Helper functions
│   │   └── server.js     # Entry point
│   ├── package.json
│   └── .env              # Environment variables
│
└── docs/                 # Project documentation
    ├── Requirements_Document_v3.docx
    ├── Project_Proposal_v2.docx
    └── Chapter_One_v3.docx
```

## Key Implementation Order

### Phase 1: Setup & Infrastructure
1. ✅ Initialize both frontend and backend
2. ✅ Setup Firebase project
3. ⚠️ **TODO:** Implement user authentication (login/signup)
4. ⚠️ **TODO:** Create role-based access control

### Phase 2: Appraisal Forms
1. ⚠️ **TODO:** Create AppraisalForm component
2. ⚠️ **TODO:** Implement 3 category-specific forms
3. ⚠️ **TODO:** Setup Firestore collections for appraisals
4. ⚠️ **TODO:** Implement draft saving and form validation

### Phase 3: Assessment Workflow ⭐ CRITICAL
1. ⚠️ **TODO:** Build HOD/HOU assessment interface
2. ⚠️ **TODO:** Implement College Board review gate for Academic Staff
3. ⚠️ **TODO:** Create conditional viewing logic based on staff category
4. ⚠️ **TODO:** Build dispute/counter-comment system
5. ⚠️ **TODO:** Implement Dean resolution interface

### Phase 4: Publications & Scoring
1. ⚠️ **TODO:** Create publication upload interface
2. ⚠️ **TODO:** Implement Firebase Storage integration
3. ⚠️ **TODO:** Build publication scoring algorithm
4. ⚠️ **TODO:** Create validation rules for publications

### Phase 5: Promotion & Eligibility
1. ⚠️ **TODO:** Implement academic staff scoring system
2. ⚠️ **TODO:** Implement non-academic experience tracking
3. ⚠️ **TODO:** Build A&PC review interface
4. ⚠️ **TODO:** Create promotion decision recording

### Phase 6: Notifications & Reporting
1. ⚠️ **TODO:** Setup notification system
2. ⚠️ **TODO:** Create deadline reminder logic
3. ⚠️ **TODO:** Build analytics dashboard
4. ⚠️ **TODO:** Implement PDF/Excel export

## Common Development Tasks

### Adding a New API Endpoint

1. Create route in `backend/src/routes/`
2. Create controller in `backend/src/controllers/`
3. Add to `backend/src/server.js`
4. Create frontend service in `frontend/src/services/`
5. Use in component with axios call

### Creating a New Page/Dashboard

1. Create folder in `frontend/src/pages/{role}/`
2. Create main component file
3. Add sub-components as needed
4. Create route in `App.js`
5. Add navigation links in layout

### Adding Firestore Collection

1. Define schema in `backend/src/models/`
2. Setup security rules in Firebase Console
3. Create CRUD functions in `backend/src/services/`
4. Create API endpoints for the service
5. Connect to frontend components

## Testing

### Frontend Testing
```bash
cd frontend
npm test
```

### Backend Testing
```bash
cd backend
npm test
```

## Deployment

### Frontend Deployment (Vercel)
```bash
cd frontend
npm run build
# Deploy via Vercel CLI or GitHub integration
```

### Backend Deployment (Render)
```bash
cd backend
# Push to GitHub
# Connect to Render and deploy
```

## Troubleshooting

### Firebase Connection Issues
- Check Firebase credentials in .env files
- Verify Firestore security rules allow read/write
- Check network connectivity

### CORS Errors
- Ensure FRONTEND_URL in backend .env matches frontend URL
- Check CORS middleware configuration in server.js

### Build Errors
- Delete `node_modules` and `package-lock.json`
- Run `npm install` again
- Clear npm cache: `npm cache clean --force`

## Git Workflow

```bash
# Create feature branch
git checkout -b feature/your-feature-name

# Make changes and commit
git add .
git commit -m "Clear description of changes"

# Push to remote
git push origin feature/your-feature-name

# Create pull request
```

## Environment Variables Reference

### Frontend (.env)
```
REACT_APP_FIREBASE_API_KEY=
REACT_APP_FIREBASE_AUTH_DOMAIN=
REACT_APP_FIREBASE_PROJECT_ID=
REACT_APP_FIREBASE_STORAGE_BUCKET=
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=
REACT_APP_FIREBASE_APP_ID=
REACT_APP_BACKEND_URL=http://localhost:5000
REACT_APP_ENV=development
```

### Backend (.env)
```
FIREBASE_PROJECT_ID=
FIREBASE_PRIVATE_KEY=
FIREBASE_CLIENT_EMAIL=
NODE_ENV=development
PORT=5000
JWT_SECRET=
EMAIL_USER=
EMAIL_PASSWORD=
FRONTEND_URL=http://localhost:3000
API_BASE_URL=http://localhost:5000
```

## Resources

- [React Documentation](https://react.dev)
- [Express.js Documentation](https://expressjs.com)
- [Firebase Documentation](https://firebase.google.com/docs)
- [Firestore Documentation](https://firebase.google.com/docs/firestore)
- [Vercel Deployment](https://vercel.com/docs)
- [Render Deployment](https://render.com/docs)

---

Happy coding! 🚀
