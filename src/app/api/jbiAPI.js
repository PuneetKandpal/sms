//=============================APIS==================================================//

export const BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "https://jbibackend-dev.up.railway.app";

// GET APIs ================================================================
export const GET_USERS_API = BASE_URL + "/api/users/";
export const GET_COMPANIES_API = BASE_URL + "/api/companies/";
export const GET_PROJECT_BY_ID_API = BASE_URL + "/api/project-details/"; //project_id=${id}
export const GET_PROJECT_OF_USER_BY_ID_API = BASE_URL + "/api/user-projects/"; //user_id=${id}
export const GET_DEFAULT_OVERVIEW_API =
  BASE_URL + "/api/get-default-overview-details/";
export const GET_COMPONENTS_API = BASE_URL + "/auth/components/";
export const GET_DOMAINS_BY_COMPONENT_API =
  BASE_URL + "/api/domains-by-component/";
export const GET_PROJECTS_BY_COMPANY_API = BASE_URL + "/api/projects/company/";
export const CHECK_STATUS_API = BASE_URL + "/api/check-status/";
export const SAVE_WEB_DATA_API = BASE_URL + "/api/save-web-data/";
export const GET_PROJECT_SOURCES_API = BASE_URL + "/api/project-sources/"; //projectId=${id}
export const GET_TOPICS_API = BASE_URL + "/topic-gen/get-topics/"; //project_id=${id}
export const GET_TOPIC_SOURCES_API = BASE_URL + "/topic-gen/get-topic-sources/"; //project_id=${id}
export const GET_KEYWORDS_INFO_API = BASE_URL + "/keyword-api/keywords-info/"; //projectId=${id}
export const GET_ARTICLES_BY_PROJECT_API =
  BASE_URL + "/article-writer/articles/by-project/"; //project_id=${id}
export const GET_OPTIMIZATION_QUESTIONS_API =
  BASE_URL + "/keyword-api/optimization-questions/"; //project_id=${id}
export const GET_PRODUCTS_SERVICES_API =
  BASE_URL + "/keyword-api/products-services/"; //project_id=${id}

// POST APIs ================================================================
export const LOGIN_API = BASE_URL + "/api/login/";
export const CREATE_PROJECT_API = BASE_URL + "/api/create-project/";
export const CREATE_COMPANY_API = BASE_URL + "/api/create-company/";
export const UPLOAD_FILE_API = BASE_URL + "/api/upload-file/";
export const UPLOAD_KEYWORD_FILE = BASE_URL + "/keyword-api/upload/file";
export const ADD_CONTEXT_API = BASE_URL + "/api/add-context/";
export const ADD_CONTEXT_API_KEYWORD =
  BASE_URL + "/keyword-api/upload/context/";
export const ADD_DOMAIN_API = BASE_URL + "/api/add-domain/";
export const ADD_COMPONENT_DOMAIN_API = BASE_URL + "/api/component-domain-add/";
export const RUN_BROWSE_API = BASE_URL + "/api/run-browseuse/";
export const RUN_COMPANY_RESEARCH_API =
  BASE_URL + "/keyword-api/run-company-research-agent/";
export const AIO_ANSWER_GENERATE_API = BASE_URL + "/aio/answer-generate/";
export const AIO_ANSWERS_API = BASE_URL + "/aio/answers/";
export const RUN_KEYWORD_EXPANSION_WORKFLOW_API =
  BASE_URL + "/keyword-api/run-keyword-expansion-workflow/";
export const ANALYZE_KEYWORD_SERP_API =
  BASE_URL + "/keyword-api/analyze-keyword-serp/";
export const UPDATE_PRIMARY_KEYWORD_API =
  BASE_URL + "/keyword-api/update-primary-keyword/";
export const CREATE_USER_SOURCE_API =
  BASE_URL + "/topic-gen/create-user-source/";
export const GENERATE_ARTICLE_API =
  BASE_URL + "/article-writer/generate-article/";
export const GENERATE_ARTICLE_FROM_CONTEXT_API =
  BASE_URL + "/article-writer/generate-from-context/";
export const CREATE_PRODUCT_KEYWORD_RELATIONSHIP_API =
  BASE_URL + "/keyword-api/create-product-keyword-relationship/";

// Social Media APIs ================================================================
export const SOCIAL_MEDIA_STRATEGY_API =
  BASE_URL + "/social-media/social-media-data/";
export const SOCIAL_MEDIA_PIPELINE_API =
  BASE_URL + "/social-media/social-media-pipeline/";
export const SOCIAL_MEDIA_POSTS_API =
  BASE_URL + "/social-media/social-media-posts/";
export const SOCIAL_MEDIA_IMAGE_GENERATION_API =
  BASE_URL + "/social-media/social-media-image-generation/";
export const SOCIAL_MEDIA_IMAGE_EDIT_API =
  BASE_URL + "/social-media/social-media-image-edit/";

// Campaign APIs ================================================================
export const CREATE_CAMPAIGN_API = BASE_URL + "/social-media/campaigns/create/";
export const GET_CAMPAIGNS_BY_PROJECT_API =
  BASE_URL + "/social-media/campaigns/list/";
export const GET_SOCIAL_POSTS_BY_DOCUMENT_API =
  BASE_URL + "/social-media/social-posts-by-document/";

