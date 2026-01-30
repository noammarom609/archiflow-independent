/**
 * Audio Helpers - Utility functions for handling audio files
 * Works with both local blob URLs and remote server URLs
 */

/**
 * Download an audio file from any URL (blob or http)
 * Uses fetch to handle CORS and create a downloadable blob
 * @param {string} url - The audio URL (can be blob: or https:)
 * @param {string} filename - The filename for download
 */
export async function downloadAudioFile(url, filename = 'recording.webm') {
  try {
    // For blob URLs, we can download directly
    if (url.startsWith('blob:')) {
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return { success: true };
    }
    
    // For remote URLs, fetch and create a new blob
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch audio: ${response.status}`);
    }
    
    const blob = await response.blob();
    const blobUrl = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up the temporary blob URL
    setTimeout(() => URL.revokeObjectURL(blobUrl), 100);
    
    return { success: true };
  } catch (error) {
    console.error('❌ Error downloading audio:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Check if a URL is a valid audio URL that can be played
 * @param {string} url - The URL to check
 * @returns {boolean}
 */
export function isValidAudioUrl(url) {
  if (!url) return false;
  return url.startsWith('blob:') || url.startsWith('http://') || url.startsWith('https://');
}

/**
 * Get a display-friendly filename from a URL or generate one
 * @param {string} url - The audio URL
 * @param {string} projectName - Optional project name for the filename
 * @param {string} type - Type of recording ('phone_call' or 'meeting')
 * @returns {string}
 */
export function getAudioFilename(url, projectName = '', type = 'recording') {
  // Try to extract filename from URL
  if (url) {
    try {
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split('/');
      const lastPart = pathParts[pathParts.length - 1];
      if (lastPart && lastPart.includes('.')) {
        return decodeURIComponent(lastPart);
      }
    } catch (e) {
      // URL parsing failed, use fallback
    }
  }
  
  // Generate a descriptive filename
  const typeLabel = type === 'phone_call' ? 'שיחת_טלפון' : type === 'meeting' ? 'פגישה' : 'הקלטה';
  const date = new Date().toLocaleDateString('he-IL').replace(/\./g, '-');
  const projectPart = projectName ? `_${projectName.replace(/\s+/g, '_')}` : '';
  
  return `${typeLabel}${projectPart}_${date}.webm`;
}