# Course Content Management System

A comprehensive web application for managing database course content, built with Next.js, TypeScript, Tailwind CSS, and Firebase.

## Features

### 📚 Units Management
- Create, edit, and delete course units
- Organize content by unit numbers
- Detailed unit descriptions

### 📖 Topics Management
- Manage topics within each unit
- Order topics logically
- Link topics to specific units

### 🎥 Video Content
- Upload and manage video lessons
- Video metadata management (duration, thumbnails)
- Organize videos by topic

### 📝 Study Notes
- Create rich text study notes
- Organize notes by topics
- Comprehensive content management

### ❓ Practice Questions
- Create MCQ and essay questions
- Difficulty levels (Easy, Medium, Hard)
- Point-based scoring system
- Detailed explanations

### 📊 Dashboard
- Overview of all content statistics
- Quick action buttons
- Recent activity tracking

## Tech Stack

- **Frontend**: Next.js 16, React 19, TypeScript
- **Styling**: Tailwind CSS 4
- **Database**: Firebase Firestore
- **Icons**: Heroicons
- **Forms**: React Hook Form
- **Date Handling**: date-fns

## Setup Instructions

### Prerequisites
- Node.js 18+ installed
- Firebase project created

### 1. Clone the Repository
```bash
git clone <repository-url>
cd cource-content-manage-app
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Firebase Configuration
1. Create a Firebase project at [Firebase Console](https://console.firebase.google.com)
2. Enable Firestore Database
3. Enable Firebase Storage (for future file uploads)
4. Get your Firebase configuration object
5. Update the `.env.local` file with your Firebase credentials:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain_here
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id_here
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket_here
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id_here
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id_here
```

### 4. Firestore Security Rules
Update your Firestore security rules to allow read/write access:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true; // Update for production
    }
  }
}
```

### 5. Run the Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## Project Structure

```
app/
├── admin/
│   ├── dashboard/         # Admin dashboard
│   ├── units/            # Units management
│   ├── topics/           # Topics management
│   ├── videos/           # Videos management
│   ├── notes/            # Notes management
│   └── questions/        # Questions management
├── globals.css           # Global styles
├── layout.tsx            # Root layout
└── page.tsx              # Home page

components/
├── AdminNavbar.tsx       # Admin navigation bar
└── AdminSidebar.tsx      # Admin sidebar navigation

lib/
└── firebase.ts           # Firebase configuration

types/
└── index.ts              # TypeScript interfaces
```

## Usage

### Getting Started
1. Start by creating course units
2. Add topics to each unit
3. Upload video content for topics
4. Create study notes for topics
5. Add practice questions

### Navigation
- Access the admin dashboard at `/admin/dashboard`
- Use the sidebar to navigate between different content types
- Dashboard provides overview and quick actions

### Content Management Flow
1. **Units** → Create course units (e.g., "Introduction to Databases")
2. **Topics** → Add topics to units (e.g., "SQL Basics", "Normalization")
3. **Videos** → Upload educational videos for each topic
4. **Notes** → Create comprehensive study materials
5. **Questions** → Add practice questions for assessment

## Development

### Building for Production
```bash
npm run build
npm start
```

### Linting
```bash
npm run lint
```

## Database Collections

The application uses the following Firestore collections:

- `units` - Course units
- `topics` - Topics within units  
- `videos` - Video content
- `notes` - Study notes
- `questions` - Practice questions

## Future Enhancements

- [ ] File upload functionality
- [ ] User authentication and roles
- [ ] Student portal for viewing content
- [ ] Quiz functionality
- [ ] Progress tracking
- [ ] Rich text editor for notes
- [ ] Image upload for questions
- [ ] Export functionality
- [ ] Search and filtering
- [ ] Bulk operations

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.
