import { createClient, type ApiClientInstance, type CmsIntegrationApiOptions } from '@remkoj/optimizely-cms-api';

export class OptimizelyApiClient {
  private client: ApiClientInstance;
  private config: CmsIntegrationApiOptions;

  constructor(config: { clientId: string; clientSecret: string; baseUrl: string; debug?: boolean }) {
    this.config = {
      base: new URL(config.baseUrl),
      clientId: config.clientId,
      clientSecret: config.clientSecret,
      debug: config.debug || false,
    };

    this.client = createClient(this.config);
  }

  /**
   * Get content by content key with all properties and values
   * Returns the full content item including all properties in a structured format
   */
  async getContentByKey(contentKey: string, version?: string, locale?: string) {
    try {
      const normalizedKey = this.normalizeContentKey(contentKey);

      if (version) {
        // Get specific version
        return await this.client.content.contentGetVersion(normalizedKey, version, locale);
      } else {
        // Get latest version - first get metadata, then get the latest version
        const metadata = await this.client.content.contentGetMetadata(normalizedKey);

        // List versions to get the latest one
        const versions = await this.client.content.contentListVersions(
          normalizedKey,
          locale ? [locale] : undefined,
          undefined,
          0,
          1
        );

        if (versions.items && versions.items.length > 0) {
          return versions.items[0];
        }

        throw new Error('No versions found for this content');
      }
    } catch (error: any) {
      throw new Error(`Failed to get content: ${error.message}`);
    }
  }

  /**
   * Create a new content item
   */
  async createContent(params: {
    contentType: string;
    container: string;
    locale?: string;
    displayName: string;
    status?: 'draft' | 'published';
    properties?: any;
  }) {
    try {
      const contentItem: any = {
        key: this.generateContentKey(),
        contentType: params.contentType,
        locale: params.locale || 'en',
        container: params.container,
        displayName: params.displayName,
        status: params.status || 'draft',
      };

      // Add properties if provided
      if (params.properties) {
        contentItem.properties = params.properties;
      }

      console.log('🔸 About to call API with contentItem:', JSON.stringify(contentItem, null, 2));

      return await this.client.content.contentCreate(contentItem, false);
    } catch (error: any) {
      console.error('🔸 API Client Error:', error);
      console.error('🔸 API Error Response:', error.response);
      console.error('🔸 API Error Data:', error.response?.data);
      console.error('🔸 API Error Status:', error.response?.status);
      throw error; // Re-throw the original error with all details
    }
  }

  /**
   * Update content by content key and version
   */
  async updateContent(contentKey: string, version: string, updates: any, locale?: string) {
    try {
      const normalizedKey = this.normalizeContentKey(contentKey);

      return await this.client.content.contentPatchVersion(
        normalizedKey,
        version,
        updates,
        locale,
        false
      );
    } catch (error: any) {
      throw new Error(`Failed to update content: ${error.message}`);
    }
  }

  /**
   * List child content items under a parent content key
   */
  async listContentItems(parentContentKey: string, contentTypes?: string[], pageIndex: number = 0, pageSize: number = 25) {
    try {
      const normalizedKey = this.normalizeContentKey(parentContentKey);

      return await this.client.content.contentListItems(
        normalizedKey,
        contentTypes,
        pageIndex,
        pageSize
      );
    } catch (error: any) {
      throw new Error(`Failed to list content items: ${error.message}`);
    }
  }

  /**
   * Get content versions for a specific content key
   */
  async getContentVersions(contentKey: string, locales?: string[], statuses?: any[]) {
    try {
      const normalizedKey = this.normalizeContentKey(contentKey);

      return await this.client.content.contentListVersions(
        normalizedKey,
        locales,
        statuses
      );
    } catch (error: any) {
      throw new Error(`Failed to get content versions: ${error.message}`);
    }
  }

  /**
   * Get a specific content type by key
   */
  async getContentType(contentTypeKey: string) {
    try {
      return await this.client.contentTypes.contentTypesGet(contentTypeKey);
    } catch (error: any) {
      throw new Error(`Failed to get content type: ${error.message}`);
    }
  }

  /**
   * List all content types
   */
  async listContentTypes(pageIndex: number = 0, pageSize: number = 100) {
    try {
      return await this.client.contentTypes.contentTypesList(undefined, undefined, pageIndex, pageSize);
    } catch (error: any) {
      throw new Error(`Failed to list content types: ${error.message}`);
    }
  }

  /**
   * Delete content
   */
  async deleteContent(contentKey: string, permanent: boolean = false) {
    try {
      const normalizedKey = this.normalizeContentKey(contentKey);

      return await this.client.content.contentDelete(normalizedKey, permanent);
    } catch (error: any) {
      throw new Error(`Failed to delete content: ${error.message}`);
    }
  }

  /**
   * Normalize content key by removing dashes
   * Optimizely API requires keys without dashes
   */
  private normalizeContentKey(key: string): string {
    return key.replace(/-/g, '');
  }

  /**
   * Generate a random content key (UUID without dashes)
   */
  private generateContentKey(): string {
    return 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'.replace(/x/g, () => {
      return Math.floor(Math.random() * 16).toString(16);
    });
  }
}