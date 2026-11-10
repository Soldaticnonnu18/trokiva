BEGIN;
CREATE TABLE IF NOT EXISTS users (
 id uuid PRIMARY KEY,
 email text NOT NULL UNIQUE,
 password_hash text NOT NULL,
 password_salt text NOT NULL,
 email_verified_at timestamptz,
 created_at timestamptz NOT NULL DEFAULT now(),
 disabled_at timestamptz,
 CONSTRAINT users_email_lowercase CHECK(email = lower(email))
);
CREATE TABLE IF NOT EXISTS email_verifications (
 id uuid PRIMARY KEY,
 user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 token_hash text NOT NULL UNIQUE,
 expires_at timestamptz NOT NULL,
 consumed_at timestamptz,
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS sessions (
 id uuid PRIMARY KEY,
 user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 token_hash text NOT NULL UNIQUE,
 expires_at timestamptz NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now(),
 revoked_at timestamptz
);
CREATE INDEX IF NOT EXISTS sessions_user_idx ON sessions(user_id);
CREATE TABLE IF NOT EXISTS listings (
 id uuid PRIMARY KEY,
 owner_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 title varchar(100) NOT NULL,
 category varchar(80) NOT NULL,
 description varchar(1200) NOT NULL DEFAULT '',
 wanted varchar(100) NOT NULL DEFAULT '',
 city varchar(100) NOT NULL DEFAULT '',
 state text NOT NULL DEFAULT 'draft' CHECK(state IN ('draft','published','reserved','exchanged','hidden')),
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS listings_public_idx ON listings (created_at DESC) WHERE state='published';
CREATE INDEX IF NOT EXISTS listings_owner_idx ON listings(owner_id,created_at DESC);
COMMIT;
