# Who Did I Choose?
A two-player game where users take turns guessing what the other chose.

## Features
 **Realtime Gameplay**
 - Opponent card flips, selections, and actions sync instantly
 - Built using Supabase real-time channels

 **Collaborative Deck Building**
 - Users can create their own card decks
 - Decks are shared between players

 **Privacy**
 - No user-generated content is stored once the session is finished
 - The goal is quick casual play, so no sign-ups are required

 **Fun UI**
 - Designed to mimic real life so users can easily pick up the mechanics
 - Card flipping, transitions, and micro interactions

## Screenshots
### Mobile
<img width="199" height="431" alt="m1" src="https://github.com/user-attachments/assets/275a5999-3bd2-4429-9ffc-b8fd55bd6334" />
<img width="199" height="431" alt="m2" src="https://github.com/user-attachments/assets/3a5ed6ad-8ce4-4215-83de-190f5d2fae97" />
<img width="200" height="431" alt="m3" src="https://github.com/user-attachments/assets/46eafbad-23cd-4a5d-ad2e-20b202d000b9" />
<img width="200" height="431" alt="m4" src="https://github.com/user-attachments/assets/0d51db3e-d4a6-4b37-80b9-46ccd18efabf" />

### Web
<img width="453" height="268" alt="web1" src="https://github.com/user-attachments/assets/146d5652-a7b7-4e49-a81e-0822e2b72938" />
<img width="453" height="268" alt="web2" src="https://github.com/user-attachments/assets/2ff075da-b0d3-4d77-9ced-5583a26ac2fc" />
<img width="453" height="268" alt="web3" src="https://github.com/user-attachments/assets/6e482092-95a5-40a4-ab90-fa5bdef62213" />
<img width="453" height="268" alt="web4" src="https://github.com/user-attachments/assets/f6894275-a99b-41b6-bac5-1dbb8ffcc136" />
<img width="453" height="306" alt="web5" src="https://github.com/user-attachments/assets/b02307ac-0c74-47ab-8625-96112844fb52" />

## Database
User images are uploaded to a S3 bucket
### Schema
<img width="2852" height="894" alt="db" src="https://github.com/user-attachments/assets/8e1a14e5-410e-4a85-9dbf-0626731a3e2b" />

## Run Locally (For Reference)
1. Install dependencies
```
npm install
```
2. Create Supabase project and configure tables/storage described in database schema section
3. Create .env.local file with Supabase credentials
```
NEXT_PUBLIC_SUPABASE_URL=[YOUR URL HERE]
NEXT_PUBLIC_SUPABASE_ANON_KEY=[YOUR KEY HERE]
```
4. Start dev server
```
npm run dev
```

## Why I built this?
I saw a trend of people replacing the default faces on a Guess Who gameboard with pictures of people they know and playing with their friends. It looked like a lot of fun, so instead of buying the board game, I realized I could build it. So, I worked to translate the physical game onto the web.
 
 
