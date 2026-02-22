# Social Post Agent - Enhanced React Application

A comprehensive React application for generating social media posts with AI-powered insights, real API integration, and a modern UI that matches the reference design.

## 🚀 Features

- **Real API Integration**: Connected to production backend APIs for strategy brief and post generation
- **Enhanced UI/UX**: Matches reference design with improved user experience
- **Two-Step Generation Process**: 
  1. Generate Strategy Brief (company info, audience data, hooks & patterns)
  2. Generate Posts (content, visuals, quality metrics)
- **Platform Support**: LinkedIn, X (Twitter), Facebook, Instagram, TikTok, YouTube, Reddit
- **Visual Asset Generation**: AI-powered visual prompts with editing capabilities
- **Quality Metrics**: Real-time content analysis and scoring
- **Mobile Preview**: Live preview with accessibility features
- **UTM Builder**: Dynamic URL building with tracking parameters
- **Brand Compliance**: Automated brand and risk checking

## 🏗️ Architecture

### API Integration
- **Strategy Brief API**: `/social-media/social-media-data/`
- **Post Generation API**: `/social-media/social-media-pipeline/`
- **Base URL**: `https://jbibackend-production.up.railway.app`

### Component Structure
```
src/
├── app/socials/
│   └── page.js                 # Main enhanced page component
├── hooks/
│   └── useSocialPostAgent.js   # Custom hooks for API integration
├── api/
│   └── mockApi.js              # Real API functions
├── constants/
│   └── index.js                # Platform configs and constants
└── components/                 # Legacy modular components (if needed)
```

## 🛠️ Setup Instructions

1. **Install Dependencies**
   ```bash
   npm install react react-dom
   # For TailwindCSS (if not already installed)
   npm install -D tailwindcss postcss autoprefixer
   ```

2. **Environment Setup**
   The application is configured to use the production API endpoint:
   ```
   BASE_URL: https://jbibackend-production.up.railway.app
   ```

3. **TailwindCSS Configuration**
   Ensure your `tailwind.config.js` includes:
   ```js
   module.exports = {
     content: ["./src/**/*.{js,jsx,ts,tsx}"],
     theme: { extend: {} },
     plugins: [],
   }
   ```

## 📋 Usage Flow

### 1. Strategy Brief Generation
- Enter article/content URL
- Add optional instructions
- Select intent, KPI, platform, and settings
- Click "Generate Strategy Brief"
- System fetches content, analyzes company data, and generates hooks/patterns

### 2. Post Generation
- Review auto-populated audience & voice data
- Click "Generate Posts" 
- System creates multiple post variants with visuals
- Review quality metrics and mobile preview

### 3. Customization & Export
- Edit visual assets with AI prompts
- Adjust mobile preview settings
- Build UTM tracking URLs
- Export or schedule posts

## 🔧 API Request/Response Format

### Strategy Brief Request
```json
{
  "url": "https://example.com/article",
  "optional_details": "additional context",
  "destination_url": "https://landing.page",
  "intent": "Promote",
  "kpi": "Engagement",
  "allow_emoji": "Yes",
  "platform_name": "LinkedIn",
  "project_id": "project-uuid"
}
```

### Post Generation Request
```json
{
  "project_id": "project-uuid",
  "document_id": "doc-uuid",
  "article_content": "extracted content...",
  "platform_name": "LinkedIn",
  "intent": "Promote",
  "kpi": "Engagement",
  "allow_emoji": "True",
  "buyer_persona": "B2B Marketing Directors...",
  "target_market": "Enterprise SaaS companies...",
  "differentiator": "AI-powered optimization...",
  "brand_voice": "Professional yet approachable..."
}
```

## 🎨 UI/UX Improvements

- **Campaign Management**: Dropdown with existing campaigns and new campaign creation
- **Progress Tracking**: Real-time progress indicators for both generation steps
- **Visual Editing**: Click-to-edit visual assets with AI prompt interface
- **Accessibility**: Contrast ratio checking for visual overlays
- **Responsive Design**: Optimized for different screen sizes
- **Error Handling**: Comprehensive error display and recovery

## 🔌 Integration Points

### Custom Hooks
- `useStrategyBrief()`: Manages strategy brief generation and state
- `usePostGeneration()`: Handles post generation from strategy data
- `useFormState()`: Manages form data and UTM parameters

### API Functions
- `generateStrategyBrief()`: Calls strategy brief API
- `generatePosts()`: Calls post generation API with strategy context
- Error handling and response transformation included

## 🚦 Development

### Running the Application
```bash
npm start
# or for Next.js
npm run dev
```

### Testing API Integration
The application includes comprehensive error handling and loading states. Test with:
- Valid article URLs for successful generation
- Invalid URLs to test error handling
- Different platforms and settings combinations

## 📱 Mobile Preview Features

- **Platform-specific layouts**: Adapts to different social media platforms
- **Dark/light mode toggle**: Preview in different themes
- **Visual overlay customization**: Adjust background and text colors
- **Accessibility compliance**: WCAG contrast ratio checking
- **Real-time updates**: Live preview of generated content

## 🔍 Quality Metrics

The application provides real-time analysis of:
- **Hook effectiveness**: Attention-grabbing potential
- **Content clarity**: Readability and comprehension
- **Credibility**: Trust and authority indicators
- **Call-to-action strength**: Conversion potential
- **Platform optimization**: Platform-specific best practices
- **Overall quality score**: Weighted average with visual indicators

## 🛡️ Brand Compliance

Automated checking for:
- Logo usage compliance
- Brand color consistency
- Tagline accuracy
- Brand voice alignment
- Comparative claims review
- Statistical accuracy
- Medical/financial disclaimers

This enhanced version provides a production-ready social media post generation tool with real API integration and a polished user experience.