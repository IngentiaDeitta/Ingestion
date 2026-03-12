import { supabase } from './supabase';

export type NotificationType = 'invoice' | 'project' | 'quote' | 'client' | 'system' | 'info';

export const sendNotification = async (title: string, content: string, type: NotificationType = 'info') => {
  try {
    const { error } = await supabase
      .from('system_notifications')
      .insert([{
        title,
        content,
        type,
        is_read: false
      }]);
    
    if (error) throw error;
  } catch (error) {
    console.error('Error sending notification:', error);
  }
};
