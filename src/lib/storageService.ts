/**
 * Firebase Storage Service
 * Handles file uploads/downloads for TTS audio and other media
 */

import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage, auth } from './firebase';

/**
 * Upload any studio asset to Firebase Storage
 */
export const uploadStudioAsset = async (
    projectId: string,
    blob: Blob,
    assetType: 'audio' | 'video' | 'image' | 'ppt' | 'other' = 'other'
): Promise<{ success: boolean; url?: string; error?: string }> => {
    try {
        const userId = auth.currentUser?.uid;
        if (!userId) {
            return { success: false, error: 'Not authenticated' };
        }

        // Determine file extension based on asset type
        const extensions: Record<string, string> = {
            audio: 'mp3',
            video: 'mp4',
            image: 'png',
            ppt: 'pptx',
            other: 'bin'
        };
        const ext = extensions[assetType] || 'bin';

        const fileName = `${projectId}_${Date.now()}.${ext}`;
        const folderPath = `studio-assets/${assetType}/${userId}`;
        const storageRef = ref(storage, `${folderPath}/${fileName}`);

        console.log('📤 Uploading studio asset to Firebase Storage...', {
            userId,
            projectId,
            assetType,
            blobSize: blob.size
        });

        await uploadBytes(storageRef, blob);

        const downloadUrl = await getDownloadURL(storageRef);
        console.log('✅ Studio asset uploaded successfully');

        return { success: true, url: downloadUrl };
    } catch (error: any) {
        console.error('❌ Error uploading studio asset:', error);
        return { success: false, error: error.message || 'Failed to upload asset' };
    }
};

/**
 * Upload TTS audio to Firebase Storage
 * Includes a timeout to handle CORS errors gracefully
 */
export const uploadTTSAudio = async (
    projectId: string,
    audioBlob: Blob
): Promise<{ success: boolean; url?: string; error?: string }> => {
    try {
        const userId = auth.currentUser?.uid;
        if (!userId) {
            return { success: false, error: 'Not authenticated' };
        }

        const fileName = `${projectId}_${Date.now()}.mp3`;
        const storageRef = ref(storage, `tts-audio/${userId}/${fileName}`);

        console.log('📤 Uploading TTS audio to Firebase Storage...', {
            userId,
            projectId,
            blobSize: audioBlob.size
        });

        // Create a timeout promise to prevent indefinite hanging on CORS errors
        const timeoutMs = 10000; // 10 seconds
        const uploadPromise = (async () => {
            await uploadBytes(storageRef, audioBlob, {
                contentType: 'audio/mpeg'
            });
            return await getDownloadURL(storageRef);
        })();

        const timeoutPromise = new Promise<never>((_, reject) => {
            setTimeout(() => reject(new Error('Upload timeout - likely CORS issue')), timeoutMs);
        });

        // Race between upload and timeout
        const downloadUrl = await Promise.race([uploadPromise, timeoutPromise]);
        console.log('✅ TTS audio uploaded successfully');

        return { success: true, url: downloadUrl };
    } catch (error: any) {
        console.error('❌ Error uploading TTS audio:', error);
        return { success: false, error: error.message || 'Failed to upload audio' };
    }
};

/**
 * Delete TTS audio from Firebase Storage
 */
export const deleteTTSAudio = async (audioUrl: string): Promise<boolean> => {
    try {
        // Extract the storage path from the URL
        const storageRef = ref(storage, audioUrl);
        await deleteObject(storageRef);
        console.log('🗑️ TTS audio deleted from storage');
        return true;
    } catch (error) {
        console.error('Error deleting TTS audio:', error);
        return false;
    }
};

/**
 * Fetch audio blob from URL (for playback)
 */
export const fetchAudioBlob = async (url: string): Promise<Blob | null> => {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to fetch audio: ${response.status}`);
        }
        return await response.blob();
    } catch (error) {
        console.error('Error fetching audio blob:', error);
        return null;
    }
};
