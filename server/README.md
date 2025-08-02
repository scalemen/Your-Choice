# StudyGenius Backend Server

## 🚀 Overview

StudyGenius is a comprehensive educational platform backend built with Node.js, Express, and PostgreSQL. It provides a robust API for managing notes, flashcards, study plans, quizzes, social features, and professional development tools.

## ✨ Features

### 🎓 Core Educational Features
- **Smart Note-Taking**: Rich text notes with handwriting support and AI summaries
- **Adaptive Flashcards**: Spaced repetition system with ML-powered difficulty adjustment
- **Study Planning**: AI-generated study plans with progress tracking
- **Quiz System**: Adaptive quizzes with detailed analytics
- **Homework Solver**: AI-powered problem solving assistance

### 🤝 Social & Collaboration
- **Study Groups**: Create and join study groups with real-time collaboration
- **Friend System**: Connect with other learners
- **Discord-style Chat**: Real-time messaging and voice channels
- **Study Sessions**: Collaborative study sessions with screen sharing

### 🎮 Gamification
- **Educational Games**: Interactive learning games with achievements
- **Leaderboards**: Compete with friends and global users
- **Achievement System**: Unlock badges and rewards for progress
- **Study Streaks**: Maintain learning momentum with streak tracking

### 👨‍💼 Professional Development
- **Skills Assessment**: Comprehensive skill testing and certification
- **Mentorship Platform**: Connect with industry mentors
- **Career Pathways**: Guided professional development routes
- **Real-world Projects**: Hands-on learning with industry partners

### 🤖 AI & Machine Learning
- **AI Tutor**: Personalized learning assistant
- **Content Generation**: Auto-generate quizzes and study materials
- **Learning Analytics**: ML-powered insights and recommendations
- **Adaptive Learning**: Personalized difficulty and content recommendations

### 🏫 Classroom Management
- **Google Classroom Integration**: Full LMS functionality
- **Assignment Management**: Create, distribute, and grade assignments
- **Gradebook**: Comprehensive grade tracking and analytics
- **Parent/Guardian Portal**: Family engagement tools

## 🛠️ Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: PostgreSQL with Drizzle ORM
- **Real-time**: Socket.io
- **Authentication**: Passport.js (Local + Google OAuth)
- **AI**: OpenAI GPT-4
- **File Storage**: Multer + Sharp for image processing
- **Email**: Nodemailer
- **Caching**: Redis (optional)

## 📦 Installation

### Prerequisites
- Node.js 18+ 
- PostgreSQL 14+
- Redis (optional, for caching)

### Quick Start

1. **Clone and setup**
   ```bash
   cd server
   npm install
   ```

2. **Environment Configuration**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Database Setup** (optional)
   ```bash
   # Create database
   createdb studygenius
   
   # Run migrations
   npm run db:migrate
   ```

4. **Start Development Server**
   ```bash
   npm run dev
   ```

The server will start on `http://localhost:5000` and can run in offline mode without database connection.

## 📚 API Documentation

### Core Endpoints

#### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/logout` - User logout
- `GET /api/auth/google` - Google OAuth

#### Notes & Content
- `GET /api/notes` - Get user notes
- `POST /api/notes` - Create new note
- `PUT /api/notes/:id` - Update note
- `DELETE /api/notes/:id` - Delete note

#### Flashcards
- `GET /api/flashcards` - Get flashcard decks
- `POST /api/flashcards` - Create deck
- `GET /api/flashcards/:id/study` - Start study session

#### Study Planning
- `GET /api/study-plans` - Get study plans
- `POST /api/study-plans/generate` - AI-generate study plan
- `POST /api/study-plans/:id/sessions` - Log study session

#### Professional Features
- `GET /api/professional/skills` - Get skill categories
- `POST /api/professional/assessments` - Take skill assessment
- `GET /api/professional/mentors` - Find mentors
- `POST /api/professional/mentorship-sessions` - Book session

#### Social Features
- `GET /api/social/friends` - Get friends list
- `POST /api/social/friend-requests` - Send friend request
- `GET /api/social/study-groups` - Get study groups

## 🗄️ Database Schema

The application uses a comprehensive PostgreSQL schema with 50+ tables:

- **Core Tables**: `users`, `notes`, `folders`, `flashcards`
- **Study System**: `study_plans`, `study_sessions`, `quizzes`
- **Social**: `friendships`, `study_groups`, `chat_messages`
- **Professional**: `skills`, `mentors`, `career_paths`
- **Gamification**: `achievements`, `leaderboards`, `game_scores`

## 🔧 Development

### Available Scripts

- `npm run dev` - Start development server with auto-restart
- `npm run start` - Start production server  
- `npm run dev:watch` - Start with file watching (nodemon)
- `npm run db:migrate` - Run database migrations
- `npm run db:push` - Push schema changes to database
- `npm run db:studio` - Open Drizzle Studio for database management

### Environment Variables

Key environment variables (see `.env.example` for complete list):

```bash
# Essential
DATABASE_URL=postgresql://user:pass@localhost:5432/studygenius
JWT_SECRET=your-secret-key
OPENAI_API_KEY=your-openai-key

# Optional
GOOGLE_CLIENT_ID=oauth-client-id
SMTP_HOST=smtp.gmail.com
REDIS_URL=redis://localhost:6379
```

### Project Structure

```
server/
├── db/                     # Database schemas and connection
│   ├── schema.js          # Main database schema
│   ├── enhanced-*.js      # Feature-specific schemas
│   └── index.js           # Database connection
├── routes/                # API route handlers
│   ├── auth.js           # Authentication routes
│   ├── notes.js          # Notes management
│   ├── professional-features.js # Professional development
│   └── ...
├── middleware/            # Express middleware
│   ├── auth.js           # Authentication middleware
│   ├── upload.js         # File upload handling
│   └── errorHandler.js   # Error handling
├── services/              # Business logic services
├── scripts/               # Utility scripts
└── index.js              # Main server entry point
```

## 🚀 Deployment

### Production Setup

1. **Environment Setup**
   ```bash
   NODE_ENV=production
   DATABASE_URL=your-production-db-url
   ```

2. **Database Migration**
   ```bash
   npm run db:push
   ```

3. **Start Server**
   ```bash
   npm start
   ```

### Health Checks

- `GET /health` - Server health status
- Database connection status included in server logs

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Write tests for new features
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For issues and questions:
- Create an issue in the repository
- Check the troubleshooting section below

## 🔧 Troubleshooting

### Common Issues

1. **Database Connection Failed**
   - Server runs in offline mode without database
   - Check DATABASE_URL in .env
   - Ensure PostgreSQL is running

2. **OpenAI API Errors**
   - AI features disabled without API key
   - Set OPENAI_API_KEY in .env

3. **File Upload Issues**
   - Check UPLOAD_DIR permissions
   - Verify MAX_FILE_SIZE setting

### Debug Mode

Enable detailed logging:
```bash
DEBUG=true npm run dev
```

---

**StudyGenius Backend** - Empowering education through technology 🎓✨