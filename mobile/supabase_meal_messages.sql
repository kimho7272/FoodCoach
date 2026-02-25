-- Create meal_messages table
CREATE TABLE IF NOT EXISTS public.meal_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    meal_id UUID NOT NULL REFERENCES public.food_logs(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES public.profiles(id),
    receiver_id UUID NOT NULL REFERENCES public.profiles(id),
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Set up RLS
ALTER TABLE public.meal_messages ENABLE ROW LEVEL SECURITY;

-- Policy: Users can see messages where they are the sender or the receiver
CREATE POLICY "Users can view their own meal messages"
ON public.meal_messages FOR SELECT
USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- Policy: Users can insert messages where they are the sender
CREATE POLICY "Users can insert their own meal messages"
ON public.meal_messages FOR INSERT
WITH CHECK (auth.uid() = sender_id);

-- Policy: Receivers can update messages to mark them as read
CREATE POLICY "Receivers can update message read status"
ON public.meal_messages FOR UPDATE
USING (auth.uid() = receiver_id)
WITH CHECK (auth.uid() = receiver_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_meal_messages_meal_id ON public.meal_messages(meal_id);
CREATE INDEX IF NOT EXISTS idx_meal_messages_receiver_id ON public.meal_messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_meal_messages_created_at ON public.meal_messages(created_at);
