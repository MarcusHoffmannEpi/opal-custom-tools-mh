import axios from 'axios';

const PREVIEW_TOKEN = process.env.PREVIEW_TOKEN || '';
const PREVIEW_DOMAIN = process.env.PREVIEW_DOMAIN || 'https://opti-astro1-gbg.vercel.app';

interface PreviewUrlRequest {
  contentKey: string;
  contentVersion: string;
  pageUrl: string;
}

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
    const apiUrl = `${PREVIEW_DOMAIN}/api/preview-url.json`;

    const requestBody: PreviewUrlRequest = {
      contentKey,
      contentVersion,
      pageUrl,
    };

    const response = await axios.post<PreviewUrlResponse>(apiUrl, requestBody, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${PREVIEW_TOKEN}`,
      },
    });

    return response.data;
  } catch (error: any) {
    console.error('Failed to generate preview URL:', error.message);
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