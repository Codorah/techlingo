# Product

## Register

product

## Users
Francophone professionals, students and job seekers who already read some English but cannot yet *speak* the English of their job: explaining a bug, presenting a campaign, answering an interview question, writing a Slack message. Two domains today:
- **Informatique**: web, mobile, data, AI, cloud/DevOps, cybersecurity, networks, QA, product/design, project management.
- **Marketing et communication digitale**: community management, SEO/SEA, content, growth, brand and communication, e-commerce, marketing data, PR and events.

They use the app on their phone (often a modest Android phone, sometimes a slow connection) in short sessions of 5 to 7 minutes: on transit, during a break, the evening before an interview.

## Product Purpose
TechLingo teaches the English people actually use at work, with the mechanics that make Duolingo a daily habit. The home screen is a **path of units built around work situations** (understand an error message, review a pull request, run a stand-up, present a campaign…), each with a guidebook, short lessons that end with a real production (a Slack message, a PR comment, a stand-up update), and a cumulative test. The last unit of every path is a **mock interview**.

Around the path: the **daily wheel** (one word of the day drawn from units already unlocked), **spaced repetition** (FSRS) so words stick, a **dictionary** of 2,000+ job words with French explanations, **practice games**, and **interview drills** with model answers.

Success means a user can say, out loud and in English, what their job requires: "Can you explain what DevOps is?", "Let me walk you through this campaign's results."

## Principles that differ from Duolingo
1. **Job content, not general English.** Every word, sentence and exercise is something said at work, explained in French, with the false friends of each trade (library ≠ librairie).
2. **Applied speaking and writing.** Lessons end with a production in a realistic work context (Slack thread, pull request, campaign dashboard), not only multiple choice.
3. **Gamification that rewards learning, not volume.** XP depends on mastery (less for redoing an easy lesson). A weekly goal (for example 4 days out of 7) with a freeze and a guilt-free return message replaces a strict daily streak.
4. **Optional, kind competition.** Leaderboards are opt-in, in small groups of similar level or between friends (class, cohort, community) via an invite code. No public demotion. Points are computed server-side from completed lessons.
5. **Every wrong answer is explained**, in French, written in advance (free and reliable).
6. **Light and offline.** Installable PWA (no app store needed, no APK), works offline once loaded, small download.

## Accounts and data
The app works fully **without an account**: progress lives on the phone (IndexedDB) with export/import backup. An **optional account** (planned: "Continue with Google", Neon Postgres + a small API on Vercel) adds cloud backup across devices and the leaderboard. No payment for now.

## Brand Personality
Pro, clear, efficient, encouraging. The game feel of Duolingo (path, XP, celebrations, sound of success) delivered with the restraint of a professional tool. Never childish, never guilt-tripping.

**Mascot: none for now.** A mascot only earns its place if it is drawn by an illustrator with real expressions and animation; a rough one would cheapen the product. The logo (speech bubble with `</>`) is the brand mark.

**Accent per domain** on the same soft sky universe: ocean blue for Informatique, soft coral for Marketing.

**Name:** "TechLingo" is the final name, for both domains. Public address: techlinngo.vercel.app. Public contact: services@codorah.com.

## Anti-references
- Emojis used as UI icons: every icon is a consistent stroke icon from one set.
- Website feel: pages that scroll like a document, no app shell, no native transitions.
- Bland card soup: identical white cards stacked with no hierarchy.
- Childish gamification: cartoon overload, loud colors everywhere, aggressive guilt notifications.
- Generic AI SaaS look: gradient text, glass cards, hero-metric tiles.

## Design Principles
1. **One primary action per screen.** The next step on the path is always obvious and thumb-reachable.
2. **Earned delight.** Animation and celebration reward progress (a correct answer, a finished lesson, a completed unit); they never decorate idle screens.
3. **Show the English.** Terms, example sentences and pronunciation are the hero content; chrome stays quiet around them.
4. **Native, not web.** Bottom tab bar (Apprendre, Dico, Pratique, Carrière, Plus), sheets, press feedback, haptics and safe areas behave like an installed app.
5. **Pro over playful when they conflict.**

## Accessibility & Inclusion
WCAG 2.2 AA: 4.5:1 text contrast, 44px minimum touch targets, visible focus. Every animation has a reduced-motion alternative. Color is never the only signal for right/wrong (icon and text too). **Light theme by default on every phone**, even when the system is dark; dark theme only when the user turns it on in the profile.
