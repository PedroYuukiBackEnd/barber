create table if not exists public.clientes (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  codigo_licenca text not null unique,
  status text not null default 'ativo' check (status in ('ativo', 'bloqueado', 'vencido')),
  vence_em date,
  criado_em timestamp with time zone default now()
);

alter table public.clientes enable row level security;

drop policy if exists "Leitura publica de licencas por codigo" on public.clientes;

create policy "Leitura publica de licencas por codigo"
on public.clientes
for select
using (true);

-- Nao crie policy publica de insert/update/delete para a anon key.
-- O painel master escreve usando SUPABASE_SERVICE_ROLE_KEY no backend local do dono.
