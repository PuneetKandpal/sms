# Feature Tracking Implementation Guide

This document outlines the comprehensive feature tracking system implemented across the application using PostHog analytics.

## Overview

The feature tracking system captures:
- Page/feature views and time spent
- User actions and interactions
- Form submissions and their outcomes
- Navigation patterns
- Error tracking for failed operations

## Architecture

### Core Components

1. **`src/lib/analytics/featureTracking.js`** - Core tracking utilities
2. **`src/hooks/useFeatureTracking.js`** - React hook for page tracking
3. **`src/components/FeatureTrackingWrapper.js`** - Reusable wrapper component

### Event Types

#### 1. `feature_viewed`
Triggered when user enters a page/section.

**Properties:**
- `feature` - Name of the feature/page
- `page_url` - Current URL path
- `page_title` - Document title
- `feature_category` - Category of the feature
- `page_section` - Specific section within the feature
- Additional metadata (project_id, etc.)

#### 2. `feature_left`
Triggered when user exits a page/section.

**Properties:**
- `feature` - Name of the feature
- `time_spent_seconds` - Time spent on the feature
- `page_url` - Current URL path

#### 3. `feature_used`
Triggered for specific user actions within features.

**Properties:**
- `feature` - Current feature name
- `action` - Specific action performed
- `action_type` - Type of action (form_submit, navigation, etc.)
- Additional action-specific metadata

## Implementation by Page

### 1. Profile Settings (`src/app/profile/page.js`)
```javascript
useFeatureTracking("Profile Settings", {
  feature_category: "user_management",
  page_section: "profile"
});
```

**Tracked Actions:**
- `profile_update_attempt/Success/Failed/Error`
- `password_change_attempt/Success/Failed/Error`
- `password_change_mismatch` (validation error)
- `password_change_weak` (validation error)

### 2. People & Teams (`src/app/people/page.js`)
```javascript
useFeatureTracking("People & Teams", {
  feature_category: "team_management",
  page_section: "people"
});
```

**Tracked Actions:**
- `member_invite_sent`
- `invitation_cancel_attempt/Success/Failed/Error`

### 3. Companies (`src/app/companies/page.js`)
```javascript
useFeatureTracking("Companies", {
  feature_category: "organization_management",
  page_section: "companies"
});
```

### 4. Social Scheduler (`src/app/social-scheduler/page.js`)
```javascript
useFeatureTracking("Social Scheduler", {
  feature_category: "content_management",
  page_section: "social_scheduler"
});
```

### 5. Create Organization (`src/app/organization/new/page.js`)
```javascript
useFeatureTracking("Create Organization", {
  feature_category: "organization_management",
  page_section: "organization_create"
});
```

**Tracked Actions:**
- `organization_create_attempt/Success/Failed/Error`

### 6. Project Overview (`src/app/components/ProjectOverviewPage.js`)
```javascript
useFeatureTracking("Project Overview", {
  feature_category: "project_management",
  page_section: "overview",
  project_id: id
});
```

**Tracked Actions:**
- `component_navigation` (when navigating to components)

### 8. Search Ranking (`src/app/projects/[id]/search-ranking/page.js`)
```javascript
useFeatureTracking("Search Ranking", {
  feature_category: "analytics",
  page_section: "search_ranking",
  project_id: id
});
```

### 9. Social Media Posts (`src/app/projects/[id]/socials/page.js`)
```javascript
useFeatureTracking("Social Media Posts", {
  feature_category: "content_creation",
  page_section: "social_media",
  project_id: projectId
});
```

**Tracked Actions:**
- `strategy_brief_generation_started/Success/Failed`
- `post_generation_started/Success/Failed`
- Campaign creation and management actions

### 10. AI Optimizations (`src/app/projects/[id]/ai-optimizations/page.js`)
```javascript
useFeatureTracking("AI Optimizations", {
  feature_category: "ai_content",
  page_section: "ai_optimizations",
  project_id: id
});
```

### 11. AIO Answers (`src/app/projects/[id]/aio-answers/page.js`)
```javascript
useFeatureTracking("AIO Answers", {
  feature_category: "ai_content",
  page_section: "aio_answers",
  project_id: projectId
});
```

### 12. Content/Articles (`src/app/projects/[id]/articles/page.js`)
```javascript
useFeatureTracking("Content", {
  feature_category: "content_management",
  page_section: "articles",
  project_id: projectId
});
```

**Tracked Actions:**
- `article_creation_started/Success/Failed`

### 13. Content Architecture (`src/app/projects/[id]/content-architecture/page.js`)
```javascript
useFeatureTracking("Content Architecture", {
  feature_category: "content_management",
  page_section: "content_architecture",
  project_id: id
});
```

### 14. Keywords (`src/app/projects/[id]/keywords/page.js`)
```javascript
useFeatureTracking("Keywords", {
  feature_category: "content_management",
  page_section: "keywords",
  project_id: id
});
```

### 15. Manage Project (`src/app/projects/[id]/manage/page.js`)
```javascript
useFeatureTracking("Manage Project", {
  feature_category: "project_management",
  page_section: "manage",
  project_id: id
});
```

### 16. Opportunities (`src/app/projects/[id]/opportunities/page.js`)
```javascript
useFeatureTracking("Opportunities", {
  feature_category: "analytics",
  page_section: "opportunities",
  project_id: id
});
```

### 17. Opportunity Agent (`src/app/projects/[id]/opportunity-agent/page.js`)
```javascript
useFeatureTracking("Opportunity Agent", {
  feature_category: "ai_content",
  page_section: "opportunity_agent",
  project_id: id
});
```

