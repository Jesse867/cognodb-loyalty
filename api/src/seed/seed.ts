import neo4j, { Driver } from 'neo4j-driver';
import * as dotenv from 'dotenv';

dotenv.config({ path: '../.env' });

const TIERS = ['Bronze', 'Silver', 'Gold', 'VIP'] as const;
const FIRST_NAMES = [
  'James', 'Mary', 'Robert', 'Patricia', 'John', 'Jennifer', 'Michael', 'Linda',
  'David', 'Elizabeth', 'William', 'Barbara', 'Richard', 'Susan', 'Joseph', 'Jessica',
  'Thomas', 'Sarah', 'Charles', 'Karen', 'Christopher', 'Nancy', 'Daniel', 'Lisa',
  'Matthew', 'Betty', 'Anthony', 'Margaret', 'Mark', 'Sandra', 'Donald', 'Ashley',
  'Steven', 'Kimberly', 'Paul', 'Emily', 'Andrew', 'Donna', 'Joshua', 'Michelle',
  'Kenneth', 'Dorothy', 'Kevin', 'Carol', 'Brian', 'Amanda', 'George', 'Melissa',
  'Timothy', 'Deborah', 'Ronald', 'Stephanie', 'Edward', 'Rebecca', 'Jason', 'Laura',
  'Jeffrey', 'Sharon', 'Ryan', 'Cynthia', 'Jacob', 'Kathleen', 'Gary', 'Amy',
  'Nicholas', 'Angela', 'Eric', 'Shirley', 'Jonathan', 'Anna', 'Stephen', 'Brenda',
  'Larry', 'Pamela', 'Justin', 'Emma', 'Scott', 'Nicole', 'Brandon', 'Helen',
  'Benjamin', 'Samantha', 'Samuel', 'Katherine', 'Gregory', 'Christine', 'Alexander', 'Debra',
  'Patrick', 'Rachel', 'Frank', 'Catherine', 'Raymond', 'Carolyn', 'Jack', 'Janet',
  'Dennis', 'Ruth', 'Jerry', 'Maria', 'Tyler', 'Heather', 'Aaron', 'Diane',
];
const LAST_NAMES = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis',
  'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas',
  'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Perez', 'Thompson', 'White',
  'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson', 'Walker', 'Young',
  'Allen', 'King', 'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill', 'Flores',
  'Green', 'Adams', 'Nelson', 'Baker', 'Hall', 'Rivera', 'Campbell', 'Mitchell',
  'Carter', 'Roberts', 'Gomez', 'Phillips', 'Evans', 'Turner', 'Diaz', 'Parker',
  'Cruz', 'Edwards', 'Collins', 'Reyes', 'Stewart', 'Morris', 'Morales', 'Murphy',
  'Cook', 'Rogers', 'Gutierrez', 'Ortiz', 'Morgan', 'Cooper', 'Peterson', 'Bailey',
  'Reed', 'Kelly', 'Howard', 'Ramos', 'Kim', 'Cox', 'Ward', 'Richardson',
  'Watson', 'Brooks', 'Chavez', 'Wood', 'James', 'Bennett', 'Gray', 'Mendoza',
  'Ruiz', 'Hughes', 'Price', 'Alvarez', 'Castillo', 'Sanders', 'Patel', 'Myers',
];
const STORE_NAMES = [
  'Downtown Flagship', 'Westfield Mall', 'Airport Terminal B', 'Harbor Point',
  'University District', 'Financial Center', 'Riverside Plaza', 'Tech Park Hub',
];
const ITEMS_POOL = [
  'Wireless Earbuds', 'Smart Watch', 'Laptop Stand', 'USB-C Hub', 'Mechanical Keyboard',
  'Monitor Light Bar', 'Webcam 4K', 'Desk Mat', 'Cable Organizer', 'Portable SSD',
  'Phone Mount', 'Bluetooth Speaker', 'Noise-Canceling Headphones', 'Power Bank',
  'Smart Home Hub', 'Fitness Tracker', 'Tablet Stand', 'LED Desk Lamp',
];

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomChoice<T>(arr: T[]): T {
  return arr[randomInt(0, arr.length - 1)];
}

function generateEmail(first: string, last: string, idx: number): string {
  const domains = ['gmail.com', 'yahoo.com', 'outlook.com', 'icloud.com', 'proton.me'];
  const patterns = [
    `${first.toLowerCase()}.${last.toLowerCase()}`,
    `${first.toLowerCase()[0]}${last.toLowerCase()}`,
    `${last.toLowerCase()}.${first.toLowerCase()}`,
    `${first.toLowerCase()}${last.toLowerCase()[0]}`,
  ];
  return `${randomChoice(patterns)}${idx}@${randomChoice(domains)}`;
}

function generateDate(start: Date, end: Date): string {
  const date = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
  return date.toISOString();
}

interface Customer {
  id: string;
  name: string;
  email: string;
  joinDate: string;
  tier: string;
  points: number;
}

interface Store {
  id: string;
  name: string;
  location: string;
}

interface Purchase {
  id: string;
  customerId: string;
  amount: number;
  date: string;
  items: string[];
  storeId: string;
}

class Seeder {
  private driver: Driver;
  private customers: Customer[] = [];
  private stores: Store[] = [];

  constructor() {
    const uri = process.env.COGNO_URI;
    const user = process.env.COGNO_USER || 'cognodb';
    const password = process.env.COGNO_PASSWORD;

    if (!uri || !password) {
      console.error('❌ Set COGNO_URI and COGNO_PASSWORD in .env');
      process.exit(1);
    }

    this.driver = neo4j.driver(uri, neo4j.auth.basic(user, password));
  }

