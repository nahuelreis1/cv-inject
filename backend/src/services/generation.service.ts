import { supabase } from '../db/supabase';
import { env } from '../config/env';
import { Generation } from '../types';
import { v4 as uuidv4 } from 'uuid';

export class GenerationService {
  static async createGenerationRecord(
    cvId: string,
    jobId: string,
    userId?: string,
    batchId?: string
  ): Promise<Generation> {
    const { data, error } = await supabase
      .from('generations')
      .insert({
        cv_id: cvId,
        job_id: jobId,
        user_id: userId,
        batch_id: batchId,
        status: 'pending',
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create generation record: ${error.message}`);
    }

    return data as Generation;
  }

  static async updateGeneration(
    id: string,
    updates: Partial<Generation>
  ): Promise<Generation> {
    const { data, error } = await supabase
      .from('generations')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update generation: ${error.message}`);
    }

    return data as Generation;
  }

  static async uploadGeneratedPdf(
    generationId: string,
    pdfBuffer: Buffer
  ): Promise<string> {
    const storagePath = `generated/${generationId}.pdf`;

    const { error } = await supabase.storage
      .from(env.STORAGE_BUCKET_CV_OUTPUTS)
      .upload(storagePath, pdfBuffer, {
        contentType: 'application/pdf',
        upsert: true
      });

    if (error) {
      throw new Error(`Failed to upload generated PDF: ${error.message}`);
    }

    return storagePath;
  }

  static async getGenerationById(id: string): Promise<Generation | null> {
    const { data, error } = await supabase
      .from('generations')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) return null;
    return data as Generation;
  }
}
