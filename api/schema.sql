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
CREATE TABLE IF NOT EXISTS password_resets (
 id uuid PRIMARY KEY,
 user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 token_hash text NOT NULL UNIQUE,
 expires_at timestamptz NOT NULL,
 consumed_at timestamptz,
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS password_resets_user_idx ON password_resets(user_id);
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
CREATE TABLE IF NOT EXISTS exchange_offers (
 id uuid PRIMARY KEY,
 listing_id uuid NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
 sender_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 recipient_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 message varchar(600) NOT NULL,
 status text NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','accepted','declined','cancelled')),
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now(),
 CONSTRAINT exchange_not_self CHECK(sender_id <> recipient_id),
 CONSTRAINT exchange_message_not_blank CHECK(length(trim(message)) >= 10)
);
CREATE UNIQUE INDEX IF NOT EXISTS exchange_one_pending_per_sender_listing ON exchange_offers(listing_id,sender_id) WHERE status='pending';
CREATE INDEX IF NOT EXISTS exchange_offers_received_idx ON exchange_offers(recipient_id,created_at DESC);
CREATE INDEX IF NOT EXISTS exchange_offers_sent_idx ON exchange_offers(sender_id,created_at DESC);
CREATE TABLE IF NOT EXISTS listing_reports (
 id uuid PRIMARY KEY,
 listing_id uuid NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
 reporter_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 reason text NOT NULL CHECK(reason IN ('prohibited','fraud','misleading','harassment','other')),
 details varchar(1000) NOT NULL DEFAULT '',
 status text NOT NULL DEFAULT 'open' CHECK(status IN ('open','reviewed','dismissed')),
 reviewed_at timestamptz,
 created_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(listing_id,reporter_id),
 CONSTRAINT listing_report_details CHECK(length(details)<=1000)
);
CREATE INDEX IF NOT EXISTS listing_reports_queue_idx ON listing_reports(created_at ASC) WHERE status='open';
COMMIT;
