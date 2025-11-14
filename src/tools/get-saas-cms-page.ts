import { tool, ParameterType } from "@optimizely-opal/opal-tools-sdk";
import { OptimizelyApiClient } from "../utils/optimizely-cms-client";

interface GetCmsPageParameters {
  contentKey: string;
  version?: string;
  locale?: string;
}

async function MH_get_saas_cms_page(parameters: GetCmsPageParameters) {
  console.log('🔍 Get page tool called with parameters:', JSON.stringify(parameters, null, 2));

  const { contentKey, version, locale } = parameters;

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
    console.log('📥 Fetching content from CMS...');

    const page = await client.getContentByKey(contentKey, version, locale);

    console.log('✅ Successfully fetched page:', page.displayName);

    return {
      success: true,
      contentKey: page.key,
      contentType: page.contentType,
      displayName: page.displayName,
      version: page.version,
      locale: page.locale,
      status: page.status,
      routeSegment: page.routeSegment,
      container: page.container,
      lastModified: page.lastModified,
      properties: page.properties,
      message: `Successfully fetched ${page.contentType} page: "${page.displayName}" (version ${page.version})`,
    };
  } catch (error: any) {
    console.error('❌ Error fetching page:', error);
    console.error('❌ Error stack:', error.stack);

    return {
      success: false,
      error: error.message,
      errorDetails: error.response?.data || error.toString(),
      statusCode: error.response?.status,
      message: `Failed to fetch CMS page: ${error.message}`,
    };
  }
}

tool({
  name: "MH-get-saas-cms-page",
  description: "Fetch an existing page from Optimizely CMS by content key. Returns the full page data including all properties, versions, and metadata.",
  parameters: [
    {
      name: "contentKey",
      type: ParameterType.String,
      description: "The content key (GUID) of the page to fetch. Can include or exclude dashes. (required)",
      required: true,
    },
    {
      name: "version",
      type: ParameterType.String,
      description: "Optional: Specific version number to fetch. If not provided, fetches the latest version.",
      required: false,
    },
    {
      name: "locale",
      type: ParameterType.String,
      description: "Optional: Locale code (e.g., 'en', 'sv'). If not provided, uses the default locale.",
      required: false,
    },
  ],
})(MH_get_saas_cms_page);
