-- -------------------Reference tables------------------------
create table if not exists public.user_profiles
(
    user_id
    uuid
    primary
    key
    references
    auth
    .
    users
    on
    delete
    cascade,
    display_name
    text,
    company_name
    text,
    phone
    text,
    social
    jsonb
    default
    '{}' -- e.g. {"instagram":"@foo","x":"@bar"}
);

create
or replace function public.check_jsonb_handles()
returns trigger
language plpgsql
as $$
begin
  -- example rule: if an Instagram handle exists it must start with '@'
  if
new.social ? 'instagram' then
    if (new.social ->> 'instagram') !~ '^@' then
      raise exception 'Instagram handle must start with @';
end if;
end if;
  -- add more per-network checks here if you like
return new;
end;
$$;

create trigger trg_check_handles
    before insert or
update
    on public.user_profiles
    for each row
    execute function public.check_jsonb_handles();

create table if not exists public.venues
(
    venue_id
    uuid
    primary
    key
    default
    gen_random_uuid
(
),
    venue_name text not null,
    address_line1 text,
    address_line2 text,
    city text,
    state text,
    postal_code text,
    country text,
    phone text
    );


-- ---------------Event and membership------------------------
create table public.events
(
    event_id   uuid primary key default gen_random_uuid(),
    event_name text not null,
    start_date date,
    end_date   date,
    venue_id   uuid references public.venues on delete set null,
    owner_id   uuid references auth.users
);

-- many-to-many user↔event  + role (“planner”, “vendor”)
create table public.event_memberships
(
    event_id uuid references public.events on delete cascade,
    user_id  uuid references auth.users on delete cascade,
    role     text default 'vendor', -- planner | vendor
    primary key (event_id, user_id)
);

-- per-event “@category” list (1:1 with a vendor)
create table public.vendor_categories
(
    vendor_category_id uuid primary key default gen_random_uuid(),
    event_id           uuid references public.events on delete cascade,
    name               text not null,              -- florist, caterer …
    assigned_user_id   uuid references auth.users, -- NULL until assigned
    display_name       text,                       -- optional override
    category_handle    text                        -- e.g. @BestFlorals
);

alter table public.vendor_categories
    add constraint one_user_per_category
        unique (event_id, name);


-- ---------------chat layer------------------------
-- 1-to-1: each event has exactly one conversation
create table public.conversations
(
    conversation_id uuid primary key default gen_random_uuid(),
    event_id        uuid unique references public.events on delete cascade
);

-- messages (+ shallow threads)
create table public.messages
(
    message_id        uuid primary key default gen_random_uuid(),
    conversation_id   uuid references public.conversations on delete cascade,
    parent_message_id uuid references public.messages on delete cascade,
    author_id         uuid references auth.users,
    body              text not null,
    created_at        timestamptz      default now()
);

-- reactions (any emoji, one row per user ↔ message ↔ emoji)
create table public.message_reactions
(
    message_id uuid references public.messages on delete cascade,
    reactor_id uuid references auth.users on delete cascade,
    emoji      text not null,
    primary key (message_id, reactor_id, emoji)
);

-- mentions used for push targets
create table public.message_mentions
(
    message_id        uuid references public.messages on delete cascade,
    mentioned_user_id uuid references auth.users on delete cascade,
    primary key (message_id, mentioned_user_id)
);

-- ---------------Row-level security----------------
-- enable RLS
alter table public.events enable row level security;
alter table public.event_memberships enable row level security;
alter table public.vendor_categories enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.message_reactions enable row level security;
alter table public.message_mentions enable row level security;
alter table public.user_profiles enable row level security;

-- helper: current user is member of event
create function public.is_event_member(eid uuid)
    returns boolean
    language sql stable as $$
select exists (select 1
               from public.event_memberships
               where event_id = eid
                 and user_id = auth.uid())
           $$;

-- policies (read/write only if member)
create
policy "members read their event rows"
  on public.events for
select
    using ( public.is_event_member(event_id) or owner_id = auth.uid() );

create
policy "members manage event memberships"
  on public.event_memberships
  using ( public.is_event_member(event_id) );

create
policy "members chat"
  on public.messages
  for all
  using ( public.is_event_member(
            (select event_id from public.conversations c
             where c.conversation_id = messages.conversation_id))
        );


-- ---------------Seed default categories------------------------
create function public.seed_default_categories()
    returns trigger
    language plpgsql as $$
begin
insert into public.vendor_categories(event_id, name)
select new.event_id, name
from (values ('florist'),
             ('caterer'),
             ('photographer'),
             ('videographer'),
             ('rentals'),
             ('planner'),
             ('baker'),
             ('dj'),
             ('band'),
             ('makeup'),
             ('hair'),
             ('lighting'),
             ('bartender'),
             ('stationery'),
             ('signage'),
             ('cake'),
             ('transportation'),
             ('officiant')) as t(name);
return new;
end;
$$;

create trigger trg_seed_categories
    after insert
    on public.events
    for each row
    execute function public.seed_default_categories();



-- ---------------Supabase realtime------------------------
-- only stream messages
alter
publication supabase_realtime add table public.messages;
