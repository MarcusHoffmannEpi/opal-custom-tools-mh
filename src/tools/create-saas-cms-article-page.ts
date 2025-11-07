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
  contentType: string;
  heading: string;
  subheading: string;
  body: string;
  author?: string;
  container?: string;
  locale?: string;
}

async function MH_create_saas_cms_article_page(parameters: CreateCmsArticlePageParameters) {
  const { container, heading, subheading, locale, body, author } = parameters;

  // Parse properties JSON string
  /*let parsedProperties: Record<string, any>;
  try {
    parsedProperties = JSON.parse(properties);
  } catch (error) {
    return {
      success: false,
      error: "Invalid JSON format for properties",
      message: "Failed to parse properties JSON. Please ensure it's valid JSON format.",
    };
  }*/

  // Initialize the Optimizely CMS client
  const client = new OptimizelyApiClient({
    clientId: process.env.OPTIMIZELY_CMS_CLIENT_ID || '',
    clientSecret: process.env.OPTIMIZELY_CMS_CLIENT_SECRET || '',
    baseUrl: process.env.OPTIMIZELY_CMS_BASE_URL || '',
  });

  // try {
  //   // Create the page with provided parameters
  //   const newPage = await client.createContent({
  //     contentType: contentType,
  //     container: container.replace(/-/g, ''), // Normalize container key (remove dashes)
  //     displayName: displayName,
  //     locale: locale,
  //     status: 'draft',
  //     properties: parsedProperties
  //   });

    try {
    // Create the page with provided parameters
    const newPage = await client.createContent({
      contentType: 'ArticlePage',
      container: 'edbb3527f7fb422fb3ae372d296a0a5a', // Normalize container key (remove dashes)
      displayName: 'Marcus displayName',
      locale: 'en',
      status: 'draft',
      properties: {
        heading: 'heading yalla',
        subheading: 'subheading yalla mannen',
        author: 'marcus author',
        body: 'This is the article body' }
    });

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
    return {
      success: false,
      error: error.message,
      message: `Failed to create CMS page: ${error.message}`,
    };
  }
}

tool({
  name: "MH-create-saas-cms_article_page",
  description: "Creates a new CMS article page in Optimizely based on a given container ID, content type, locale, and properties.",
  parameters: [
    {
      name: "container",
      type: ParameterType.String,
      description: "The container key (GUID) where the page should be created (required). Can include or exclude dashes.",
      required: true,
    },
    {
      name: "contentType",
      type: ParameterType.String,
      description: "The content type key (e.g., 'BlogPage', 'ArticlePage', 'StandardPage') (required)",
      required: true,
    },
    {
      name: "displayName",
      type: ParameterType.String,
      description: "The display name for the new page (required)",
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
      description: "JSON string containing the properties object for the page content (required). The structure depends on the content type. Example: {\"Title\": \"My Title\", \"Body\": \"Content here\"}",
      required: true,
    },
  ],
})(MH_create_saas_cms_article_page);