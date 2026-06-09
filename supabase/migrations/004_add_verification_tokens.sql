-- Auth.js v5 email provider (Resend magic link) requires a verification_tokens table
-- to store one-time tokens. Without this, the MissingAdapter error fires on every request.
create table verification_tokens (
  identifier text not null,
  token text not null,
  expires timestamptz not null,
  primary key (identifier, token)
);

-- No RLS needed — this table is only accessed via the service role key in the adapter.
-- Tokens are consumed (deleted) on use and expire automatically via the expires column.
