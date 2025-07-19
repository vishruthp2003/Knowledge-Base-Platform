-- Create user profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  avatar_url TEXT,
  bio TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create documents table
CREATE TABLE public.documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL DEFAULT 'Untitled Document',
  content JSONB NOT NULL DEFAULT '{}',
  summary TEXT,
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES public.documents(id) ON DELETE SET NULL,
  is_public BOOLEAN NOT NULL DEFAULT false,
  is_archived BOOLEAN NOT NULL DEFAULT false,
  last_edited_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create document shares table for permissions
CREATE TABLE public.document_shares (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  permission TEXT NOT NULL CHECK (permission IN ('read', 'write', 'admin')),
  shared_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(document_id, user_id)
);

-- Create document versions table
CREATE TABLE public.document_versions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  title TEXT NOT NULL,
  content JSONB NOT NULL,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(document_id, version_number)
);

-- Create document mentions table
CREATE TABLE public.document_mentions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  mentioned_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mentioned_by UUID NOT NULL REFERENCES auth.users(id),
  mention_context TEXT,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create comments table
CREATE TABLE public.comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  parent_comment_id UUID REFERENCES public.comments(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_mentions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

-- Create security definer functions to avoid RLS recursion
CREATE OR REPLACE FUNCTION public.get_user_document_permission(doc_id UUID, user_id UUID)
RETURNS TEXT
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT 
    CASE 
      WHEN d.author_id = user_id THEN 'admin'
      WHEN d.is_public THEN 'read'
      ELSE COALESCE(ds.permission, 'none')
    END
  FROM public.documents d
  LEFT JOIN public.document_shares ds ON ds.document_id = d.id AND ds.user_id = user_id
  WHERE d.id = doc_id;
$$;

-- RLS Policies for profiles
CREATE POLICY "Users can view all profiles" 
ON public.profiles FOR SELECT 
USING (true);

CREATE POLICY "Users can update their own profile" 
ON public.profiles FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- RLS Policies for documents
CREATE POLICY "Users can view documents they have access to" 
ON public.documents FOR SELECT 
USING (
  is_public = true OR 
  author_id = auth.uid() OR 
  public.get_user_document_permission(id, auth.uid()) != 'none'
);

CREATE POLICY "Users can create their own documents" 
ON public.documents FOR INSERT 
WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can update documents they have write access to" 
ON public.documents FOR UPDATE 
USING (
  author_id = auth.uid() OR 
  public.get_user_document_permission(id, auth.uid()) IN ('write', 'admin')
);

CREATE POLICY "Authors can delete their own documents" 
ON public.documents FOR DELETE 
USING (author_id = auth.uid());

-- RLS Policies for document_shares
CREATE POLICY "Users can view shares for documents they can access" 
ON public.document_shares FOR SELECT 
USING (
  user_id = auth.uid() OR
  public.get_user_document_permission(document_id, auth.uid()) IN ('admin', 'write')
);

CREATE POLICY "Document owners can manage shares" 
ON public.document_shares FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.documents 
    WHERE id = document_id AND author_id = auth.uid()
  )
);

-- RLS Policies for document_versions
CREATE POLICY "Users can view versions of documents they can access" 
ON public.document_versions FOR SELECT 
USING (public.get_user_document_permission(document_id, auth.uid()) != 'none');

CREATE POLICY "Users can create versions for documents they can write" 
ON public.document_versions FOR INSERT 
WITH CHECK (
  public.get_user_document_permission(document_id, auth.uid()) IN ('write', 'admin') AND
  auth.uid() = created_by
);

-- RLS Policies for document_mentions
CREATE POLICY "Users can view their own mentions" 
ON public.document_mentions FOR SELECT 
USING (mentioned_user_id = auth.uid());

CREATE POLICY "Users can create mentions in documents they can write" 
ON public.document_mentions FOR INSERT 
WITH CHECK (
  public.get_user_document_permission(document_id, auth.uid()) IN ('write', 'admin') AND
  auth.uid() = mentioned_by
);

CREATE POLICY "Users can update their own mentions" 
ON public.document_mentions FOR UPDATE 
USING (mentioned_user_id = auth.uid());

-- RLS Policies for comments
CREATE POLICY "Users can view comments on documents they can access" 
ON public.comments FOR SELECT 
USING (public.get_user_document_permission(document_id, auth.uid()) != 'none');

CREATE POLICY "Users can create comments on documents they can access" 
ON public.comments FOR INSERT 
WITH CHECK (
  public.get_user_document_permission(document_id, auth.uid()) != 'none' AND
  auth.uid() = author_id
);

CREATE POLICY "Users can update their own comments" 
ON public.comments FOR UPDATE 
USING (author_id = auth.uid());

CREATE POLICY "Users can delete their own comments" 
ON public.comments FOR DELETE 
USING (author_id = auth.uid());

-- Create trigger function for updating timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_documents_updated_at
  BEFORE UPDATE ON public.documents
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_comments_updated_at
  BEFORE UPDATE ON public.comments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, username, full_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'username', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.email)
  );
  RETURN NEW;
END;
$$;

-- Create trigger for new user registration
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create indexes for better performance
CREATE INDEX idx_documents_author_id ON public.documents(author_id);
CREATE INDEX idx_documents_parent_id ON public.documents(parent_id);
CREATE INDEX idx_documents_created_at ON public.documents(created_at DESC);
CREATE INDEX idx_document_shares_document_id ON public.document_shares(document_id);
CREATE INDEX idx_document_shares_user_id ON public.document_shares(user_id);
CREATE INDEX idx_document_versions_document_id ON public.document_versions(document_id);
CREATE INDEX idx_document_mentions_mentioned_user_id ON public.document_mentions(mentioned_user_id);
CREATE INDEX idx_comments_document_id ON public.comments(document_id);