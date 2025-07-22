import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  ArrowLeft,
  Save,
  Share,
  Users,
  Eye,
  Globe,
  Lock,
  History,
  MoreHorizontal,
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Quote,
  Code,
  Link,
  Image,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Edit
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useDocument } from "@/hooks/useDocument";
import { ShareDialog } from "@/components/ShareDialog";
import { VersionHistoryDialog } from "@/components/VersionHistoryDialog";
import { formatDistanceToNow } from "date-fns";

const DocumentEditor = () => {
  const navigate = useNavigate();
  const { document, loading, saving, lastSaved, saveDocument, toggleVisibility } = useDocument();
  const [localTitle, setLocalTitle] = useState("");
  const [localContent, setLocalContent] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Mock collaborators - you can implement real-time collaboration later
  const collaborators = [
    { id: "1", name: "John Doe", avatar: "", online: true },
    { id: "2", name: "Jane Smith", avatar: "", online: true },
    { id: "3", name: "Mike Johnson", avatar: "", online: false },
  ];

  // Sync local state with document
  useEffect(() => {
    if (document) {
      setLocalTitle(document.title);
      // Handle content - if it's structured data, extract text
      if (typeof document.content === 'string') {
        setLocalContent(document.content);
      } else if (document.content && typeof document.content === 'object') {
        // Extract text from structured content
        const extractText = (content: any): string => {
          if (typeof content === 'string') return content;
          if (content.content && Array.isArray(content.content)) {
            return content.content
              .map((node: any) => {
                if (node.type === 'paragraph' && node.content) {
                  return node.content.map((text: any) => text.text || '').join('');
                }
                return '';
              })
              .join('\n');
          }
          return '';
        };
        setLocalContent(extractText(document.content));
      } else {
        setLocalContent('');
      }
      
      // Set editing mode based on permissions
      setIsEditing(document.userPermission === 'admin' || document.userPermission === 'write');
    }
  }, [document]);

  // Auto-save functionality
  useEffect(() => {
    if (!document || saving || !isEditing) return;

    const autoSaveTimer = setTimeout(() => {
      if (localTitle !== document.title || localContent !== (typeof document.content === 'string' ? document.content : '')) {
        handleSave();
      }
    }, 2000); // Auto-save after 2 seconds of inactivity

    return () => clearTimeout(autoSaveTimer);
  }, [localTitle, localContent, document, saving, isEditing]);

  const handleSave = async () => {
    if (!document) return;
    
    // Convert plain text to structured content
    const structuredContent = {
      type: 'doc',
      content: localContent.split('\n').map(line => ({
        type: 'paragraph',
        content: [{ type: 'text', text: line }]
      }))
    };

    await saveDocument(localTitle, structuredContent);
  };

  const handleBack = () => {
    navigate("/dashboard");
  };

  const handleRestore = async (title: string, content: any) => {
    await saveDocument(title, content);
    setLocalTitle(title);
    // Extract text for local editing
    if (typeof content === 'string') {
      setLocalContent(content);
    } else if (content && content.content && Array.isArray(content.content)) {
      const textContent = content.content
        .map((node: any) => {
          if (node.type === 'paragraph' && node.content) {
            return node.content.map((text: any) => text.text || '').join('');
          }
          return '';
        })
        .join('\n');
      setLocalContent(textContent);
    }
  };

  const insertTextAtCursor = (text: string, wrapBefore = '', wrapAfter = '') => {
    if (!textareaRef.current) return;
    
    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = localContent.substring(start, end);
    
    let newText;
    let newCursorPos;
    
    if (selectedText) {
      // Wrap selected text
      newText = localContent.substring(0, start) + 
                wrapBefore + selectedText + wrapAfter + 
                localContent.substring(end);
      newCursorPos = end + wrapBefore.length + wrapAfter.length;
    } else {
      // Insert text at cursor
      newText = localContent.substring(0, start) + 
                text + 
                localContent.substring(end);
      newCursorPos = start + text.length;
    }
    
    setLocalContent(newText);
    
    // Reset cursor position
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  const handleBold = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = localContent.substring(start, end);
    
    if (selectedText) {
      insertTextAtCursor('', '**', '**');
    } else {
      insertTextAtCursor('**bold text**');
    }
  };

  const handleItalic = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = localContent.substring(start, end);
    
    if (selectedText) {
      insertTextAtCursor('', '_', '_');
    } else {
      insertTextAtCursor('_italic text_');
    }
  };

  const handleUnderline = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = localContent.substring(start, end);
    
    if (selectedText) {
      insertTextAtCursor('', '<u>', '</u>');
    } else {
      insertTextAtCursor('<u>underlined text</u>');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading document...</p>
        </div>
      </div>
    );
  }

  if (!document) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p>Document not found</p>
          <Button onClick={handleBack} className="mt-4">
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container flex h-16 items-center justify-between px-4 md:px-6">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="icon" onClick={handleBack}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="space-y-1">
              <Input
                value={localTitle}
                onChange={(e) => setLocalTitle(e.target.value)}
                className="text-lg font-semibold border-none shadow-none p-0 h-auto focus-visible:ring-0"
                placeholder="Document title..."
                disabled={!isEditing}
              />
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <span>
                  Last saved: {lastSaved 
                    ? formatDistanceToNow(lastSaved, { addSuffix: true })
                    : 'Never'
                  }
                </span>
                <span>•</span>
                <Badge variant={document.is_public ? "secondary" : "outline"} className="text-xs">
                  {document.is_public ? (
                    <>
                      <Globe className="h-3 w-3 mr-1" />
                      Public
                    </>
                  ) : (
                    <>
                      <Lock className="h-3 w-3 mr-1" />
                      Private
                    </>
                  )}
                </Badge>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2 md:space-x-4">
            {/* Debug permissions */}
            <div className="hidden md:flex text-xs text-muted-foreground">
              Permission: {document.userPermission || 'none'}
            </div>

            {/* Edit button for users with write permission who are not the author */}
            {(document.userPermission === 'write') && !isEditing && (
              <Button 
                variant="default" 
                size="sm"
                onClick={() => setIsEditing(true)}
                className="bg-green-600 text-white hover:bg-green-700"
              >
                <Edit className="h-4 w-4 md:mr-2" />
                <span className="hidden md:inline">Edit Document</span>
              </Button>
            )}

            {/* Show editing status */}
            {isEditing && (
              <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">
                Editing Mode
              </Badge>
            )}

            {/* Collaborators - hidden on mobile */}
            <div className="hidden md:flex items-center space-x-2">
              <div className="flex -space-x-2">
                {collaborators.slice(0, 3).map((collaborator) => (
                  <Avatar key={collaborator.id} className="h-8 w-8 border-2 border-background">
                    <AvatarImage src={collaborator.avatar} alt={collaborator.name} />
                    <AvatarFallback className="text-xs">
                      {collaborator.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                    {collaborator.online && (
                      <div className="absolute -top-0.5 -right-0.5 h-3 w-3 bg-green-500 rounded-full border-2 border-background" />
                    )}
                  </Avatar>
                ))}
              </div>
              {collaborators.length > 3 && (
                <span className="text-sm text-muted-foreground">
                  +{collaborators.length - 3} more
                </span>
              )}
            </div>

            <ShareDialog 
              documentId={document.id}
              isPublic={document.is_public}
              onVisibilityChange={toggleVisibility}
            >
              <Button variant="outline" size="sm">
                <Share className="h-4 w-4 md:mr-2" />
                <span className="hidden md:inline">Share</span>
              </Button>
            </ShareDialog>

            <Button onClick={handleSave} disabled={saving || !isEditing} size="sm">
              <Save className="h-4 w-4 md:mr-2" />
              <span className="hidden md:inline">{saving ? "Saving..." : "Save"}</span>
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-background" align="end">
                <DropdownMenuItem onClick={toggleVisibility}>
                  {document.is_public ? (
                    <>
                      <Lock className="mr-2 h-4 w-4" />
                      Make Private
                    </>
                  ) : (
                    <>
                      <Globe className="mr-2 h-4 w-4" />
                      Make Public
                    </>
                  )}
                </DropdownMenuItem>
                <VersionHistoryDialog 
                  documentId={document.id}
                  onRestore={handleRestore}
                >
                  <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                    <History className="mr-2 h-4 w-4" />
                    Version History
                  </DropdownMenuItem>
                </VersionHistoryDialog>
                <DropdownMenuItem onClick={() => {
                  const previewWindow = window.open('', '_blank');
                  if (previewWindow) {
                    previewWindow.document.write(`
                      <html>
                        <head>
                          <title>${document.title}</title>
                          <style>
                            body { font-family: system-ui, -apple-system, sans-serif; max-width: 800px; margin: 0 auto; padding: 2rem; line-height: 1.6; }
                            h1 { border-bottom: 1px solid #eee; padding-bottom: 0.5rem; }
                          </style>
                        </head>
                        <body>
                          <h1>${document.title}</h1>
                          <div style="white-space: pre-wrap;">${localContent}</div>
                        </body>
                      </html>
                    `);
                    previewWindow.document.close();
                  }
                }}>
                  <Eye className="mr-2 h-4 w-4" />
                  Preview
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Editor Toolbar */}
      {isEditing && (
        <div className="border-b bg-muted/50 p-2">
          <div className="container px-4 md:px-6">
            <div className="flex items-center space-x-1 overflow-x-auto">
              <div className="flex items-center space-x-1 mr-4">
                <Button variant="ghost" size="sm" onClick={handleBold}>
                  <Bold className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={handleItalic}>
                  <Italic className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={handleUnderline}>
                  <Underline className="h-4 w-4" />
                </Button>
              </div>

              <div className="hidden sm:flex items-center space-x-1 mr-4">
                <Button variant="ghost" size="sm">
                  <AlignLeft className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm">
                  <AlignCenter className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm">
                  <AlignRight className="h-4 w-4" />
                </Button>
              </div>

              <div className="hidden md:flex items-center space-x-1 mr-4">
                <Button variant="ghost" size="sm">
                  <List className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm">
                  <ListOrdered className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm">
                  <Quote className="h-4 w-4" />
                </Button>
              </div>

              <div className="hidden lg:flex items-center space-x-1">
                <Button variant="ghost" size="sm">
                  <Link className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm">
                  <Image className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm">
                  <Code className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Editor Content */}
      <main className="container py-6 px-4 md:px-6">
        <Card className="min-h-[600px]">
          <CardContent className="p-6">
            <textarea
              ref={textareaRef}
              value={localContent}
              onChange={(e) => setLocalContent(e.target.value)}
              placeholder="Start writing your document... Use @username to mention collaborators"
              className="w-full min-h-[550px] border-none outline-none resize-none text-base leading-relaxed"
              style={{ fontFamily: 'inherit' }}
              disabled={!isEditing}
            />
          </CardContent>
        </Card>

        {/* Status Bar */}
        <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center space-x-4">
            <span>{localContent.length} characters</span>
            <span>•</span>
            <span>Auto-save enabled</span>
            {saving && (
              <>
                <span>•</span>
                <span>Saving...</span>
              </>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <Users className="h-4 w-4" />
            <span>{collaborators.filter(c => c.online).length} online</span>
          </div>
        </div>
      </main>
    </div>
  );
};

export default DocumentEditor;