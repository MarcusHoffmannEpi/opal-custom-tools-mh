import { tool, ParameterType } from "@optimizely-opal/opal-tools-sdk";
import { OptimizelyApiClient } from "../utils/optimizely-cms-client";

interface UpdateCmsPageParameters {
  contentKey: string;
  version: string;
  updates: string;
  locale?: string;
}

async function MH_update_saas_cms_page(parameters: UpdateCmsPageParameters) {
  console.log('🔍 Update page tool called with parameters:', JSON.stringify(parameters, null, 2));

  const { contentKey, version, updates, locale } = parameters;

  // Parse updates JSON string
  let parsedUpdates: Record<string, any>;
  try {
    parsedUpdates = JSON.parse(updates);
  } catch (error) {
    return {
      success: false,
      error: "Invalid JSON format for updates",
      message: "Failed to parse updates JSON. Please ensure it's valid JSON format.",
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
    console.log('📝 Updating content in CMS...');
    console.log('📝 Content Key:', contentKey);
    console.log('📝 Version:', version);
    console.log('📝 Updates:', JSON.stringify(parsedUpdates, null, 2));

    const updatedPage = await client.updateContent(contentKey, version, parsedUpdates, locale);

    console.log('✅ Successfully updated page:', updatedPage.displayName);

    return {
      success: true,
      contentKey: updatedPage.key,
      contentType: updatedPage.contentType,
      displayName: updatedPage.displayName,
      version: updatedPage.version,
      locale: updatedPage.locale,
      status: updatedPage.status,
      routeSegment: updatedPage.routeSegment,
      container: updatedPage.container,
      lastModified: updatedPage.lastModified,
      properties: updatedPage.properties,
      message: `Successfully updated ${updatedPage.contentType} page: "${updatedPage.displayName}" (version ${updatedPage.version})`,
    };
  } catch (error: any) {
    console.error('❌ Error updating page:', error);
    console.error('❌ Error stack:', error.stack);

    return {
      success: false,
      error: error.message,
      errorDetails: error.response?.data || error.toString(),
      statusCode: error.response?.status,
      message: `Failed to update CMS page: ${error.message}`,
    };
  }
}

tool({
  name: "MH-update-saas-cms-page",
  description: "Update an existing page in Optimizely CMS by content key and version. Allows you to modify properties, displayName, status, or other content fields.",
  parameters: [
    {
      name: "contentKey",
      type: ParameterType.String,
      description: "The content key (GUID) of the page to update. Can include or exclude dashes. (required)",
      required: true,
    },
    {
      name: "version",
      type: ParameterType.String,
      description: "The version number of the content to update (required). Get this from MH-get-saas-cms-page first.",
      required: true,
    },
    {
      name: "updates",
      type: ParameterType.String,
      description: "JSON string containing the fields to update. Example: {\"displayName\": \"New Title\", \"properties\": {\"HeroHeadline\": \"Updated Headline\"}}",
      required: true,
    },
    {
      name: "locale",
      type: ParameterType.String,
      description: "Optional: Locale code (e.g., 'en', 'sv'). If not provided, uses the default locale.",
      required: false,
    },
  ],
})(MH_update_saas_cms_page);