// Social Connect APIs ================================================================
export const SOCIAL_CONNECT_BASE_URL = BASE_URL + "/social-connect";
export const CREATE_PROFILE_API = SOCIAL_CONNECT_BASE_URL + "/profiles/";
export const GET_PROFILES_API = SOCIAL_CONNECT_BASE_URL + "/profiles/";
export const CONNECT_ACCOUNT_API =
  SOCIAL_CONNECT_BASE_URL + "/accounts/connect/";
export const GET_ACCOUNTS_API = SOCIAL_CONNECT_BASE_URL + "/accounts/";
export const GET_ACCOUNT_DETAILS_API = SOCIAL_CONNECT_BASE_URL + "/account/";
export const GET_PROFILE_DETAILS_API = SOCIAL_CONNECT_BASE_URL + "/profile/";
export const DISCONNECT_ACCOUNT_API =
  SOCIAL_CONNECT_BASE_URL + "/accounts/disconnect/";
export const CREATE_SCHEDULED_POST_API = SOCIAL_CONNECT_BASE_URL + "/posts/";
export const GET_SCHEDULED_POSTS_API = SOCIAL_CONNECT_BASE_URL + "/posts/";
export const SCHEDULE_POST_TO_PLATFORM_API =
  SOCIAL_CONNECT_BASE_URL + "/posts/";
export const PUBLISH_POST_NOW_API = SOCIAL_CONNECT_BASE_URL + "/posts/";
export const GET_POST_STATUS_API = SOCIAL_CONNECT_BASE_URL + "/posts/";
export const UPDATE_POST_STATUS_API = SOCIAL_CONNECT_BASE_URL + "/posts/";
export const EDIT_POST_API = BASE_URL + "/social-connect/posts/";

// Social Media Scheduler APIs ================================================================
export const SOCIAL_MEDIA_SCHEDULER_BASE_URL = BASE_URL + "/social-media";
export const SCHEDULE_POST_API =
  SOCIAL_MEDIA_SCHEDULER_BASE_URL + "/social-media-scheduler/";
export const GET_SCHEDULED_POSTS_BY_PROJECT_API =
  SOCIAL_MEDIA_SCHEDULER_BASE_URL + "/social-media-scheduler/";
export const UPDATE_SCHEDULED_POST_STATUS_API =
  BASE_URL + "/social-connect/posts/";
export const BULK_UPDATE_SCHEDULED_POST_STATUS_API =
  BASE_URL + "/social-media/social-media-scheduler/bulk-update/";
export const BATCH_SCHEDULE_POSTS_API =
  BASE_URL + "/social-media/social-media-scheduler/batch/";

// Opportunity Agent APIs ================================================================
export const GET_COMPANY_RESEARCH_DATA_API =
  BASE_URL + "/opportunity-agent/company-research-data/";
export const CREATE_OPPORTUNITY_AGENT_API =
  BASE_URL + "/opportunity-agent/opportunity-agent-pipeline/";
export const GET_OPPORTUNITY_AGENTS_API =
  BASE_URL + "/opportunity-agent/agents/";
export const GET_AGENT_OPPORTUNITIES_API =
  BASE_URL + "/opportunity-agent/agent-posts-table/";
export const UPDATE_AGENT_STATUS_API = BASE_URL + "/opportunity-agent/agents/";
export const DELETE_OPPORTUNITY_AGENT_API =
  BASE_URL + "/opportunity-agent/agents/";
export const UPDATE_OPPORTUNITY_AGENT_API =
  BASE_URL + "/opportunity-agent/update-agent/";
export const GET_OPPORTUNITY_POST_DETAIL_API =
  BASE_URL + "/opportunity-agent/post-detail/"; //id=${id}&project_id=${project_id}
export const GET_AGENT_POSTS_TABLE_API =
  BASE_URL + "/opportunity-agent/agent-posts-table/"; //project_id=${project_id}&opportunity_agent_id=${agent_id}
export const FETCH_POST_COMMENTS_API =
  BASE_URL + "/opportunity-agent/fetch-post-comments/"; //project_id=${project_id}&post_id=${post_id}&depth=${depth}

// PUT & DELETE APIs ================================================================
export const UPDATE_DELETE_SOURCE_API = BASE_URL + "/api/source-update-delete/";
export const UPDATE_DELETE_PROJECT_NAME_API =
  BASE_URL + "/api/project-update-delete/";
export const UPDATE_KEYWORD_STATUS_API =
  BASE_URL + "/keyword-api/update-keyword-status/";
export const UPDATE_OPTIMIZATION_STATUS_API =
  BASE_URL + "/keyword-api/optimization-questions/status/";
export const UPDATE_AIO_ANSWER_API = BASE_URL + "/aio/answer-update/";
export const UPDATE_ARTICLE_STAGE_API =
  BASE_URL + "/article-writer/update-stage/";
export const UPDATE_TOPIC_STATUS_API = BASE_URL + "/topic-gen/update-status/";
export const DELETE_TOPIC_SOURCE_API = BASE_URL + "/topic-gen/delete-source/"; //project_id=${id}&source_id=${sourceId}
export const UPDATE_COMPANY_RESEARCH_DATA_API =
  BASE_URL + "/keyword-api/update-company-research-data/";

// Agent Notifications API ================================================================
export const GET_AGENT_NOTIFICATIONS_API =
  BASE_URL + "/agent-notifications/notifications/";
export const GET_AGENT_NOTIFICATIONS_IN_PROGRESS_API =
  BASE_URL + "/agent-notifications/notifications/in-progress/";
export const GET_AGENT_NOTIFICATIONS_COMPLETED_API =
  BASE_URL + "/agent-notifications/notifications/completed/";
