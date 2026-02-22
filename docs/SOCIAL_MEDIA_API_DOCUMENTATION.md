# Social Media Agent API Documentation

**Date:** February 3, 2026  
**Status:** Current State Analysis + Gap Analysis for UI Update  
**Location:** `@/Users/phil/Workspace/[02] Work/[03] Naro/[01] Jbi Frontend/[01] Code/iriscale/src/app/projects/[id]/socials`

---

## Table of Contents

1. [Currently Integrated APIs](#currently-integrated-apis)
2. [API Mapping to Current Features](#api-mapping-to-current-features)
3. [Gap Analysis for New UI](#gap-analysis-for-new-ui)
4. [Required New APIs](#required-new-apis)
5. [API Modifications Needed](#api-modifications-needed)
6. [Implementation Recommendations](#implementation-recommendations)

---

## Currently Integrated APIs

### 1. Knowledge Base Gate
**Endpoint:** `GET /keyword-api/company-research-data/exists/`  
**Used in:** `@page.js:78`  
**Purpose:** Check if company research data exists before allowing social post generation  
**Parameters:**
- `project_id` (query param)

**Response:**
```json
{
  "exists": boolean
}
```

**Status:** ✅ **Working** - Gate mechanism functional

---

### 2. Strategy Brief Generation
**Endpoint:** `POST /social-media/social-strategy-generation/`  
**Used in:** `@mockApi.js:134`, `@page.js:1142`  
**Purpose:** Generate strategy brief from source URL and campaign details  

**Request Payload:**
```json
{
  "campaign_name": string,
  "compaign_name": string,  // Note: typo in current implementation
  "task_name": string,
  "url": string,
  "destination_url": string,
  "intent": string,
  "kpi": string,
  "allow_emoji": "Yes" | "No",
  "platform_name": "LinkedIn" | "X" | "Facebook" | "Instagram" | "YouTube",
  "project_id": string
}
```

**Response:**
```json
{
  "success": boolean,
  "data": {
    "task_id": string,
    "status": string,
    "status_check_url": string,
    "queued_at": string,
    "time_taken": number,
    "project_id": string,
    "url": string,
    "campaign_name": string,
    "task_name": string
  }
}
```

**Status:** ✅ **Working** - Async task queuing functional

---

### 3. Post Generation
**Endpoint:** `POST /social-media/social-post-generation/`  
**Used in:** `@mockApi.js:211`, `@page.js:860`  
**Purpose:** Generate social posts from strategy brief  

**Request Payload:**
```json
{
  "project_id": string,
  "document_id": string
}
```

**Response:**
```json
{
  "success": boolean,
  "data": {
    "task_id": string,
    "status": string,
    "status_check_url": string,
    "queued_at": string
  } | Array<Post>
}
```

**Status:** ✅ **Working** - Async task queuing functional

---

### 4. Get Posts (Legacy)
**Endpoint:** `GET /social-media/social-media-posts/`  
**Used in:** `@mockApi.js:274`  
**Purpose:** Get posts by project and document ID  
**Parameters:**
- `project_id` (query)
- `document_id` (query)

**Response:**
```json
{
  "success": boolean,
  "data": Array<Post>
}
```

**Status:** ⚠️ **Deprecated** - Use document-specific endpoint instead

---

### 5. Get Posts by Document
**Endpoint:** `GET /social-media/social-posts-by-document/`  
**Used in:** `@mockApi.js:492`, `@page.js:450`  
**Purpose:** Fetch generated posts for a specific document  
**Parameters:**
- `document_id` (query)

**Response:**
```json
{
  "success": boolean,
  "data": Array<{
    "_id": string,
    "document_id": string,
    "post_content": string,
    "post": string,
    "image_url": string,
    "image_prompt": string,
    "utm_url": string,
    "created_at": string,
    "updated_at": string
  }>,
  "count": number
}
```

**Status:** ✅ **Working** - Primary post retrieval method

---

### 6. Get Existing Tasks/Sub-campaigns
**Endpoint:** `GET /social-media/social-media-data-by-project/`  
**Used in:** `@page.js:360`  
**Purpose:** Get all existing tasks (sub-campaigns) for a project  
**Parameters:**
- `project_id` (query)

**Response:**
```json
{
  "success": boolean,
  "data": Array<{
    "task_id": string,
    "_id": string,
    "task_name": string,
    "campaign_name": string,
    "campaign_id": string,
    "url": string,
    "source_url": string,
    "destination_url": string,
    "intent": string,
    "kpi": string,
    "platform_name": string,
    "optional_details": string,
    "allow_emoji": string,
    "is_social_post_generated": boolean | number | string,
    "document_id": string,
    "created_at": string,
    "updated_at": string
  }>
}
```

**Status:** ✅ **Working** - Returns campaign-grouped tasks

---

### 7. Image Generation
**Endpoint:** `POST /social-media/social-media-image-generation/`  
**Used in:** `@mockApi.js:294`, `@page.js:1387`  
**Purpose:** Generate image for a post  

**Request Payload:**
```json
{
  "post_id": string,
  "prompt": string
}
```

**Response:**
```json
{
  "success": boolean,
  "image_url": string,
  "data": {
    "image_url": string
  }
}
```

**Status:** ✅ **Working** - Image generation functional

---

### 8. Image Edit/Regeneration
**Endpoint:** `POST /social-media/social-media-image-edit/`  
**Used in:** `@mockApi.js:317`, `@page.js:1381`  
**Purpose:** Edit or regenerate image with new prompt  

**Request Payload:**
```json
{
  "post_id": string,
  "prompt": string
}
```

**Response:**
```json
{
  "success": boolean,
  "image_url": string,
  "data": {
    "image_url": string
  }
}
```

**Status:** ✅ **Working** - Image editing functional

---

### 9. Batch Post Scheduling
**Endpoint:** `POST /social-media/social-media-scheduler/batch/`  
**Used in:** `@page.js:958`  
**Purpose:** Schedule multiple posts at once  

**Request Payload:**
```json
{
  "posts": Array<{
    "post_id": string,
    "document_id": string,
    "project_id": string
  }>
}
```

**Response:**
```json
{
  "success": boolean,
  "summary": {
    "total": number,
    "successful": number,
    "failed": number,
    "already_scheduled": number,
    "newly_scheduled": number
  },
  "results": Array<{
    "post_id": string,
    "success": boolean,
    "already_scheduled": boolean
  }>
}
```

**Status:** ✅ **Working** - Batch scheduling functional

---

### 10. UTM Update
**Endpoint:** `PUT /social-media/social-media-utm-update/`  
**Used in:** `@page.js:1445`  
**Purpose:** Update UTM parameters for all posts in a document  

**Request Payload:**
```json
{
  "project_id": string,
  "document_id": string,
  "utm_url": string
}
```

**Response:**
```json
{
  "success": boolean,
  "message": string
}
```

**Status:** ✅ **Working** - UTM updates functional

---

### 11. Campaign List
**Endpoint:** `GET /social-media/campaigns/list/`  
**Used in:** `@mockApi.js:448`, `@page.js:1099`  
**Purpose:** Get all campaigns for a project (for autocomplete)  
**Parameters:**
- `project_id` (query)

**Response:**
```json
{
  "success": boolean,
  "data": Array<{
    "campaign_id": string,
    "campaign_name": string
  }>,
  "count": number
}
```

**Status:** ✅ **Working** - Campaign autocomplete functional

---

### 12. Campaign Creation
**Endpoint:** `POST /social-media/campaigns/create/`  
**Used in:** `@mockApi.js:469`  
**Purpose:** Create new campaign  

**Request Payload:**
```json
{
  "project_id": string,
  "campaign_name": string
}
```

**Response:**
```json
{
  "success": boolean,
  "data": {
    "campaign_id": string,
    "campaign_name": string
  }
}
```

**Status:** ⚠️ **Not Currently Used** - Available but not implemented in UI

---

## API Mapping to Current Features

### Current Workflow (3-Column Layout)

```
┌─────────────────────────────────────────────────────────────┐
│  Column 1: Input           Column 2: Strategy    Column 3   │
├─────────────────────────────────────────────────────────────┤
│  1. Check company research (/company-research-data/exists)  │
│  2. Generate strategy      (/social-strategy-generation/)   │
│  3. Generate posts         (/social-post-generation/)       │
│  4. Display posts          (/social-posts-by-document/)     │
│  5. Edit images            (/image-generation/, /image-edit)│
│  6. Schedule posts         (/scheduler/batch/)              │
│  7. Update UTM             (/utm-update/)                   │
└─────────────────────────────────────────────────────────────┘
```

**Key Issues:**
- Campaign-centric (not tag-centric)
- No post list/management view
- No status-based filtering
- No bulk operations beyond scheduling
- Two-step async process (strategy → posts)

---

## Gap Analysis for New UI

### New UI Requirements

#### Page 1: Your Posts (Home)
```
┌─────────────────────────────────────────────────────────────┐
│  + Create New Post                                          │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Filters: [All][Drafts][Ready][Published]             │  │
│  │ Tags: [q1-launch ×] [+ Add filter]                   │  │
│  │ Search: [🔍 Search posts...]                         │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  Post Cards:                                                 │
│  🟡 Draft │ Lease Management Basics                         │
│  📍 LinkedIn │ 15 posts │ Last edited 2 hours ago          │
│  Source: shukrentals.com/blog/lease-management-basics       │
│  🏷️ q1-launch  🏷️ lease-management                        │
│  [Continue Editing] [Preview] [⋯]                          │
└─────────────────────────────────────────────────────────────┘
```

**Missing APIs:**

1. **❌ Get All Post Sets by Project**
   - List all post "sets" (what we currently call sub-campaigns)
   - Filter by status (draft, ready, published)
   - Filter by tags
   - Search by name/content
   - Pagination support

2. **❌ Post Set Metadata Update**
   - Update post set name
   - Update tags
   - Update status
   - Soft delete

3. **❌ Tag Management**
   - Get all tags for a project
   - Tag autocomplete/suggestions
   - Tag usage statistics

---

#### Page 2: Create Post
```
┌─────────────────────────────────────────────────────────────┐
│  1. Content                                                 │
│     Content URL: [https://...]                              │
│     Post set name: [Auto-filled from page title]            │
│                                                             │
│  2. Platforms                                               │
│     [LinkedIn ✓] [X ✓] [Facebook ⚠️]                        │
│     ✓ Connected: LinkedIn, X                                │
│     ⚠️ Not connected: Facebook, Instagram, YouTube          │
│                                                             │
│  3. Options                                                 │
│     Intent: [Educate ▼]                                     │
│     Additional instructions: [...]                          │
│     Tags: [q1-launch ×] [lease-management ×]                │
│                                                             │
│  [🚀 Generate Posts]                                        │
└─────────────────────────────────────────────────────────────┘
```

**Missing APIs:**

4. **❌ Platform Connection Status**
   - Check which social platforms are connected
   - OAuth connection URLs
   - Connection expiry status

5. **❌ Single-Step Generation** (Modification needed)
   - Combine strategy + post generation in one async call
   - OR auto-approve strategy and continue to posts
   - Return: `document_id`, `task_id`, tracking URL

---

#### Page 3: Review & Manage
```
┌─────────────────────────────────────────────────────────────┐
│  AI Strategy Summary [▸ Expand]                             │
│  UTM Settings [▸ Expand]                                    │
│                                                              │
│  All Posts │ Select All │ 15 posts generated                │
│  ┌────────────────────────────────────────────────────┐    │
│  │ ✓ Post 1                                            │    │
│  │ In today's fast-paced rental market...             │    │
│  │                                                      │    │
│  │   Post 2                                            │    │
│  │ Curious about how technology...                     │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
│  1 post selected                                            │
│  [💾 Save Draft] [📅 Send to Scheduler] [🚀 Publish Now]  │
└─────────────────────────────────────────────────────────────┘
```

**Missing APIs:**

6. **❌ Bulk Post Actions**
   - Approve selected posts
   - Delete selected posts
   - Update status for multiple posts
   - Bulk tag assignment

7. **❌ Individual Post Update**
   - Update post content
   - Update image
   - Save as draft vs ready

8. **❌ Direct Publishing**. [ DO NOT IMPLEMENT RIGHT NOW]
   - Publish single post immediately
   - Publish multiple posts
   - Publishing status tracking

---

### Post States Management

**New State Machine:**
```
analyzing → strategy_ready → generating → draft → ready → published
           (Option B only)                    ↓
                                          scheduled
```

**Missing APIs:**

9. **❌ Post Set Status Management**
   - Get current state (analyzing/generating/etc.)
   - State transition tracking
   - Progress updates for long-running tasks

10. **❌ Polling for Status**
    - Real-time status updates
    - Task completion notifications
    - Error state handling

---

## Required New APIs

### Priority 1: Critical for Basic Flow

#### 1. List All Post Sets
```
GET /social-media/post-sets/list/
```

**Query Parameters:**
- `project_id` (required)
- `status` (optional): draft | ready | published | all
- `tags` (optional): comma-separated tags
- `search` (optional): search query
- `page` (optional): pagination
- `limit` (optional): items per page

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "post_set_id": "ps_123",
      "post_set_name": "Lease Management Basics",
      "document_id": "doc_456",
      "project_id": "proj_789",
      "status": "draft" | "ready" | "published",
      "generation_status": "analyzing" | "strategy_ready" | "generating" | "completed" | "failed",
      "platforms": ["linkedin", "x"],
      "post_count": 15,
      "tags": ["q1-launch", "lease-management"],
      "source_url": "https://shukrentals.com/blog/lease-basics",
      "created_at": "2026-01-20T10:30:00Z",
      "updated_at": "2026-01-22T14:45:00Z",
      "last_edited_by": "user_id",
      "thumbnail_url": "https://cdn.example.com/thumb.jpg"
    }
  ],
  "pagination": {
    "total": 25,
    "page": 1,
    "limit": 10,
    "pages": 3
  },
  "filters": {
    "available_tags": ["q1-launch", "lease-management", "product-launch"],
    "status_counts": {
      "draft": 5,
      "ready": 8,
      "published": 12
    }
  }
}
```

---

#### 2. Update Post Set
```
PATCH /social-media/post-sets/{post_set_id}/
```

**Request Payload:**
```json
{
  "post_set_name": "New Name",
  "tags": ["new-tag", "another-tag"],
  "status": "ready",
  "utm_url": "https://example.com?utm_source=...",
  "metadata": {
    "custom_field": "value"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "post_set_id": "ps_123",
    "updated_fields": ["post_set_name", "tags", "status"],
    "updated_at": "2026-01-22T15:00:00Z"
  }
}
```

---

#### 3. Tag Management
```
GET /social-media/tags/
```

**Query Parameters:**
- `project_id` (required)
- `search` (optional): autocomplete search

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "tag": "q1-launch",
      "usage_count": 12,
      "created_at": "2026-01-15T10:00:00Z"
    },
    {
      "tag": "lease-management",
      "usage_count": 8,
      "created_at": "2026-01-18T11:30:00Z"
    }
  ]
}
```

---

#### 4. Platform Connection Status.    [Already exists in Backend]
```
GET /social-media/connections/status/
```

**Query Parameters:**
- `project_id` (required)

**Response:**
```json
{
  "success": true,
  "data": {
    "linkedin": {
      "connected": true,
      "account_name": "Company LinkedIn",
      "expires_at": "2026-06-01T00:00:00Z",
      "oauth_url": null
    },
    "x": {
      "connected": true,
      "account_name": "@company",
      "expires_at": "2026-05-15T00:00:00Z",
      "oauth_url": null
    },
    "facebook": {
      "connected": false,
      "account_name": null,
      "expires_at": null,
      "oauth_url": "https://api.example.com/oauth/facebook"
    },
    "instagram": {
      "connected": false,
      "account_name": null,
      "expires_at": null,
      "oauth_url": "https://api.example.com/oauth/instagram"
    },
    "youtube": {
      "connected": false,
      "account_name": null,
      "expires_at": null,
      "oauth_url": "https://api.example.com/oauth/youtube"
    }
  }
}
```

---

#### 5. Single-Step Post Generation (Modified)
```
POST /social-media/generate-posts-single-step/
```

**Request Payload:**
```json
{
  "project_id": "proj_789",
  "post_set_name": "Lease Management Basics",
  "source_url": "https://example.com/article",
  "destination_url": "https://example.com/landing",
  "platforms": ["linkedin", "x"],
  "intent": "educate",
  "additional_instructions": "Focus on time-saving benefits",
  "tags": ["q1-launch", "lease-management"],
  "options": {
    "auto_approve_strategy": true,
    "utm_params": {
      "source": "linkedin",
      "medium": "social",
      "campaign": "q1-launch"
    },
    "emoji_enabled": true
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "post_set_id": "ps_new_123",
    "document_id": "doc_new_456",
    "task_id": "task_789",
    "status": "queued",
    "status_check_url": "/social-media/task-status/{task_id}/",
    "estimated_completion": "2-3 minutes",
    "queued_at": "2026-01-22T15:30:00Z"
  }
}
```

---

#### 6. Individual Post Update
```
PATCH /social-media/posts/{post_id}/
```

**Request Payload:**
```json
{
  "post_content": "Updated content...",
  "hook": "New hook",
  "pattern": "Problem → Solution → CTA",
  "image_url": "https://cdn.example.com/new-image.jpg",
  "status": "ready"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "post_id": "post_123",
    "updated_at": "2026-01-22T16:00:00Z"
  }
}
```

---

#### 7. Bulk Post Actions
```
POST /social-media/posts/bulk-action/
```

**Request Payload:**
```json
{
  "action": "approve" | "delete" | "update_status" | "add_tags",
  "post_ids": ["post_1", "post_2", "post_3"],
  "params": {
    "status": "ready",
    "tags": ["new-tag"]
  }
}
```

**Response:**
```json
{
  "success": true,
  "summary": {
    "total": 3,
    "successful": 3,
    "failed": 0
  },
  "results": [
    {
      "post_id": "post_1",
      "success": true
    }
  ]
}
```

---

#### 8. Direct Publishing
```
POST /social-media/posts/publish/
```

**Request Payload:**
```json
{
  "post_ids": ["post_1", "post_2"],
  "publish_immediately": true,
  "platforms": {
    "linkedin": {
      "account_id": "acc_123",
      "scheduled_time": null
    },
    "x": {
      "account_id": "acc_456",
      "scheduled_time": null
    }
  }
}
```

**Response:**
```json
{
  "success": true,
  "summary": {
    "total": 2,
    "published": 2,
    "failed": 0
  },
  "results": [
    {
      "post_id": "post_1",
      "platform": "linkedin",
      "published_url": "https://linkedin.com/post/xyz",
      "published_at": "2026-01-22T16:30:00Z"
    }
  ]
}
```

---

### Priority 2: Enhanced Features

#### 9. Task Status Polling
```
GET /social-media/task-status/{task_id}/
```

**Response:**
```json
{
  "success": true,
  "data": {
    "task_id": "task_789",
    "status": "analyzing" | "strategy_ready" | "generating" | "completed" | "failed",
    "progress": 65,
    "current_step": "Generating posts for LinkedIn",
    "started_at": "2026-01-22T15:30:00Z",
    "estimated_completion_at": "2026-01-22T15:33:00Z",
    "completed_at": null,
    "error": null,
    "result": null
  }
}
```

---

#### 10. Post Set Deletion
```
DELETE /social-media/post-sets/{post_set_id}/
```

**Query Parameters:**
- `hard_delete` (optional): true for permanent deletion

**Response:**
```json
{
  "success": true,
  "message": "Post set soft-deleted successfully",
  "data": {
    "post_set_id": "ps_123",
    "deleted_at": "2026-01-22T17:00:00Z"
  }
}
```

---

#### 11. Post Analytics.  [ IF POSSIBLE WILL DISCUSS FURTHER ON THIS]
```
GET /social-media/post-sets/{post_set_id}/analytics/
```

**Response:**
```json
{
  "success": true,
  "data": {
    "post_set_id": "ps_123",
    "total_posts": 15,
    "published_posts": 8,
    "platforms": {
      "linkedin": {
        "posts": 8,
        "impressions": 12500,
        "engagement_rate": 3.2
      }
    },
    "top_performing_post": {
      "post_id": "post_5",
      "impressions": 5000,
      "engagement_rate": 5.6
    }
  }
}
```

---

## API Modifications Needed

### 1. Modify `/social-media/social-media-data-by-project/`

**Current:** Returns campaign-grouped tasks  
**Needed:** Add support for tag-based filtering and post set status

**Add Query Parameters:**
- `group_by`: "campaign" | "tags" | "status"
- `include_post_counts`: boolean
- `include_tags`: boolean

---

### 2. Modify `/social-media/social-posts-by-document/`

**Current:** Returns basic post array  
**Needed:** Add post status, editing metadata

**Enhanced Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "post_123",
      "document_id": "doc_456",
      "post_content": "...",
      "status": "draft" | "ready" | "published",
      "hook": "Outdated methods holding you back",
      "pattern": "Problem → Solution → CTA",
      "platform": "linkedin",
      "character_count": 387,
      "max_characters": 700,
      "image_url": "...",
      "image_prompt": "...",
      "utm_url": "...",
      "quality_metrics": {
        "hook": 82,
        "clarity": 88
      },
      "last_edited_at": "...",
      "last_edited_by": "user_id"
    }
  ]
}
```


## Implementation Recommendations

### Phase 1: Minimum Viable Product (2-3 weeks)

**Week 1: Core APIs**
1. ✅ Keep existing APIs for backward compatibility
2. 🆕 Implement `/social-media/post-sets/list/`
3. 🆕 Implement `/social-media/post-sets/{id}/` (PATCH)
4. 🆕 Implement `/social-media/tags/`
5. 🔧 Modify `/social-posts-by-document/` to include status/metadata

**Week 2: Generation Flow**
6. 🆕 Implement `/social-media/generate-posts-single-step/`
7. 🆕 Implement `/social-media/task-status/{id}/`
8. 🆕 Implement `/social-media/posts/{id}/` (PATCH)

**Week 3: Publishing & Actions**
9. 🆕 Implement `/social-media/posts/bulk-action/`
10. 🆕 Implement `/social-media/posts/publish/`
11. 🆕 Implement `/social-media/connections/status/`

---

### Phase 2: Enhanced Features (1-2 weeks)

**Week 4:**
12. 🆕 Implement post set deletion
13. 🆕 Add analytics endpoints
14. 🆕 WebSocket support for real-time updates
15. 🔧 Performance optimization & caching

---

### Phase 3: Migration Strategy

**Approach:** Dual-mode operation
- Old UI uses existing APIs
- New UI uses new APIs
- Backend supports both for 2-3 months
- Gradual migration with feature flags

**Data Migration:**
- Convert existing "sub-campaigns" → "post sets"
- Extract tags from campaign names where possible
- Default status = "ready" for existing posts
- Preserve all document_id references

---
```sql
ALTER TABLE posts ADD COLUMN status ENUM('draft', 'ready', 'published') DEFAULT 'draft';
ALTER TABLE posts ADD COLUMN hook VARCHAR(255);
ALTER TABLE posts ADD COLUMN pattern VARCHAR(100);
ALTER TABLE posts ADD COLUMN platform VARCHAR(50);
ALTER TABLE posts ADD COLUMN character_count INT;
ALTER TABLE posts ADD COLUMN max_characters INT;
ALTER TABLE posts ADD COLUMN quality_metrics JSON;
ALTER TABLE posts ADD COLUMN last_edited_at TIMESTAMP;
ALTER TABLE posts ADD COLUMN last_edited_by VARCHAR(50);
```

---

## Testing Checklist

### API Testing

- [ ] All existing APIs continue to work (regression testing)
- [ ] New post-sets list endpoint returns correct data
- [ ] Tag filtering works correctly
- [ ] Status filtering works correctly
- [ ] Search functionality works
- [ ] Pagination works correctly
- [ ] Single-step generation creates posts successfully
- [ ] Task status updates correctly
- [ ] Individual post updates work
- [ ] Bulk actions work for multiple posts
- [ ] Publishing works for connected platforms
- [ ] Connection status reflects actual OAuth state

### Integration Testing

- [ ] Old UI continues to work with existing APIs
- [ ] New UI works with new APIs
- [ ] Data migration scripts work correctly
- [ ] WebSocket connections establish successfully
- [ ] Real-time updates are received
- [ ] Error handling works correctly
- [ ] Rate limiting works
- [ ] Authentication & authorization work

---

## API Security Considerations

1. **Authentication:** All endpoints require valid JWT token
2. **Authorization:** Project-level access control
3. **Rate Limiting:** 
   - Generation endpoints: 10 requests/hour per project
   - List endpoints: 100 requests/minute per user
4. **Input Validation:** Sanitize all user inputs (URLs, tags, content)
5. **CORS:** Configure for frontend domain only
6. **OAuth:** Secure token storage for platform connections

---

## Summary

### Currently Working ✅
- Strategy brief generation (async)
- Post generation (async)
- Image generation/editing
- Batch scheduling
- UTM management
- Campaign listing
- Company research gate

### Needs Implementation 🆕
1. **Post set listing** with filters (status, tags, search)
2. **Tag management** system
3. **Platform connection status** checking
4. **Single-step generation** (strategy + posts combined)
5. **Individual post updates** (content, status, metadata)
6. **Bulk post actions** (approve, delete, tag)
7. **Direct publishing** to connected platforms
8. **Task status polling** with progress updates

### Needs Modification 🔧
1. Enhance `/social-posts-by-document/` with metadata
2. Add tag support to `/social-media-data-by-project/`
3. Optional: WebSocket for real-time updates

### Estimated Timeline
- **Phase 1 (Core):** 2-3 weeks
- **Phase 2 (Enhanced):** 1-2 weeks
- **Phase 3 (Migration):** Ongoing parallel support

---

**Next Steps:**
1. Backend team review this document
2. Prioritize Phase 1 APIs
3. Create API specification (OpenAPI/Swagger)
4. Set up development environment
5. Begin implementation with `/post-sets/list/` endpoint
6. Frontend team can begin UI development with mock data
