# DrawAI Frontend

## Setup

1. Install packages:

```bash
npm install
```

2. Optional: copy `.env.example` to `.env`.
3. Start Vite:

```bash
npm run dev
```

Frontend runs on:

http://localhost:5173

The default backend is:

http://localhost:8000

The home page shows the top 10 players by points. Select **View full
dashboard** to search and paginate the player directory, compare top points,
and view the most-played player records. Account registration requires a
unique email address; signed-in players can update only their username and
profile-picture URL from their profile card.

During a game, players can send guesses in the shared room chat. The hidden
word reveals one additional character every 20 seconds during the 60-second
round. Correct guesses or time running out reveal the answer and show the
result. The next drawer starts each round; after 10 rounds the final winner is
announced, the room is deleted, and players return to the home screen.
