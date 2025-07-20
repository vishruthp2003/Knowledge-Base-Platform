import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { History, RotateCcw } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface VersionHistoryDialogProps {
  documentId: string;
  onRestore: (title: string, content: any) => void;
  children?: React.ReactNode;
}

interface DocumentVersion {
  id: string;
  version_number: number;
  title: string;
  content: any;
  created_at: string;
  created_by: string;
  creator: {
    full_name: string;
    username: string;
    avatar_url?: string;
  };
}

export const VersionHistoryDialog = ({ documentId, onRestore, children }: VersionHistoryDialogProps) => {
  const [open, setOpen] = useState(false);
  const [versions, setVersions] = useState<DocumentVersion[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState<DocumentVersion | null>(null);

  useEffect(() => {
    if (open) {
      loadVersionHistory();
    }
  }, [open]);

  const loadVersionHistory = async () => {
    try {
      setLoading(true);
      const { data: versionsData, error } = await supabase
        .from('document_versions')
        .select('*')
        .eq('document_id', documentId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading version history:', error);
        toast.error('Failed to load version history');
        return;
      }

      if (versionsData && versionsData.length > 0) {
        // Get creator data for each version
        const creatorIds = versionsData.map(version => version.created_by);
        const { data: creatorsData } = await supabase
          .from('profiles')
          .select('user_id, full_name, username, avatar_url')
          .in('user_id', creatorIds);

        const versionsWithCreators = versionsData.map(version => ({
          ...version,
          creator: creatorsData?.find(creator => creator.user_id === version.created_by) || {
            full_name: 'Unknown User',
            username: 'unknown',
            avatar_url: undefined
          }
        }));

        setVersions(versionsWithCreators);
      } else {
        setVersions([]);
      }
    } catch (error) {
      console.error('Error loading version history:', error);
      toast.error('Failed to load version history');
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async (version: DocumentVersion) => {
    try {
      await onRestore(version.title, version.content);
      toast.success(`Restored to version ${version.version_number}`);
      setOpen(false);
    } catch (error) {
      console.error('Error restoring version:', error);
      toast.error('Failed to restore version');
    }
  };

  const getContentPreview = (content: any): string => {
    try {
      if (typeof content === 'string') {
        return content.slice(0, 100) + (content.length > 100 ? '...' : '');
      }
      if (content && content.content && Array.isArray(content.content)) {
        const textContent = content.content
          .map((node: any) => {
            if (node.type === 'paragraph' && node.content) {
              return node.content
                .map((text: any) => text.text || '')
                .join('');
            }
            return '';
          })
          .join(' ');
        return textContent.slice(0, 100) + (textContent.length > 100 ? '...' : '');
      }
      return 'No preview available';
    } catch (error) {
      return 'No preview available';
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button variant="ghost">
            <History className="h-4 w-4 mr-2" />
            Version History
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Version History</DialogTitle>
        </DialogHeader>
        
        <div className="flex h-[60vh]">
          {/* Version List */}
          <div className="w-1/3 border-r pr-4">
            <ScrollArea className="h-full">
              {loading ? (
                <div className="text-center py-4">Loading versions...</div>
              ) : versions.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground">
                  No version history available
                </div>
              ) : (
                <div className="space-y-2">
                  {versions.map((version) => (
                    <div
                      key={version.id}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        selectedVersion?.id === version.id 
                          ? 'bg-primary/10 border-primary' 
                          : 'hover:bg-muted'
                      }`}
                      onClick={() => setSelectedVersion(version)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant="outline">v{version.version_number}</Badge>
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(version.created_at), { addSuffix: true })}
                        </span>
                      </div>
                      
                      <div className="flex items-center space-x-2 mb-2">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={version.creator.avatar_url} />
                          <AvatarFallback className="text-xs">
                            {version.creator.full_name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm">{version.creator.full_name}</span>
                      </div>
                      
                      <p className="text-sm font-medium truncate">{version.title}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {getContentPreview(version.content)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>

          {/* Version Preview */}
          <div className="flex-1 pl-4">
            {selectedVersion ? (
              <div className="h-full flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold">{selectedVersion.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      Version {selectedVersion.version_number} • 
                      {formatDistanceToNow(new Date(selectedVersion.created_at), { addSuffix: true })} • 
                      by {selectedVersion.creator.full_name}
                    </p>
                  </div>
                  <Button 
                    onClick={() => handleRestore(selectedVersion)}
                    className="flex items-center space-x-2"
                  >
                    <RotateCcw className="h-4 w-4" />
                    <span>Restore</span>
                  </Button>
                </div>
                
                <ScrollArea className="flex-1 border rounded-lg p-4">
                  <div className="whitespace-pre-wrap">
                    {getContentPreview(selectedVersion.content)}
                  </div>
                </ScrollArea>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground">
                Select a version to preview
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};