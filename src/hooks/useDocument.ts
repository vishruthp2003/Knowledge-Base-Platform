import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface Document {
  id: string;
  title: string;
  content: any;
  author_id: string;
  is_public: boolean;
  is_archived: boolean;
  last_edited_by: string | null;
  created_at: string;
  updated_at: string;
  summary: string | null;
  author: {
    full_name: string;
    username: string;
  };
  userPermission?: string;
}

export const useDocument = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [document, setDocument] = useState<Document | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Load document
  useEffect(() => {
    if (id && user) {
      loadDocument();
    } else if (!id && user) {
      // Create new document
      createNewDocument();
    }
  }, [id, user]);

  const loadDocument = async () => {
    if (!id || !user) return;

    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          toast.error('Document not found');
        } else {
          toast.error('Failed to load document');
        }
        return;
      }

      // Check permissions - if user is author, they have admin access
      let userPermission = 'none';
      if (data.author_id === user.id) {
        userPermission = 'admin';
      } else if (data.is_public) {
        userPermission = 'read';
      } else {
        // Check if user has been shared access
        const { data: shareData } = await supabase
          .from('document_shares')
          .select('permission')
          .eq('document_id', id)
          .eq('user_id', user.id)
          .single();
        
        if (shareData) {
          userPermission = shareData.permission;
        }
      }

      if (userPermission === 'none') {
        toast.error('You do not have permission to access this document');
        return;
      }

      // Get author information separately
      const { data: authorData } = await supabase
        .from('profiles')
        .select('full_name, username')
        .eq('user_id', data.author_id)
        .single();

      setDocument({
        ...data,
        author: authorData || { full_name: 'Unknown', username: 'unknown' },
        userPermission
      });
    } catch (error) {
      console.error('Error loading document:', error);
      toast.error('Failed to load document');
    } finally {
      setLoading(false);
    }
  };

  const createNewDocument = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('documents')
        .insert({
          title: 'Untitled Document',
          content: { type: 'doc', content: [] },
          author_id: user.id,
          is_public: false,
          is_archived: false
        })
        .select('*')
        .single();

      if (error) {
        toast.error('Failed to create document');
        return;
      }

      // Get author information
      const { data: authorData } = await supabase
        .from('profiles')
        .select('full_name, username')
        .eq('user_id', user.id)
        .single();

      setDocument({
        ...data,
        author: authorData || { full_name: user.email || 'User', username: user.email?.split('@')[0] || 'user' },
        userPermission: 'admin' // Author always has admin permission
      });
      // Update URL without triggering navigation
      window.history.replaceState(null, '', `/editor/${data.id}`);
    } catch (error) {
      console.error('Error creating document:', error);
      toast.error('Failed to create document');
    } finally {
      setLoading(false);
    }
  };

  const saveDocument = async (title: string, content: any) => {
    if (!document || !user) return false;

    try {
      setSaving(true);
      const { error } = await supabase
        .from('documents')
        .update({
          title,
          content,
          last_edited_by: user.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', document.id);

      if (error) {
        toast.error('Failed to save document');
        return false;
      }

      setLastSaved(new Date());
      setDocument(prev => prev ? { ...prev, title, content, last_edited_by: user.id } : null);
      
      // Create version history entry
      await createVersion(title, content);
      
      return true;
    } catch (error) {
      console.error('Error saving document:', error);
      toast.error('Failed to save document');
      return false;
    } finally {
      setSaving(false);
    }
  };

  const createVersion = async (title: string, content: any) => {
    if (!document || !user) return;

    try {
      // Get current version number
      const { data: versions } = await supabase
        .from('document_versions')
        .select('version_number')
        .eq('document_id', document.id)
        .order('version_number', { ascending: false })
        .limit(1);

      const nextVersion = versions && versions.length > 0 ? versions[0].version_number + 1 : 1;

      await supabase
        .from('document_versions')
        .insert({
          document_id: document.id,
          version_number: nextVersion,
          title,
          content,
          created_by: user.id
        });
    } catch (error) {
      console.error('Error creating version:', error);
    }
  };

  const toggleVisibility = async () => {
    if (!document || !user) return false;

    try {
      const newVisibility = !document.is_public;
      const { error } = await supabase
        .from('documents')
        .update({ is_public: newVisibility })
        .eq('id', document.id);

      if (error) {
        toast.error('Failed to update document visibility');
        return false;
      }

      setDocument(prev => prev ? { ...prev, is_public: newVisibility } : null);
      toast.success(`Document is now ${newVisibility ? 'public' : 'private'}`);
      return true;
    } catch (error) {
      console.error('Error updating visibility:', error);
      toast.error('Failed to update document visibility');
      return false;
    }
  };

  return {
    document,
    loading,
    saving,
    lastSaved,
    saveDocument,
    toggleVisibility,
    loadDocument
  };
};