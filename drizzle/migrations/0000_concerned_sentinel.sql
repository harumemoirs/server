CREATE TABLE "admins" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"name" varchar(255) NOT NULL,
	"password" varchar(255) NOT NULL,
	"reset_token_hash" text,
	"reset_token_expiry" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "admins_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "blog_likes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"blog_id" uuid NOT NULL,
	"fingerprint" text NOT NULL,
	"user_agent" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "blog_likes_blog_id_fingerprint_unique" UNIQUE("blog_id","fingerprint")
);
--> statement-breakpoint
CREATE TABLE "blogs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"synopsis" text NOT NULL,
	"slug" text NOT NULL,
	"content" text NOT NULL,
	"image_urls" text[] DEFAULT '{}'::text[] NOT NULL,
	"admin_id" uuid NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"like_count" numeric DEFAULT '0' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "blogs_title_unique" UNIQUE("title")
);
--> statement-breakpoint
CREATE TABLE "journal_likes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"journal_id" uuid NOT NULL,
	"fingerprint" text NOT NULL,
	"user_agent" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "journal_likes_journal_id_fingerprint_unique" UNIQUE("journal_id","fingerprint")
);
--> statement-breakpoint
CREATE TABLE "journals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"synopsis" text NOT NULL,
	"slug" text NOT NULL,
	"content" text NOT NULL,
	"image_urls" text[] DEFAULT '{}'::text[] NOT NULL,
	"admin_id" uuid NOT NULL,
	"like_count" numeric DEFAULT '0' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "journals_title_unique" UNIQUE("title")
);
--> statement-breakpoint
CREATE TABLE "letter_likes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"letter_id" uuid NOT NULL,
	"fingerprint" text NOT NULL,
	"user_agent" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "letter_likes_letter_id_fingerprint_unique" UNIQUE("letter_id","fingerprint")
);
--> statement-breakpoint
CREATE TABLE "letters" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"admin_id" uuid NOT NULL,
	"content" text NOT NULL,
	"slug" text NOT NULL,
	"date" text NOT NULL,
	"image_urls" text[] DEFAULT '{}'::text[] NOT NULL,
	"like_count" numeric DEFAULT '0' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "letters_title_unique" UNIQUE("title")
);
--> statement-breakpoint
CREATE TABLE "newsletters" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"admin_id" uuid NOT NULL,
	"title" text NOT NULL,
	"subject" text NOT NULL,
	"content" text NOT NULL,
	"sent_to" numeric NOT NULL,
	"failed_for" numeric NOT NULL,
	"sent_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "newsletters_title_unique" UNIQUE("title")
);
--> statement-breakpoint
CREATE TABLE "poem_likes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"poem_id" uuid NOT NULL,
	"fingerprint" text NOT NULL,
	"user_agent" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "poem_likes_poem_id_fingerprint_unique" UNIQUE("poem_id","fingerprint")
);
--> statement-breakpoint
CREATE TABLE "poems" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"synopsis" text NOT NULL,
	"slug" text NOT NULL,
	"content" text NOT NULL,
	"image_urls" text[] DEFAULT '{}'::text[] NOT NULL,
	"admin_id" uuid NOT NULL,
	"like_count" numeric DEFAULT '0' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "poems_title_unique" UNIQUE("title")
);
--> statement-breakpoint
CREATE TABLE "subscribers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"isSubscribed" boolean DEFAULT true,
	"unsubscribed_at" timestamp,
	"joined_at" timestamp DEFAULT now() NOT NULL,
	"is_verified" boolean DEFAULT false NOT NULL,
	CONSTRAINT "subscribers_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "blog_likes" ADD CONSTRAINT "blog_likes_blog_id_blogs_id_fk" FOREIGN KEY ("blog_id") REFERENCES "public"."blogs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blogs" ADD CONSTRAINT "blogs_admin_id_admins_id_fk" FOREIGN KEY ("admin_id") REFERENCES "public"."admins"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "journal_likes" ADD CONSTRAINT "journal_likes_journal_id_journals_id_fk" FOREIGN KEY ("journal_id") REFERENCES "public"."journals"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "journals" ADD CONSTRAINT "journals_admin_id_admins_id_fk" FOREIGN KEY ("admin_id") REFERENCES "public"."admins"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "letter_likes" ADD CONSTRAINT "letter_likes_letter_id_letters_id_fk" FOREIGN KEY ("letter_id") REFERENCES "public"."letters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "letters" ADD CONSTRAINT "letters_admin_id_admins_id_fk" FOREIGN KEY ("admin_id") REFERENCES "public"."admins"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "newsletters" ADD CONSTRAINT "newsletters_admin_id_admins_id_fk" FOREIGN KEY ("admin_id") REFERENCES "public"."admins"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "poem_likes" ADD CONSTRAINT "poem_likes_poem_id_poems_id_fk" FOREIGN KEY ("poem_id") REFERENCES "public"."poems"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "poems" ADD CONSTRAINT "poems_admin_id_admins_id_fk" FOREIGN KEY ("admin_id") REFERENCES "public"."admins"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "blog_likes_blog_idx" ON "blog_likes" USING btree ("blog_id");--> statement-breakpoint
CREATE INDEX "blog_likes_fingerprint_idx" ON "blog_likes" USING btree ("fingerprint");--> statement-breakpoint
CREATE INDEX "journal_likes_journal_idx" ON "journal_likes" USING btree ("journal_id");--> statement-breakpoint
CREATE INDEX "journal_likes_fingerprint_idx" ON "journal_likes" USING btree ("fingerprint");--> statement-breakpoint
CREATE INDEX "letter_likes_letter_idx" ON "letter_likes" USING btree ("letter_id");--> statement-breakpoint
CREATE INDEX "letter_likes_fingerprint_idx" ON "letter_likes" USING btree ("fingerprint");--> statement-breakpoint
CREATE INDEX "poem_likes_poem_idx" ON "poem_likes" USING btree ("poem_id");--> statement-breakpoint
CREATE INDEX "poem_likes_fingerprint_idx" ON "poem_likes" USING btree ("fingerprint");