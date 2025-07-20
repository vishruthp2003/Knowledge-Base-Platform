import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Share, X, Copy, Mail } from 'lucide-react';

interface ShareDialogProps {
  documentId: string;
  isPublic: boolean;
  onVisibilityChange: () => void;
  children?: React.ReactNode;
}

interface DocumentShare {
  id: string;
  user_id: string;
  permission: 'read' | 'write';
  shared_by: string;
  created_at: string;
  user: {
    full_name: string;
    username: string;
    avatar_url?: string;
  };
}

export const ShareDialog = ({ documentId, isPublic, onVisibilityChange, children }: ShareDialogProps) => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [permission, setPermission] = useState<'read' | 'write'>('read');
  const [shares, setShares] = useState<DocumentShare[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      loadShares();
    }
  }, [open]);

  const loadShares = async () => {
    try {
      const { data: sharesData, error } = await supabase
        .from('document_shares')
        .select('*')
        .eq('document_id', documentId);

      if (error) {
        console.error('Error loading shares:', error);
        return;
      }

      if (sharesData && sharesData.length > 0) {
        // Get user data for each share
        const userIds = sharesData.map(share => share.user_id);
        const { data: usersData } = await supabase
          .from('profiles')
          .select('user_id, full_name, username, avatar_url')
          .in('user_id', userIds);

        const sharesWithUsers = sharesData.map(share => ({
          ...share,
          permission: share.permission as 'read' | 'write',
          user: usersData?.find(user => user.user_id === share.user_id) || {
            full_name: 'Unknown User',
            username: 'unknown',
            avatar_url: undefined
          }
        }));

        setShares(sharesWithUsers);
      } else {
        setShares([]);
      }
    } catch (error) {
      console.error('Error loading shares:', error);
    }
  };

  const handleShare = async () => {
    if (!email.trim() || !user) return;

    try {
      setLoading(true);

      // First, find the user by email
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('user_id, full_name, username')
        .ilike('username', email.trim()) // Assuming username is email-like
        .limit(1);

      if (profileError || !profiles || profiles.length === 0) {
        toast.error('User not found');
        return;
      }

      const targetUser = profiles[0];

      // Check if already shared
      const existingShare = shares.find(share => share.user_id === targetUser.user_id);
      if (existingShare) {
        toast.error('Document already shared with this user');
        return;
      }

      // Create share
      const { error } = await supabase
        .from('document_shares')
        .insert({
          document_id: documentId,
          user_id: targetUser.user_id,
          permission,
          shared_by: user.id
        });

      if (error) {
        toast.error('Failed to share document');
        return;
      }

      toast.success('Document shared successfully');
      setEmail('');
      loadShares();
    } catch (error) {
      console.error('Error sharing document:', error);
      toast.error('Failed to share document');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveShare = async (shareId: string) => {
    try {
      const { error } = await supabase
        .from('document_shares')
        .delete()
        .eq('id', shareId);

      if (error) {
        toast.error('Failed to remove share');
        return;
      }

      toast.success('Share removed');
      loadShares();
    } catch (error) {
      console.error('Error removing share:', error);
      toast.error('Failed to remove share');
    }
  };

  const handleUpdatePermission = async (shareId: string, newPermission: 'read' | 'write') => {
    try {
      const { error } = await supabase
        .from('document_shares')
        .update({ permission: newPermission })
        .eq('id', shareId);

      if (error) {
        toast.error('Failed to update permission');
        return;
      }

      toast.success('Permission updated');
      loadShares();
    } catch (error) {
      console.error('Error updating permission:', error);
      toast.error('Failed to update permission');
    }
  };

  const copyShareLink = () => {
    const url = `${window.location.origin}/editor/${documentId}`;
    navigator.clipboard.writeText(url);
    toast.success('Link copied to clipboard');
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button variant="outline">
            <Share className="h-4 w-4 mr-2" />
            Share
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share Document</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Public/Private Toggle */}
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div>
              <p className="font-medium">Public Access</p>
              <p className="text-sm text-muted-foreground">
                Anyone with the link can {isPublic ? 'view' : 'not access'} this document
              </p>
            </div>
            <Button 
              variant={isPublic ? "default" : "outline"} 
              size="sm"
              onClick={onVisibilityChange}
            >
              {isPublic ? 'Public' : 'Private'}
            </Button>
          </div>

          {/* Share Link */}
          <div className="flex items-center space-x-2">
            <Input
              value={`${window.location.origin}/editor/${documentId}`}
              readOnly
              className="flex-1"
            />
            <Button variant="outline" size="icon" onClick={copyShareLink}>
              <Copy className="h-4 w-4" />
            </Button>
          </div>

          {/* Share with specific users */}
          <div className="space-y-3">
            <Label>Share with specific people</Label>
            <div className="flex space-x-2">
              <Input
                placeholder="Enter username or email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1"
              />
              <Select value={permission} onValueChange={(value: 'read' | 'write') => setPermission(value)}>
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="read">Read</SelectItem>
                  <SelectItem value="write">Write</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={handleShare} disabled={loading || !email.trim()}>
                <Mail className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Current shares */}
          {shares.length > 0 && (
            <div className="space-y-2">
              <Label>People with access</Label>
              {shares.map((share) => (
                <div key={share.id} className="flex items-center justify-between p-2 border rounded">
                  <div className="flex items-center space-x-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={share.user.avatar_url} />
                      <AvatarFallback>
                        {share.user.full_name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">{share.user.full_name}</p>
                      <p className="text-xs text-muted-foreground">@{share.user.username}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Select
                      value={share.permission}
                      onValueChange={(value: 'read' | 'write') => handleUpdatePermission(share.id, value)}
                    >
                      <SelectTrigger className="w-20 h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="read">Read</SelectItem>
                        <SelectItem value="write">Write</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleRemoveShare(share.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};