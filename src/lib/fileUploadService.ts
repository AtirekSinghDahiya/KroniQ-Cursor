import { supabase } from './supabase';

export interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
  path: string;
  userId: string;
  createdAt: string;
}

export class FileUploadService {
  private static readonly BUCKET_NAME = 'chat-attachments';
  private static readonly MAX_FILE_SIZE = 50 * 1024 * 1024;

  static async uploadFile(
    file: File,
    userId: string
  ): Promise<UploadedFile | null> {
    try {
      if (file.size > this.MAX_FILE_SIZE) {
        throw new Error('File size exceeds 50MB limit');
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;

      const { data, error } = await supabase.storage
        .from(this.BUCKET_NAME)
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from(this.BUCKET_NAME)
        .getPublicUrl(data.path);

      const uploadedFile: UploadedFile = {
        id: data.path,
        name: file.name,
        size: file.size,
        type: file.type,
        url: publicUrl,
        path: data.path,
        userId,
        createdAt: new Date().toISOString()
      };

      await this.saveFileMetadata(uploadedFile);

      return uploadedFile;
    } catch (error) {
      console.error('Error uploading file:', error);
      return null;
    }
  }

  static async uploadMultipleFiles(
    files: File[],
    userId: string
  ): Promise<UploadedFile[]> {
    const uploadPromises = files.map(file => this.uploadFile(file, userId));
    const results = await Promise.all(uploadPromises);
    return results.filter((file): file is UploadedFile => file !== null);
  }

  private static async saveFileMetadata(file: UploadedFile): Promise<void> {
    try {
      await supabase.from('file_attachments').insert({
        id: file.id,
        user_id: file.userId,
        file_name: file.name,
        file_size: file.size,
        file_type: file.type,
        file_url: file.url,
        file_path: file.path,
        created_at: file.createdAt
      });
    } catch (error) {
      console.error('Error saving file metadata:', error);
    }
  }

  static async deleteFile(filePath: string, userId: string): Promise<boolean> {
    try {
      const { error } = await supabase.storage
        .from(this.BUCKET_NAME)
        .remove([filePath]);

      if (error) throw error;

      await supabase
        .from('file_attachments')
        .delete()
        .eq('id', filePath)
        .eq('user_id', userId);

      return true;
    } catch (error) {
      console.error('Error deleting file:', error);
      return false;
    }
  }

  static async getUserFiles(userId: string): Promise<UploadedFile[]> {
    try {
      const { data, error } = await supabase
        .from('file_attachments')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data.map(item => ({
        id: item.id,
        name: item.file_name,
        size: item.file_size,
        type: item.file_type,
        url: item.file_url,
        path: item.file_path,
        userId: item.user_id,
        createdAt: item.created_at
      }));
    } catch (error) {
      console.error('Error fetching user files:', error);
      return [];
    }
  }

  static isImageFile(fileType: string): boolean {
    return fileType.startsWith('image/');
  }

  static isVideoFile(fileType: string): boolean {
    return fileType.startsWith('video/');
  }

  static isAudioFile(fileType: string): boolean {
    return fileType.startsWith('audio/');
  }

  static isPDFFile(fileType: string): boolean {
    return fileType === 'application/pdf';
  }

  static isTextFile(fileType: string): boolean {
    return fileType.startsWith('text/') ||
           fileType === 'application/json' ||
           fileType === 'application/javascript' ||
           fileType === 'application/xml';
  }

  static async readTextFile(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = reject;
      reader.readAsText(file);
    });
  }

  static async readImageAsBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }

  static getFileIcon(fileType: string): string {
    if (this.isImageFile(fileType)) return '🖼️';
    if (this.isVideoFile(fileType)) return '🎥';
    if (this.isAudioFile(fileType)) return '🎵';
    if (this.isPDFFile(fileType)) return '📄';
    if (this.isTextFile(fileType)) return '📝';
    return '📎';
  }
}
