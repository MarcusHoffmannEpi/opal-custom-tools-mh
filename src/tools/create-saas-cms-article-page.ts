import { tool, ParameterType } from "@optimizely-opal/opal-tools-sdk";
import { OptimizelyApiClient } from "../utils/optimizely-cms-client";
import { generatePreviewUrl, constructPageUrl } from "../utils/preview-url";

interface CreateCmsPageParameters {
  container: string;
  contentType: string;
  displayName: string;
  locale: string;
  properties: string;
}

interface CreateCmsArticlePageParameters {
  container: string;
  displayName: string;
  locale: string;
  properties: string;
}

async function MH_create_saas_cms_article_page(parameters: CreateCmsArticlePageParameters) {
  console.log('🔍 Tool called with parameters:', JSON.stringify(parameters, null, 2));

  const { container, displayName, locale, properties } = parameters;
  const contentType = 'ArticlePage'; // Hardcoded for article pages

  // Parse properties JSON string
  let parsedProperties: Record<string, any>;
  try {
    parsedProperties = JSON.parse(properties);
  } catch (error) {
    return {
      success: false,
      error: "Invalid JSON format for properties",
      message: "Failed to parse properties JSON. Please ensure it's valid JSON format.",
    };
  }

  // Initialize the Optimizely CMS client
  const client = new OptimizelyApiClient({
    clientId: process.env.OPTIMIZELY_CMS_CLIENT_ID || '',
    clientSecret: process.env.OPTIMIZELY_CMS_CLIENT_SECRET || '',
    baseUrl: process.env.OPTIMIZELY_CMS_BASE_URL || '',
  });

  console.log('🔧 Client config:', {
    clientId: process.env.OPTIMIZELY_CMS_CLIENT_ID,
    baseUrl: process.env.OPTIMIZELY_CMS_BASE_URL,
    hasSecret: !!process.env.OPTIMIZELY_CMS_CLIENT_SECRET
  });

  try {
    // Add required SeoSettings if not provided
    if (!parsedProperties.SeoSettings) {
      parsedProperties.SeoSettings = {
        GraphType: 'article'
      };
    }

    const contentData = {
      contentType: contentType,
      container: container.replace(/-/g, ''), // Normalize container key (remove dashes)
      displayName: displayName,
      locale: locale,
      status: 'draft' as 'draft' | 'published',
      properties: parsedProperties
    };

    console.log('📤 Creating content with data:', JSON.stringify(contentData, null, 2));

    const newPage = await client.createContent(contentData);

    // Generate preview URL
    const pageUrl = constructPageUrl(newPage.contentType!, newPage.routeSegment!);
    const previewData = await generatePreviewUrl(
      newPage.key!,
      newPage.version!,
      pageUrl
    );

    return {
      success: true,
      contentKey: newPage.key,
      displayName: newPage.displayName,
      contentType: newPage.contentType,
      status: newPage.status,
      version: newPage.version,
      locale: newPage.locale,
      container: newPage.container,
      routeSegment: newPage.routeSegment,
      lastModified: newPage.lastModified,
      previewUrl: previewData?.previewUrl || null,
      previewToken: previewData?.token || null,
      message: `Successfully created ${newPage.contentType} page: "${newPage.displayName}" in locale ${newPage.locale}${previewData ? ' with preview URL' : ''}`,
      properties: newPage.properties,
    };
  } catch (error: any) {
    console.error('❌ Error creating page:', error);
    console.error('❌ Error stack:', error.stack);
    console.error('❌ Full error object:', JSON.stringify(error, null, 2));

    return {
      success: false,
      error: error.message,
      errorDetails: error.response?.data || error.toString(),
      statusCode: error.response?.status,
      message: `Failed to create CMS page: ${error.message}`,
    };
  }
}

tool({
  name: "MH-create-saas-cms-article-page",
  description: "Creates a new ArticlePage in Optimizely CMS. Automatically sets contentType to 'ArticlePage' and adds SEO settings with GraphType 'article'. Use this for creating article pages specifically.",
  parameters: [
    {
      name: "container",
      type: ParameterType.String,
      description: "The container key (GUID) where the page should be created (required). Can include or exclude dashes.",
      required: true,
    },
    {
      name: "displayName",
      type: ParameterType.String,
      description: "The display name for the new article page (required)",
      required: true,
    },
    {
      name: "locale",
      type: ParameterType.String,
      description: "The locale/language code (e.g., 'en', 'sv', 'fr') (required)",
      required: true,
    },
    {
      name: "properties",
      type: ParameterType.String,
      description: "JSON string containing the properties object for the article page content (required). Example: {\"HeroHeadline\": \"My Title\", \"HeroSubheadline\": \"Subtitle\"}",
      required: true,
    },
  ],
})(MH_create_saas_cms_article_page);