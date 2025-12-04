import { tool, ParameterType } from "@optimizely-opal/opal-tools-sdk";
import { OptimizelyApiClient } from "../utils/optimizely-cms-client";

interface TranslateCmsPageParameters {
  contentKey: string;
  sourceLocale: string;
  targetLocale: string;
  translatedDisplayName?: string;
  translatedProperties?: string;
}

/**
 * Deep merge two objects, with target properties overriding source properties
 */
function deepMerge(source: any, target: any): any {
  const output = { ...source };

  if (isObject(source) && isObject(target)) {
    Object.keys(target).forEach(key => {
      if (isObject(target[key])) {
        if (!(key in source)) {
          output[key] = target[key];
        } else {
          output[key] = deepMerge(source[key], target[key]);
        }
      } else {
        output[key] = target[key];
      }
    });
  }

  return output;
}

function isObject(item: any): boolean {
  return item && typeof item === 'object' && !Array.isArray(item);
}

async function MH_translate_saas_cms_page(parameters: TranslateCmsPageParameters) {
  console.log('🔍 Translate page tool called with parameters:', JSON.stringify(parameters, null, 2));

  const { contentKey, sourceLocale, targetLocale, translatedDisplayName, translatedProperties } = parameters;

  // Parse translated properties if provided
  let parsedTranslatedProperties: Record<string, any> | undefined;
  if (translatedProperties) {
    try {
      parsedTranslatedProperties = JSON.parse(translatedProperties);
    } catch (error) {
      return {
        success: false,
        error: "Invalid JSON format for translatedProperties",
        message: "Failed to parse translatedProperties JSON. Please ensure it's valid JSON format.",
      };
    }
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
    // Step 1: Get the source content to copy metadata and properties
    console.log(`📥 Fetching source page in locale '${sourceLocale}'...`);
    const sourcePage = await client.getContentByKey(contentKey, undefined, sourceLocale);
    console.log('✅ Source page fetched:', sourcePage.displayName);

    // Step 2: Check if target locale version already exists
    console.log(`🔍 Checking if translation already exists for locale '${targetLocale}'...`);
    let targetExists = false;
    try {
      const existingTranslation = await client.getContentByKey(contentKey, undefined, targetLocale);
      targetExists = true;
      console.log(`⚠️  Translation already exists for locale '${targetLocale}' (version ${existingTranslation.version})`);

      return {
        success: false,
        error: "Translation already exists",
        message: `A version of this content already exists for locale '${targetLocale}'. Use MH-update-saas-cms-page to update it instead.`,
        existingVersion: {
          key: existingTranslation.key,
          version: existingTranslation.version,
          displayName: existingTranslation.displayName,
          locale: existingTranslation.locale,
          status: existingTranslation.status,
        }
      };
    } catch (error: any) {
      // If error is 404 or similar, translation doesn't exist - that's expected
      console.log(`✅ No existing translation found for locale '${targetLocale}' - proceeding with creation`);
    }

    // Step 3: Create the translation by creating new content with same key but different locale
    console.log(`🌐 Creating translation for locale '${targetLocale}'...`);

    // Build the new content item for translation
    const translationContent: any = {
      key: contentKey.replace(/-/g, ''), // Normalize key
      contentType: sourcePage.contentType,
      locale: targetLocale,
      container: sourcePage.container,
      displayName: translatedDisplayName || sourcePage.displayName, // Use translated name or fallback to source
      status: 'draft', // Always create as draft
    };

    // Add properties - merge translated properties with source properties
    // This ensures required fields are preserved while allowing translations
    if (sourcePage.properties) {
      translationContent.properties = { ...sourcePage.properties };

      // If translated properties provided, deep merge them
      if (parsedTranslatedProperties) {
        translationContent.properties = deepMerge(sourcePage.properties, parsedTranslatedProperties);
      }
    } else if (parsedTranslatedProperties) {
      translationContent.properties = parsedTranslatedProperties;
    }

    // Add routeSegment if it exists in source
    if (sourcePage.routeSegment) {
      translationContent.routeSegment = sourcePage.routeSegment;
    }

    console.log('📝 Creating translation with data:', JSON.stringify(translationContent, null, 2));

    // Use the client's createContentVersion method to create a language version
    const translatedPage = await client.createContentVersion({
      key: translationContent.key,
      contentType: translationContent.contentType,
      container: translationContent.container,
      locale: translationContent.locale,
      displayName: translationContent.displayName,
      status: translationContent.status,
      properties: translationContent.properties,
      routeSegment: translationContent.routeSegment,
    });

    console.log('✅ Successfully created translation:', translatedPage.displayName);

    return {
      success: true,
      sourceContentKey: sourcePage.key,
      sourceLocale: sourcePage.locale,
      sourceDisplayName: sourcePage.displayName,
      translationContentKey: translatedPage.key,
      translationLocale: translatedPage.locale,
      translationDisplayName: translatedPage.displayName,
      translationVersion: translatedPage.version,
      translationStatus: translatedPage.status,
      contentType: translatedPage.contentType,
      container: translatedPage.container,
      properties: translatedPage.properties,
      message: `Successfully created translation of "${sourcePage.displayName}" from '${sourceLocale}' to '${targetLocale}'. Translation created as draft with version ${translatedPage.version}.`,
    };
  } catch (error: any) {
    console.error('❌ Error creating translation:', error);
    console.error('❌ Error stack:', error.stack);

    return {
      success: false,
      error: error.message,
      errorDetails: error.response?.data || error.body || error.toString(),
      statusCode: error.response?.status,
      message: `Failed to create translation: ${error.message}`,
    };
  }
}

tool({
  name: "MH-translate-saas-cms-page",
  description: "Create a translation of an existing page in Optimizely CMS. Creates a new language version of the same content with a different locale. The translation is created as a draft.",
  parameters: [
    {
      name: "contentKey",
      type: ParameterType.String,
      description: "The content key (GUID) of the page to translate. Can include or exclude dashes. (required)",
      required: true,
    },
    {
      name: "sourceLocale",
      type: ParameterType.String,
      description: "The locale code of the source content to translate from (e.g., 'en', 'sv'). (required)",
      required: true,
    },
    {
      name: "targetLocale",
      type: ParameterType.String,
      description: "The locale code to translate to (e.g., 'fr', 'de', 'sv'). Must be enabled in CMS settings. (required)",
      required: true,
    },
    {
      name: "translatedDisplayName",
      type: ParameterType.String,
      description: "Optional: The translated display name for the page. If not provided, uses the source display name.",
      required: false,
    },
    {
      name: "translatedProperties",
      type: ParameterType.String,
      description: "Optional: JSON string containing translated property values. Example: {\"HeroHeadline\": \"Translated Headline\", \"MainBody\": \"Translated content\"}. If not provided, copies source properties.",
      required: false,
    },
  ],
})(MH_translate_saas_cms_page);
