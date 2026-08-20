# Loyalty & Referral Graph Platform

A full-stack loyalty and referral system backed by **CognoDB** (managed graph database speaking openCypher over Bolt). Built with NestJS, Next.js, and Docker.

**Live Demo:** [https://your-demo-url.vercel.app](https://your-demo-url.vercel.app) *(update after deploy)*

---

## Why a Graph Database?

A loyalty/referral platform is fundamentally about **connections**, not rows.

| Relational Pain Point | Graph Solution |
|----------------------|----------------|
| Recursive CTEs to traverse referral chains | Native `[:REFERRED*1..n]` variable-length traversal |
| Self-join hell for multi-level marketing trees | Direct node→relationship→node navigation |
| Complex window functions for "influence score" | Simple pattern matching across the graph |
| Separate adjacency tables that need maintenance | Relationships are first-class citizens |

**The killer example:** *"What is the total purchase value generated transitively through Customer A's entire referral tree?"*
- **SQL:** Recursive CTE + aggregation + careful cycle detection. Fragile, slow, hard to read.
- **Cypher:** `MATCH (a:Customer)-[:REFERRED*]->(desc:Customer)-[:MADE]->(p:Purchase) RETURN sum(p.amount)`. Trivial, fast, explicit.

---

## Data Model

```
┌─────────────┐      REFERRED       ┌─────────────┐
│  Customer   │────────────────────▶│  Customer   │
│  ─────────  │                     │  ─────────  │
│  id         │                     │  id         │
│  name       │                     │  name       │
│  email      │                     │  email      │
│  joinDate   │                     │  joinDate   │
│  tier       │                     │  tier       │
│  points     │                     │  points     │
└──────┬──────┘                     └──────┬──────┘
       │                                   │
       │ MADE                              │ MADE
       ▼                                   ▼
┌─────────────┐                     ┌─────────────┐
│  Purchase   │                     │  Purchase   │
│  ─────────  │                     │  ─────────  │
│  id         │                     │  id         │
│  amount     │                     │  amount     │
│  date       │                     │  date       │
│  items      │                     │  items      │
└──────┬──────┘                     └──────┬──────┘
       │                                   │
       │ AT                                │ AT
       ▼                                   ▼
┌─────────────┐                     ┌─────────────┐
│    Store    │                     │    Store    │
│  ─────────  │                     │  ─────────  │
│  id         │                     │  id         │
│  name       │                     │  name       │
│  location   │                     │  location   │
└─────────────┘                     └─────────────┘

       │
       │ EARNED / TRIGGERED
       ▼
┌─────────────┐
│ RewardEvent │
│  ─────────  │
│  id         │
│  type       │  (points-earned, points-redeemed, tier-upgrade)
│  date       │
│  metadata   │
└─────────────┘
```

---

## Setup

### 1. CognoDB Cloud Instance

1. Sign up at [https://console.cognodb.com/signup](https://console.cognodb.com/signup) (free tier, no card required)
2. Create a free `c0` instance — provisions in under a minute
3. Copy your connection URI (`bolt+s://...`) and the generated password (shown **once**)
4. Paste them into `.env` (see `.env.example`)

### 2. Local Development

```bash
# Clone & install
git clone <repo-url>
cd wexa-cognodb-loyalty

# Install API dependencies
cd api && npm install && cd ..

# Install Web dependencies
cd web && npm install && cd ..

# Set environment variables
cp .env.example .env
# Edit .env with your CognoDB credentials

# Seed the database
cd api && npm run seed

# Start API (port 3001)
cd api && npm run start:dev

# Start Web (port 3000)
cd web && npm run dev
```

### 3. Docker

```bash
# Copy env and fill in credentials
cp .env.example .env

# Build & run
docker-compose up --build
```

---

## Core Cypher Queries

### Multi-hop: Customers within 2 referral hops of any VIP
```cypher
MATCH (vip:Customer {tier: 'VIP'})-[:REFERRED*1..2]->(c:Customer)
WHERE c <> vip
RETURN DISTINCT c.name, c.email, c.tier
```

### Awkward-in-SQL: Total transitive revenue from a customer's referral tree
```cypher
MATCH (root:Customer {id: $customerId})
MATCH (root)-[:REFERRED*0..]->(descendant:Customer)-[:MADE]->(p:Purchase)
RETURN root.name AS referrer,
       count(DISTINCT descendant) AS treeSize,
       sum(p.amount) AS totalRevenue,
       count(p) AS totalPurchases
```

### Referral ROI Leaderboard
```cypher
MATCH (referrer:Customer)-[:REFERRED*1..]->(ref:Customer)-[:MADE]->(p:Purchase)
RETURN referrer.name,
       referrer.tier,
       count(DISTINCT ref) AS referrals,
       sum(p.amount) AS generatedRevenue
ORDER BY generatedRevenue DESC
LIMIT 10
```

### Longest referral chain
```cypher
MATCH path = (c:Customer)-[:REFERRED*]->(leaf:Customer)
WHERE NOT (leaf)-[:REFERRED]->()
RETURN c.name AS root, length(path) AS chainLength, [n IN nodes(path) | n.name] AS chain
ORDER BY chainLength DESC
LIMIT 1
```

---

## Project Structure

```
.
├── api/                    # NestJS backend
│   ├── src/
│   │   ├── customers/      # Customer module, service, controller
│   │   ├── purchases/      # Purchase module
│   │   ├── referrals/      # Referral analytics & queries
│   │   ├── stores/         # Store module
│   │   ├── seed/           # Database seed script
│   │   ├── config/         # Env validation & config
│   │   └── main.ts
│   ├── Dockerfile
│   └── package.json
├── web/                    # Next.js frontend
│   ├── src/
│   │   ├── app/            # App router pages
│   │   ├── components/     # Reusable UI components
│   │   └── lib/            # API client, utils
│   ├── Dockerfile
│   └── package.json
├── docker-compose.yml
├── .env.example
└── README.md
```

---

## Screenshots

*(Add screenshots of dashboard, referral tree visualization, and customer detail view here)*

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Database | CognoDB (openCypher / Bolt 5.x) |
| API | NestJS, TypeScript, neo4j-driver |
| Frontend | Next.js 14 (App Router), TypeScript, Tailwind CSS |
| Visualization | D3.js force-directed graph for referral trees |
| DevOps | Docker, Docker Compose |
| Hosting | Render (API) + Vercel (Web) |

---

## License

MIT
