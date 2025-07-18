import { useState } from "react";
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
  AlignRight
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const DocumentEditor = () => {
  const navigate = useNavigate();
  const [title, setTitle] = useState("Untitled Document");
  const [content, setContent] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState("Just now");

  // Mock collaborators
  const collaborators = [
    { id: "1", name: "John Doe", avatar: "", online: true },
    { id: "2", name: "Jane Smith", avatar: "", online: true },
    { id: "3", name: "Mike Johnson", avatar: "", online: false },
  ];

  const handleSave = async () => {
    setIsSaving(true);
    // TODO: Implement auto-save with Supabase
    setTimeout(() => {
      setIsSaving(false);
      setLastSaved("Just now");
    }, 1000);
  };

  const handleShare = () => {
    // TODO: Open share dialog
    console.log("Open share dialog");
  };

  const handleBack = () => {
    navigate("/dashboard");
  };

  const handleToggleVisibility = () => {
    setIsPublic(!isPublic);
    // TODO: Update document visibility in database
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="icon" onClick={handleBack}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="space-y-1">
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="text-lg font-semibold border-none shadow-none p-0 h-auto focus-visible:ring-0"
                placeholder="Document title..."
              />
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <span>Last saved: {lastSaved}</span>
                <span>•</span>
                <Badge variant={isPublic ? "secondary" : "outline"} className="text-xs">
                  {isPublic ? (
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

          <div className="flex items-center space-x-4">
            {/* Collaborators */}
            <div className="flex items-center space-x-2">
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

            <Button variant="outline" onClick={handleShare}>
              <Share className="h-4 w-4 mr-2" />
              Share
            </Button>

            <Button onClick={handleSave} disabled={isSaving}>
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? "Saving..." : "Save"}
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-background" align="end">
                <DropdownMenuItem onClick={handleToggleVisibility}>
                  {isPublic ? (
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
                <DropdownMenuItem>
                  <History className="mr-2 h-4 w-4" />
                  Version History
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Eye className="mr-2 h-4 w-4" />
                  Preview
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Editor Toolbar */}
      <div className="border-b bg-muted/50 p-2">
        <div className="container">
          <div className="flex items-center space-x-1">
            <div className="flex items-center space-x-1 mr-4">
              <Button variant="ghost" size="sm">
                <Bold className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm">
                <Italic className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm">
                <Underline className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex items-center space-x-1 mr-4">
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

            <div className="flex items-center space-x-1 mr-4">
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

            <div className="flex items-center space-x-1">
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

      {/* Editor Content */}
      <main className="container py-6">
        <Card className="min-h-[600px]">
          <CardContent className="p-6">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Start writing your document... Use @username to mention collaborators"
              className="w-full min-h-[550px] border-none outline-none resize-none text-base leading-relaxed"
              style={{ fontFamily: 'inherit' }}
            />
          </CardContent>
        </Card>

        {/* Status Bar */}
        <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center space-x-4">
            <span>{content.length} characters</span>
            <span>•</span>
            <span>Auto-save enabled</span>
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