### 18. Social History (`src/app/projects/[id]/social-history/page.js`)
```javascript
useFeatureTracking("Social History", {
  feature_category: "content_management",
  page_section: "social_history",
  project_id: projectId
});
```

### 19. Topic (`src/app/projects/[id]/topic/page.js`)
```javascript
useFeatureTracking("Topic", {
  feature_category: "content_management",
  page_section: "topic",
  project_id: id
});
```

### 20. Section (`src/app/projects/[id]/section/[section]/page.js`)
```javascript
useFeatureTracking("Section", {
  feature_category: "project_management",
  page_section: "section",
  project_id: id,
  section_name: section
});
```

### 21. Create Project (`src/app/projects/new/page.js`)
```javascript
useFeatureTracking("Create Project", {
  feature_category: "project_management",
  page_section: "project_create"
});
```

**Tracked Actions:**
- `project_creation_started/Success/Failed`

### 22. Content Architecture Details (`src/app/projects/[id]/content-architecture-details/[architectId]/page.js`)
```javascript
useFeatureTracking("Content Architecture Details", {
  feature_category: "content_management",
  page_section: "content_architecture_details",
  project_id: id,
  architect_id: architectId
});
```

### 23. Opportunity Details (`src/app/projects/[id]/opportunities/[opportunityId]/page.js`)
```javascript
useFeatureTracking("Opportunity Details", {
  feature_category: "analytics",
  page_section: "opportunity_details",
  project_id: projectId,
  opportunity_id: opportunityId
});
```

## Usage Patterns

### Basic Page Tracking
```javascript
import useFeatureTracking from '../hooks/useFeatureTracking';

function MyPage() {
  useFeatureTracking("Page Name", {
    feature_category: "category",
    page_section: "section",
    additional_metadata: "value"
  });
  
  return <div>Page content</div>;
}
```

### Action Tracking
```javascript
import { trackFeatureAction } from '../lib/analytics/featureTracking';

function handleAction() {
  trackFeatureAction("action_name", {
    action_type: "type",
    metadata_key: "value"
  });
  
  // Your action logic
}
```

### Wrapper Component
```javascript
import FeatureTrackingWrapper from '../components/FeatureTrackingWrapper';

<FeatureTrackingWrapper 
  featureName="Page Name"
  metadata={{ feature_category: "category" }}
>
  <YourPageComponent />
</FeatureTrackingWrapper>
```

## Feature Categories

- `user_management` - Profile, settings, authentication
- `team_management` - People, roles, permissions
- `organization_management` - Companies, organization structure
- `project_management` - Projects, overview, settings
- `content_creation` - Social media, content generation
- `content_management` - Scheduling, publishing
- `analytics` - Search ranking, insights, reports

## Action Types

- `form_submit` - Form submission attempts
- `form_submit_success` - Successful form submissions
- `form_submit_failed` - Failed form submissions
- `form_submit_error` - Errors during form submission
- `validation_error` - Input validation failures
- `navigation` - Navigation between pages/sections
- `ai_generation` - AI-powered content generation
- `ai_generation_success` - Successful AI generation
- `ai_generation_failed` - Failed AI generation
- `invite_sent` - User invitation actions
- `cancel_invitation` - Invitation cancellation

## Data Privacy

All tracking respects user privacy:
- No PII (Personally Identifiable Information) is captured
- URLs may contain project IDs but no user identifiers
- Email addresses are only captured in invitation contexts
- All data is anonymized and aggregated in PostHog

## PostHog Dashboard Setup

### Key Insights to Create

1. **Most Used Features**
   - Event: `feature_viewed`
   - Group by: `feature`
   - Visualization: Bar chart

2. **Average Time Spent**
   - Event: `feature_left`
   - Property: `time_spent_seconds`
   - Math: Average
   - Breakdown: `feature`

3. **Feature Adoption Funnel**
   - Events: `feature_viewed` → `feature_used` → `feature_left`
   - Steps: View → Action → Exit

4. **Error Rates**
   - Events: `*_failed`, `*_error`
   - Group by: `feature`, `action_type`

5. **AI Generation Success Rate**
   - Events: `ai_generation_success` vs `ai_generation_failed`
   - Breakdown by `feature`

## Best Practices

1. **Consistent Naming**: Use snake_case for event names and properties
2. **Metadata**: Include relevant context (project_id, feature_category)
3. **Error Tracking**: Always track both success and failure states
4. **User Actions**: Track meaningful user interactions, not every click
5. **Privacy**: Never include sensitive information in tracking events

## Future Enhancements

1. **Session Recording**: Integrate PostHog session replays for UX insights
2. **Heatmaps**: Track interaction patterns on complex interfaces
3. **A/B Testing**: Track experiment variants and conversions
4. **User Segments**: Create cohorts based on feature usage patterns
5. **Custom Dashboards**: Build role-specific analytics views

## Troubleshooting

### Common Issues

1. **Events not appearing**: Check PostHog configuration and API keys
2. **Missing metadata**: Verify all required properties are included
3. **Duplicate events**: Ensure tracking is not called multiple times
4. **Performance**: Avoid tracking in rapid succession (use debouncing)

### Debug Mode

Enable PostHog debug mode to see events in console:
```javascript
posthog.debug(true);
```

## Support

For questions about the tracking implementation:
1. Check this documentation
2. Review existing implementations in the codebase
3. Test events in PostHog debug mode
4. Contact the analytics team for complex use cases
