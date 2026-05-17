import { supabase } from '../db/supabase';
import { env } from '../config/env';
import { CV } from '../types';
import { v4 as uuidv4 } from 'uuid';

export class CvService {
  static async uploadCv(
    fileBuffer: Buffer,
    filename: string,
    originalText: string,
    pages: number,
    fileSize: number,
    userId?: string
  ): Promise<CV> {
    const fileId = uuidv4();
    const storagePath = `${userId || 'anonymous'}/${fileId}-${filename}`;

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from(env.STORAGE_BUCKET_CV_UPLOADS)
      .upload(storagePath, fileBuffer, {
        contentType: 'application/pdf',
      });

    if (uploadError) {
      throw new Error(`Failed to upload CV to storage: ${uploadError.message}`);
    }

    // Save metadata to DB
    const { data, error: dbError } = await supabase
      .from('cvs')
      .insert({
        user_id: userId,
        filename,
        original_text: originalText,
        pages,
        file_size: fileSize,
        storage_path: storagePath,
      })
      .select()
      .single();

    if (dbError) {
      throw new Error(`Failed to save CV metadata: ${dbError.message}`);
    }

    return data as CV;
  }

  static async getCvById(id: string): Promise<CV | null> {
    const { data, error } = await supabase
      .from('cvs')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) return null;
    return data as CV;
  }

  /**
   * Recupera el buffer del PDF original desde Supabase Storage.
   */
  static async getCvPdfBuffer(cvId: string): Promise<Buffer> {
    // 1. Obtener metadata del CV de la DB
    const cv = await this.getCvById(cvId);
    if (!cv) {
      throw new Error('CV not found');
    }

    // 2. Construir el storage path
    // El path se guardó en uploadCv como: {userId || 'anonymous'}/{fileId}-{filename}
    // Pero necesitamos el path exacto. Como no guardamos el path en la DB,
    // tenemos que listar los archivos del bucket para este usuario.
    
    // Opción A: si tenemos storage_path en el tipo CV, usarlo directamente
    if ((cv as any).storage_path) {
      const { data, error } = await supabase.storage
        .from(env.STORAGE_BUCKET_CV_UPLOADS)
        .download((cv as any).storage_path);
      
      if (error || !data) {
        throw new Error(`Failed to download CV PDF: ${error?.message}`);
      }
      
      return Buffer.from(await data.arrayBuffer());
    }
    
    // Opción B: buscar por prefijo (userId o anonymous)
    const userId = cv.user_id || 'anonymous';
    const { data: files, error: listError } = await supabase.storage
      .from(env.STORAGE_BUCKET_CV_UPLOADS)
      .list(userId, { search: cv.filename });
    
    if (listError || !files || files.length === 0) {
      throw new Error(`CV file not found in storage for user ${userId}`);
    }
    
    const storagePath = `${userId}/${files[0].name}`;
    
    const { data, error } = await supabase.storage
      .from(env.STORAGE_BUCKET_CV_UPLOADS)
      .download(storagePath);
    
    if (error || !data) {
      throw new Error(`Failed to download CV PDF: ${error?.message}`);
    }
    
    return Buffer.from(await data.arrayBuffer());
  }
}
