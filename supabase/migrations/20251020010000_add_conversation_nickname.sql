 v-- Add a nullable nickname to conversations
alter table public.conversations
add column if not exists nickname text;

-- Optional: comment for documentation
comment on column public.conversations.nickname is 'Shared nickname/title for the conversation, visible to all participants.';


