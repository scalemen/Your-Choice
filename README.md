# StudyGenius - The Ultimate Educational Platform

🎓 **Revolutionary AI-powered learning platform with comprehensive features for modern education**

[![Frontend Build](https://img.shields.io/badge/Frontend-✅%20Ready-green)](./src)
[![Backend Build](https://img.shields.io/badge/Backend-✅%20Ready-green)](./server)
[![Lines of Code](https://img.shields.io/badge/Lines%20of%20Code-26K+-blue)](#)
[![Features](https://img.shields.io/badge/Features-50+-purple)](#features)

## 📊 Project Statistics

- **Total Lines of Code**: 26,000+ (Backend: 24,733 + Frontend: 2,000+)
- **Backend Features**: 40+ comprehensive APIs
- **Frontend Components**: 25+ responsive React components
- **Database Tables**: 30+ with full relationships
- **AI Integrations**: OpenAI GPT-4 powered features
- **Real-time Features**: Socket.io for collaboration
- **Security**: JWT authentication, OAuth, rate limiting

## 🚀 Features Overview

### 🏫 Google Classroom Integration
- **Full Classroom Management**: Teachers can create classes, manage students
- **Assignment System**: Create, distribute, and grade assignments
- **Gradebook**: Comprehensive grading with rubrics and analytics
- **StudyGenius Integration**: Seamless connection with all platform features
- **Parent/Guardian Access**: Monitor student progress
- **Calendar Events**: Schedule classes, exams, and study sessions

### 🧠 AI-Powered Learning
- **AI Study Buddy**: Personal AI assistant with adaptive personality
- **OpenAI GPT-4 Integration**: Context-aware conversations and tutoring
- **Homework Solver**: Upload problems, get step-by-step solutions
- **Content Generation**: AI-generated flashcards, quizzes, and study plans
- **Smart Recommendations**: Personalized study suggestions
- **Learning Analytics**: AI insights into study patterns

### 📚 Advanced Flashcard System
- **Spaced Repetition**: Anki, SM-2, and FSRS algorithms
- **Rich Media Support**: Images, audio, and multimedia cards
- **Collaboration**: Share and edit decks with classmates
- **Import/Export**: Support for Anki, Quizlet, CSV, and JSON formats
- **Preloaded Content**: Curated flashcard libraries ready to use
- **Performance Analytics**: Detailed retention and progress tracking

### ✍️ Intelligent Note-Taking
- **Rich Text Editor**: Quill.js powered with formatting options
- **Handwriting Support**: Apple Pencil and stylus integration
- **Real-time Collaboration**: Google Docs-like collaborative editing
- **OCR Technology**: Convert handwriting to searchable text
- **AI Summaries**: Automatic note summarization
- **Note-to-Flashcard**: Convert notes to study cards with AI
- **Version Control**: Track changes and restore previous versions

### 📅 Smart Study Planner
- **AI-Generated Plans**: Personalized study schedules
- **Calendar Integration**: Google, Outlook, and Apple Calendar sync
- **Adaptive Scheduling**: Adjusts based on progress and performance
- **Milestone Tracking**: Break down goals into achievable steps
- **Pomodoro Integration**: Built-in focus and break timers
- **Analytics Dashboard**: Study time and efficiency metrics

### 👥 Social Learning Platform
- **Discord-Style Communication**: Voice and video calls
- **Study Groups**: Support for up to 10 million members
- **Friend System**: Add friends with Discord-like usernames
- **Real-time Messaging**: Chat with reactions and typing indicators
- **Screen Sharing**: Collaborative study sessions
- **Presence System**: Online status and activity tracking

### 🎮 Educational Gaming
- **20+ Game Categories**: Math, Science, Language, and more
- **Tournament System**: Competitive learning events
- **Achievement System**: 100+ unlockable achievements
- **Leaderboards**: Global, weekly, monthly, and class rankings
- **Multiplayer Support**: Learn together through games
- **Progress Tracking**: Detailed gaming analytics

### 🧘 Student Wellness & Support
- **Daily Wellness Checks**: Monitor stress and mental health
- **Peer Tutoring Marketplace**: Smart tutor matching system
- **Study Streak Gamification**: Multiple streak types with rewards
- **Learning Analytics Dashboard**: Comprehensive performance insights
- **Emergency Academic Support**: Instant help ticket system
- **AI Wellness Insights**: Proactive mental health monitoring

### 📊 Advanced Analytics
- **Behavioral Analysis**: Study patterns and learning insights
- **Predictive Analytics**: Early warning systems for struggling students
- **Performance Metrics**: Comprehensive academic tracking
- **Comparative Analysis**: Peer and historical comparisons
- **Custom Reports**: Detailed progress and achievement reports
- **Real-time Dashboards**: Live performance monitoring

### 🔒 Enterprise Security
- **JWT Authentication**: Secure token-based auth system
- **Google OAuth**: Single sign-on integration
- **Rate Limiting**: API protection and abuse prevention
- **Data Encryption**: Secure storage and transmission
- **Role-Based Access**: Granular permission system
- **Session Management**: Secure session handling

## 🛠️ Technology Stack

### Frontend
- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite for lightning-fast development
- **Styling**: Tailwind CSS with custom theme system
- **State Management**: Zustand for global state
- **API Calls**: React Query + Axios
- **UI Components**: Headless UI + Custom components
- **Animations**: Framer Motion
- **Real-time**: Socket.io Client

### Backend
- **Runtime**: Node.js with Express.js
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: JWT + Passport.js
- **File Upload**: Multer with Sharp for image processing
- **Real-time**: Socket.io
- **AI Integration**: OpenAI GPT-4
- **Email**: Nodemailer
- **Caching**: Redis (optional)

### Development Tools
- **Code Quality**: ESLint + Prettier
- **Type Safety**: TypeScript throughout
- **Database**: Drizzle Kit for migrations
- **Development**: Concurrently for full-stack dev
- **Monitoring**: Built-in health checks

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- PostgreSQL 14+
- Redis (optional)
- OpenAI API Key (for AI features)

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd studygenius
```

2. **Install dependencies**
```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd server
npm install
```

3. **Setup environment variables**

**Frontend (.env)**
```env
VITE_API_URL=http://localhost:5000
```

**Backend (server/.env)**
```env
# Database
DATABASE_URL=postgresql://postgres:password@localhost:5432/studygenius

# JWT Secrets
JWT_SECRET=your-super-secret-jwt-key-here
JWT_REFRESH_SECRET=your-super-secret-refresh-key-here

# OpenAI
OPENAI_API_KEY=your-openai-api-key

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Server
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:3000
```

4. **Setup database**
```bash
cd server
npm run db:push
```

5. **Seed sample data** (optional)
```bash
cd server
node scripts/seed-preloaded-content.js
```

6. **Start development servers**
```bash
# Terminal 1: Frontend
npm run dev

# Terminal 2: Backend
cd server
npm run dev
```

7. **Access the application**
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000
- Database Studio: `npm run db:studio` (in server directory)

## 📁 Project Structure

```
studygenius/
├── src/                          # Frontend React application
│   ├── components/               # Reusable UI components
│   │   ├── layouts/             # Page layouts (Auth, Dashboard)
│   │   └── ui/                  # Base UI components
│   ├── pages/                   # Page components
│   │   ├── auth/                # Authentication pages
│   │   ├── classrooms/          # Classroom management
│   │   ├── flashcards/          # Flashcard system
│   │   ├── notes/               # Note-taking interface
│   │   ├── student-assistance/  # Wellness & support features
│   │   └── ...                  # Other feature pages
│   ├── services/                # API service layer
│   ├── store/                   # Global state management
│   ├── types/                   # TypeScript type definitions
│   └── utils/                   # Utility functions
├── server/                      # Backend Node.js application
│   ├── db/                      # Database schema and connection
│   │   ├── schema.js            # Main database schema
│   │   ├── classroom-schema.js  # Classroom tables
│   │   ├── student-assistance-schema.js # Wellness features
│   │   └── ...                  # Other feature schemas
│   ├── routes/                  # API route handlers
│   │   ├── auth.js              # Authentication routes
│   │   ├── classrooms.js        # Classroom management API
│   │   ├── student-assistance.js # Wellness API
│   │   └── ...                  # Other feature APIs
│   ├── middleware/              # Express middleware
│   ├── services/                # Business logic services
│   └── scripts/                 # Database seeders and utilities
├── dist/                        # Frontend build output
└── docs/                        # Documentation
```

## 🔧 Development Commands

### Frontend Commands
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
npm run type-check   # Run TypeScript checks
```

### Backend Commands
```bash
npm run dev          # Start development server with nodemon
npm start            # Start production server
npm run db:generate  # Generate database migrations
npm run db:push      # Push schema to database
npm run db:studio    # Open Drizzle Studio
```

## 🌐 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/auth/google` - Google OAuth login
- `POST /api/auth/refresh` - Refresh JWT token
- `GET /api/auth/me` - Get current user

### Classrooms
- `GET /api/classrooms` - List user's classrooms
- `POST /api/classrooms` - Create new classroom
- `GET /api/classrooms/:id` - Get classroom details
- `POST /api/classrooms/:id/assignments` - Create assignment
- `GET /api/assignments/:id/study-suggestions` - AI study suggestions

### Student Assistance
- `GET /api/student-assistance/study-buddy` - Get AI study buddy
- `POST /api/student-assistance/wellness/daily-check` - Submit wellness check
- `GET /api/student-assistance/learning-analytics` - Get learning insights
- `GET /api/student-assistance/recommendations` - Get study recommendations

### Content Management
- `GET /api/content-management/categories` - Browse content categories
- `GET /api/content-management/flashcard-collections` - Preloaded collections
- `POST /api/content-management/import` - Import study materials
- `POST /api/content-management/export` - Export user content

### [View complete API documentation](./docs/api.md)

## 🧪 Testing

### Running Tests
```bash
# Frontend tests
npm run test

# Backend tests
cd server
npm run test

# E2E tests
npm run test:e2e
```

### Test Coverage
- Unit tests for all utility functions
- Integration tests for API endpoints
- Component tests for React components
- End-to-end tests for critical user journeys

## 🚀 Deployment

### Production Build
```bash
# Build frontend
npm run build

# The build output will be in `dist/` directory
# Serve with any static file server or CDN
```

### Environment Variables for Production
```env
# Frontend
VITE_API_URL=https://api.studygenius.com

# Backend
DATABASE_URL=postgresql://user:pass@host:5432/db
NODE_ENV=production
JWT_SECRET=your-production-jwt-secret
OPENAI_API_KEY=your-openai-key
```

### Docker Support
```bash
# Build and run with Docker
docker-compose up --build

# Production deployment
docker-compose -f docker-compose.prod.yml up -d
```

## 🤝 Contributing

### Development Workflow
1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes and add tests
4. Run the test suite: `npm test`
5. Commit your changes: `git commit -m 'Add amazing feature'`
6. Push to the branch: `git push origin feature/amazing-feature`
7. Open a Pull Request

### Code Style
- ESLint + Prettier for consistent formatting
- TypeScript for type safety
- Conventional commits for clear history
- Component-driven development
- Test-driven development encouraged

## 📚 Documentation

- [API Documentation](./docs/api.md)
- [Frontend Architecture](./docs/frontend.md)
- [Backend Architecture](./docs/backend.md)
- [Database Schema](./docs/database.md)
- [Deployment Guide](./docs/deployment.md)

## 🔐 Security

StudyGenius implements enterprise-grade security:

- **Authentication**: JWT with refresh tokens
- **Authorization**: Role-based access control
- **Data Protection**: Encryption at rest and in transit
- **API Security**: Rate limiting and input validation
- **OWASP Compliance**: Following security best practices
- **Privacy**: GDPR/CCPA compliant data handling

## 🎯 Roadmap

### Phase 1: Core Platform ✅
- [x] Authentication system
- [x] Basic flashcard functionality
- [x] Note-taking system
- [x] Google Classroom integration

### Phase 2: AI Enhancement ✅
- [x] AI Study Buddy
- [x] Content generation
- [x] Smart recommendations
- [x] Learning analytics

### Phase 3: Social Features ✅
- [x] Study groups
- [x] Real-time collaboration
- [x] Peer tutoring marketplace
- [x] Wellness monitoring

### Phase 4: Advanced Features ✅
- [x] Educational gaming
- [x] Advanced analytics
- [x] Content import/export
- [x] Mobile optimization

### Phase 5: Enterprise (Planned)
- [ ] LMS integration (Canvas, Blackboard)
- [ ] Advanced reporting for institutions
- [ ] White-label solutions
- [ ] Enterprise SSO
- [ ] Advanced analytics for administrators

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- OpenAI for GPT-4 integration
- The React and Node.js communities
- All the open-source contributors who made this possible
- Educational institutions providing feedback and requirements

## 📞 Support

- **Email**: support@studygenius.com
- **Discord**: [StudyGenius Community](https://discord.gg/studygenius)
- **Documentation**: [docs.studygenius.com](https://docs.studygenius.com)
- **Issues**: [GitHub Issues](https://github.com/studygenius/issues)

---

**StudyGenius** - Transforming education through technology 🚀

Built with ❤️ by the StudyGenius team