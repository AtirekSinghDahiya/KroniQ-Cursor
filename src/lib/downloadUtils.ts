/**
 * Shared download utilities that work across all studios
 * Downloads files properly with correct filenames to the Downloads folder
 */

export interface DownloadOptions {
    filename: string;
    onSuccess?: () => void;
    onError?: (error: Error) => void;
}

/**
 * Download a file from URL with proper filename
 * Fetches the content as a blob first to ensure the download attribute works
 */
export async function downloadFile(
    url: string,
    options: DownloadOptions
): Promise<boolean> {
    const { filename, onSuccess, onError } = options;

    console.log('📥 Downloading file:', { url, filename });

    try {
        // Fetch the file content as blob
        const response = await fetch(url, {
            method: 'GET',
            mode: 'cors',
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch file: ${response.status}`);
        }

        const blob = await response.blob();

        // Create a blob URL that the browser will download with our filename
        const blobUrl = URL.createObjectURL(blob);

        // Create download link
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = filename;
        link.style.display = 'none';
        document.body.appendChild(link);

        // Trigger download
        link.click();

        // Cleanup
        setTimeout(() => {
            document.body.removeChild(link);
            URL.revokeObjectURL(blobUrl);
        }, 1000);

        console.log('✅ Download triggered successfully:', filename);
        onSuccess?.();
        return true;
    } catch (fetchError) {
        console.warn('⚠️ Direct fetch failed, trying with no-cors...', fetchError);

        // Fallback: If CORS fails, try opening in new tab
        try {
            // For cross-origin resources, open in new tab as fallback
            window.open(url, '_blank');
            console.log('⚠️ Opened in new tab as fallback');
            onSuccess?.();
            return true;
        } catch (fallbackError) {
            console.error('❌ Download completely failed:', fallbackError);
            onError?.(fallbackError as Error);
            return false;
        }
    }
}

/**
 * Download an image with proper extension
 */
export async function downloadImage(
    url: string,
    promptOrFilename?: string
): Promise<boolean> {
    const sanitizedName = promptOrFilename
        ? promptOrFilename.substring(0, 50).replace(/[^a-z0-9]/gi, '_')
        : 'kroniq_image';
    const filename = `${sanitizedName}_${Date.now()}.jpg`;

    return downloadFile(url, { filename });
}

/**
 * Download a video with proper extension
 */
export async function downloadVideo(
    url: string,
    promptOrFilename?: string
): Promise<boolean> {
    const sanitizedName = promptOrFilename
        ? promptOrFilename.substring(0, 50).replace(/[^a-z0-9]/gi, '_')
        : 'kroniq_video';
    const filename = `${sanitizedName}_${Date.now()}.mp4`;

    return downloadFile(url, { filename });
}

/**
 * Download an audio file with proper extension
 */
export async function downloadAudio(
    url: string,
    titleOrFilename?: string,
    extension: 'mp3' | 'wav' = 'mp3'
): Promise<boolean> {
    const sanitizedName = titleOrFilename
        ? titleOrFilename.substring(0, 50).replace(/[^a-z0-9]/gi, '_')
        : 'kroniq_audio';
    const filename = `${sanitizedName}_${Date.now()}.${extension}`;

    return downloadFile(url, { filename });
}