  async run() {
    console.log('🌱 Starting seed...');

    await this.clearDatabase();
    await this.seedStores();
    await this.seedCustomers(80);
    await this.seedReferrals();
    await this.seedPurchases(300);

    console.log('✅ Seed complete!');
    await this.driver.close();
  }

  private async clearDatabase() {
    const session = this.driver.session();
    try {
      await session.run('MATCH (n) DETACH DELETE n');
      console.log('🧹 Cleared existing data');
    } finally {
      await session.close();
    }
  }

  private async seedStores() {
    const session = this.driver.session();
    try {
      for (const name of STORE_NAMES) {
        const id = `store_${Math.random().toString(36).substring(2, 9)}`;
        const location = `${randomInt(1, 999)} ${randomChoice(['Main St', 'Broadway', 'Market St', 'Ocean Ave', 'Park Blvd'])}, ${randomChoice(['NY', 'CA', 'TX', 'FL', 'IL'])}`;
        const store = { id, name, location };
        this.stores.push(store);

        await session.run(
          'CREATE (s:Store {id: $id, name: $name, location: $location})',
          store
        );
      }
      console.log(`🏪 Created ${this.stores.length} stores`);
    } finally {
      await session.close();
    }
  }

  private async seedCustomers(count: number) {
    const session = this.driver.session();
    const now = new Date();
    const oneYearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);

    try {
      for (let i = 0; i < count; i++) {
        const first = randomChoice(FIRST_NAMES);
        const last = randomChoice(LAST_NAMES);
        const customer: Customer = {
          id: `cust_${Math.random().toString(36).substring(2, 11)}`,
          name: `${first} ${last}`,
          email: generateEmail(first, last, i),
          joinDate: generateDate(oneYearAgo, now),
          tier: 'Bronze',
          points: 0,
        };
        this.customers.push(customer);

        await session.run(
          `CREATE (c:Customer {
            id: $id, name: $name, email: $email,
            joinDate: $joinDate, tier: $tier, points: $points
          })`,
          customer
        );
      }
      console.log(`👥 Created ${this.customers.length} customers`);
    } finally {
      await session.close();
    }
  }

  private async seedReferrals() {
    const session = this.driver.session();
    try {
      // Build referral chains: each customer has 0-3 referrals
      // Create some deep chains (up to 5 levels) to show graph power
      let referralCount = 0;

      for (let i = 0; i < this.customers.length; i++) {
        const referrer = this.customers[i];
        const numReferrals = randomInt(0, 3);

        for (let j = 0; j < numReferrals; j++) {
          // Pick someone who joined after the referrer
          const candidates = this.customers.filter(
            (c) => c.joinDate > referrer.joinDate && c.id !== referrer.id
          );
          if (!candidates.length) continue;

          const referred = randomChoice(candidates);

          // Check if relationship already exists
          const existing = await session.run(
            `MATCH (a:Customer {id: $aId})-[:REFERRED]->(b:Customer {id: $bId}) RETURN count(*) as cnt`,
            { aId: referrer.id, bId: referred.id }
          );

          if (existing.records[0].get('cnt').toNumber() === 0) {
            await session.run(
              `MATCH (a:Customer {id: $aId}), (b:Customer {id: $bId})
               CREATE (a)-[:REFERRED {date: $date}]->(b)`,
              { aId: referrer.id, bId: referred.id, date: referred.joinDate }
            );
            referralCount++;
          }
        }
      }

      console.log(`🔗 Created ${referralCount} referral relationships`);
    } finally {
      await session.close();
    }
  }

  private async seedPurchases(count: number) {
    const session = this.driver.session();
    const now = new Date();
    const oneYearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);

    try {
      for (let i = 0; i < count; i++) {
        const customer = randomChoice(this.customers);
        const store = randomChoice(this.stores);
        const numItems = randomInt(1, 5);
        const items: string[] = [];
        for (let j = 0; j < numItems; j++) {
          items.push(randomChoice(ITEMS_POOL));
        }
        const amount = parseFloat((items.length * randomInt(15, 250) + randomInt(0, 99) / 100).toFixed(2));

        const purchase: Purchase = {
          id: `pur_${Math.random().toString(36).substring(2, 11)}`,
          customerId: customer.id,
          amount,
          date: generateDate(oneYearAgo, now),
          items,
          storeId: store.id,
        };

        await session.run(
          `MATCH (c:Customer {id: $customerId}), (s:Store {id: $storeId})
           CREATE (p:Purchase {
             id: $id, amount: $amount, date: $date, items: $items
           })
           CREATE (c)-[:MADE]->(p)
           CREATE (p)-[:AT]->(s)`,
          {
            customerId: purchase.customerId,
            storeId: purchase.storeId,
            id: purchase.id,
            amount: purchase.amount,
            date: purchase.date,
            items: JSON.stringify(purchase.items),
          }
        );

        // Award points
        const points = Math.floor(amount);
        await session.run(
          `MATCH (c:Customer {id: $customerId})
           SET c.points = c.points + $points`,
          { customerId: customer.id, points }
        );
      }

      console.log(`🛒 Created ${count} purchases`);

      // Update tiers based on total spend
      await session.run(`
        MATCH (c:Customer)
        OPTIONAL MATCH (c)-[:MADE]->(p:Purchase)
        WITH c, sum(p.amount) as totalSpent
        SET c.tier = CASE
          WHEN totalSpent >= 5000 THEN 'VIP'
          WHEN totalSpent >= 2000 THEN 'Gold'
          WHEN totalSpent >= 500 THEN 'Silver'
          ELSE 'Bronze'
        END
      `);
      console.log('⭐ Updated customer tiers');

    } finally {
      await session.close();
    }
  }
}

const seeder = new Seeder();
seeder.run().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
