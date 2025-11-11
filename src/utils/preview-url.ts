const PREVIEW_TOKEN = process.env.PREVIEW_TOKEN || '';
const PREVIEW_DOMAIN = process.env.PREVIEW_DOMAIN || '';

interface PreviewUrlResponse {
  previewUrl: string;
  token: string;
  expiresIn: string;
}

/**
 * Generate a preview URL for content
 */
export async function generatePreviewUrl(
  contentKey: string,
  contentVersion: string,
  pageUrl: string
): Promise<PreviewUrlResponse | null> {
  try {
    // Construct full page URL by combining domain with relative path
    const fullPageUrl = `${PREVIEW_DOMAIN}${pageUrl}`;

    // Construct preview URL with query parameters
    const previewUrl = `${fullPageUrl}?key=${contentKey}&version=${contentVersion}&preview=true`;

    console.log('🔗 Generating preview URL...');
    console.log('🔗 Content Key:', contentKey);
    console.log('🔗 Version:', contentVersion);
    console.log('🔗 Preview URL:', previewUrl);

    return {
      previewUrl: previewUrl,
      token: PREVIEW_TOKEN,
      expiresIn: '3600' // 1 hour
    };
  } catch (error: any) {
    console.error('❌ Failed to generate preview URL:', error.message);
    return null;
  }
}

/**
 * Construct page URL based on content type and route segment
 */
export function constructPageUrl(contentType: string, routeSegment: string): string {
  if (contentType === 'BlogPage') {
    return `/blog/${routeSegment}/`;
  } else if (contentType === 'ArticlePage') {
    return `/articles/${routeSegment}/`;
  } else {
    // Default fallback
    return `/${routeSegment}/`;
  }
}