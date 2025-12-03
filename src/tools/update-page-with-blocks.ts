import { tool, ParameterType } from "@optimizely-opal/opal-tools-sdk";
import { OptimizelyApiClient } from "../utils/optimizely-cms-client";

interface UpdatePageWithBlocksParameters {
  pageContentKey: string;
  pageVersion: string;
  contentAreaName: string;
  blocks: string;
  locale?: string;
}

interface BlockDefinition {
  contentType: string;
  displayName: string;
  properties: Record<string, any>;
}

/**
 * Generate a random content key (UUID without dashes) for inline blocks
 */
function generateInlineBlockKey(): string {
  return 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'.replace(/x/g, () => {
    return Math.floor(Math.random() * 16).toString(16);
  });
}

async function MH_update_page_with_blocks(parameters: UpdatePageWithBlocksParameters) {
  console.log('🔍 Update page with blocks tool called with parameters:', JSON.stringify(parameters, null, 2));

  const { pageContentKey, pageVersion, contentAreaName, blocks, locale } = parameters;

  // Parse blocks JSON string
  let parsedBlocks: BlockDefinition[];
  try {
    parsedBlocks = JSON.parse(blocks);
    if (!Array.isArray(parsedBlocks)) {
      return {
        success: false,
        error: "Invalid blocks format",
        message: "Blocks must be an array of block definitions",
      };
    }
  } catch (error) {
    return {
      success: false,
      error: "Invalid JSON format for blocks",
      message: "Failed to parse blocks JSON. Please ensure it's valid JSON format.",
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
    // Step 1: Get the current page to verify it exists and get existing blocks
    console.log('📥 Fetching current page...');
    const currentPage = await client.getContentByKey(pageContentKey, pageVersion, locale);
    console.log('✅ Current page fetched:', currentPage.displayName);

    // Step 2: Get existing blocks from the ContentArea
    const existingBlocks = currentPage.properties?.[contentAreaName] || [];
    console.log(`📦 Found ${existingBlocks.length} existing block(s) in ContentArea '${contentAreaName}'`);

    // Step 3: Build new inline blocks
    console.log(`🔨 Creating ${parsedBlocks.length} new inline block(s)...`);

    const newContentAreaItems = parsedBlocks.map((blockDef, index) => {
      console.log(`🔨 Processing inline block ${index + 1}/${parsedBlocks.length}: ${blockDef.displayName}`);

      // Generate a unique key for the inline block
      const blockKey = generateInlineBlockKey();

      // Add Name property to content if not already present
      const content = {
        Name: blockDef.displayName,  // Set Name property in content
        ...blockDef.properties  // Merge with other properties
      };

      return {
        key: blockKey,
        contentType: blockDef.contentType,
        name: blockDef.displayName,  // Use 'name' for inline blocks in ContentArea
        content: content  // Use 'content' instead of 'properties' for inline blocks
      };
    });

    // Step 4: Combine existing blocks with new blocks
    const contentAreaItems = [...existingBlocks, ...newContentAreaItems];
    console.log(`📝 Updating page ContentArea '${contentAreaName}' with ${contentAreaItems.length} total block(s) (${existingBlocks.length} existing + ${newContentAreaItems.length} new)...`);
    const updates = {
      properties: {
        [contentAreaName]: contentAreaItems
      }
    };

    console.log('📝 Update payload:', JSON.stringify(updates, null, 2));

    const updatedPage = await client.updateContent(
      pageContentKey,
      pageVersion,
      updates,
      locale
    );

    console.log('✅ Successfully updated page with inline blocks');
    console.log('📊 Updated page response:', JSON.stringify(updatedPage, null, 2));

    return {
      success: true,
      pageContentKey: updatedPage.key,
      pageDisplayName: updatedPage.displayName,
      pageVersion: updatedPage.version,
      contentAreaName: contentAreaName,
      blocksCreated: parsedBlocks.length,
      totalBlocks: contentAreaItems.length,
      existingBlocks: existingBlocks.length,
      blocks: parsedBlocks.map(b => ({
        contentType: b.contentType,
        displayName: b.displayName
      })),
      message: `Successfully added ${parsedBlocks.length} new inline block(s) to ContentArea '${contentAreaName}' on page "${updatedPage.displayName}". Total blocks: ${contentAreaItems.length} (${existingBlocks.length} existing + ${parsedBlocks.length} new)`,
    };
  } catch (error: any) {
    console.error('❌ Error updating page with blocks:', error);
    console.error('❌ Error stack:', error.stack);

    return {
      success: false,
      error: error.message,
      errorDetails: error.response?.data || error.toString(),
      statusCode: error.response?.status,
      message: `Failed to update page with blocks: ${error.message}`,
    };
  }
}

tool({
  name: "MH-update-page-with-blocks",
  description: "Add blocks to a ContentArea on an existing page in Optimizely CMS. Creates inline blocks and appends them to the specified ContentArea property, preserving any existing blocks.",
  parameters: [
    {
      name: "pageContentKey",
      type: ParameterType.String,
      description: "The content key (GUID) of the page to update. Can include or exclude dashes. (required)",
      required: true,
    },
    {
      name: "pageVersion",
      type: ParameterType.String,
      description: "The version number of the page to update (required). Get this from MH-get-saas-cms-page first.",
      required: true,
    },
    {
      name: "contentAreaName",
      type: ParameterType.String,
      description: "The name of the ContentArea property to add blocks to (e.g., 'MainContentArea', 'LeftContentArea') (required)",
      required: true,
    },
    {
      name: "blocks",
      type: ParameterType.String,
      description: "JSON array of block definitions. Each block needs contentType, displayName, and properties. Example: [{\"contentType\": \"HeroBlock\", \"displayName\": \"My Hero\", \"properties\": {\"Heading\": \"Welcome\"}}]",
      required: true,
    },
    {
      name: "locale",
      type: ParameterType.String,
      description: "Optional: Locale code (e.g., 'en', 'sv'). If not provided, uses 'en'.",
      required: false,
    },
  ],
})(MH_update_page_with_blocks);
