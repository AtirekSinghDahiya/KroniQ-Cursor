import { supabase } from './supabaseClient';

export type FormType = 'contact' | 'signup' | 'feedback' | 'support' | 'billing' | 'profile' | 'settings' | 'other';
export type FormStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'archived';

export interface FormSubmission {
  id?: string;
  user_id: string;
  form_type: FormType;
  form_data: Record<string, any>;
  status?: FormStatus;
  ip_address?: string;
  user_agent?: string;
  submitted_at?: string;
  processed_at?: string;
  created_at?: string;
  updated_at?: string;
}

export const submitForm = async (
  userId: string,
  formType: FormType,
  formData: Record<string, any>
): Promise<{ success: boolean; id?: string; error?: string }> => {
  try {
    const submission: Partial<FormSubmission> = {
      user_id: userId,
      form_type: formType,
      form_data: formData,
      status: 'pending',
      user_agent: navigator.userAgent,
      submitted_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('form_submissions')
      .insert(submission)
      .select()
      .single();

    if (error) {
      console.error('Error submitting form:', error);
      return { success: false, error: error.message };
    }

    console.log('Form submitted successfully:', data.id);
    return { success: true, id: data.id };
  } catch (error: any) {
    console.error('Error in submitForm:', error);
    return { success: false, error: error.message };
  }
};

export const updateFormStatus = async (
  formId: string,
  status: FormStatus,
  processedAt?: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    const updates: Partial<FormSubmission> = {
      status,
      processed_at: processedAt || new Date().toISOString(),
    };

    const { error } = await supabase
      .from('form_submissions')
      .update(updates)
      .eq('id', formId);

    if (error) {
      console.error('Error updating form status:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error: any) {
    console.error('Error in updateFormStatus:', error);
    return { success: false, error: error.message };
  }
};

export const getUserFormSubmissions = async (
  userId: string,
  formType?: FormType,
  limit: number = 50
): Promise<{ success: boolean; data?: FormSubmission[]; error?: string }> => {
  try {
    let query = supabase
      .from('form_submissions')
      .select('*')
      .eq('user_id', userId)
      .order('submitted_at', { ascending: false })
      .limit(limit);

    if (formType) {
      query = query.eq('form_type', formType);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching form submissions:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data: data || [] };
  } catch (error: any) {
    console.error('Error in getUserFormSubmissions:', error);
    return { success: false, error: error.message };
  }
};

export const getFormSubmissionById = async (
  formId: string
): Promise<{ success: boolean; data?: FormSubmission; error?: string }> => {
  try {
    const { data, error } = await supabase
      .from('form_submissions')
      .select('*')
      .eq('id', formId)
      .single();

    if (error) {
      console.error('Error fetching form submission:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error: any) {
    console.error('Error in getFormSubmissionById:', error);
    return { success: false, error: error.message };
  }
};

export const deleteFormSubmission = async (
  formId: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    const { error } = await supabase
      .from('form_submissions')
      .delete()
      .eq('id', formId);

    if (error) {
      console.error('Error deleting form submission:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error: any) {
    console.error('Error in deleteFormSubmission:', error);
    return { success: false, error: error.message };
  }
};
