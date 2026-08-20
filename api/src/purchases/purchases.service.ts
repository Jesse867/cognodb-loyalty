import { Injectable, Inject } from '@nestjs/common';
import { Driver, Session } from 'neo4j-driver';
import { NEO4J_DRIVER } from '../config/database.module';
import { CreatePurchaseDto } from './dto/create-purchase.dto';

@Injectable()
export class PurchasesService {
  constructor(@Inject(NEO4J_DRIVER) private readonly driver: Driver) {}

  private getSession(): Session {
    return this.driver.session();
  }

  async create(dto: CreatePurchaseDto) {
    const session = this.getSession();
    try {
      const id = 'pur_' + Math.random().toString(36).substring(2, 11);
      const date = new Date().toISOString();
      const itemsStr = JSON.stringify(dto.items || []);

      let query = `
        MATCH (c:Customer {id: $customerId})
        CREATE (p:Purchase {
          id: $id,
          amount: $amount,
          date: $date,
          items: $items
        })
        CREATE (c)-[:MADE]->(p)
      `;

      const params: Record<string, any> = {
        id, customerId: dto.customerId, amount: dto.amount, date, items: itemsStr,
      };

      if (dto.storeId) {
        query += `
          WITH p
          MATCH (s:Store {id: $storeId})
          CREATE (p)-[:AT]->(s)
        `;
        params.storeId = dto.storeId;
      }

      query += ' RETURN p';

      const result = await session.run(query, params);

      // Award points: 1 point per $1 spent
      await session.run(
        `MATCH (c:Customer {id: $customerId})
         SET c.points = c.points + $points
         CREATE (c)-[:EARNED]->(e:RewardEvent {
           id: $eventId,
           type: 'points-earned',
           date: $date,
           metadata: $metadata
         })
         RETURN c`,
        {
          customerId: dto.customerId,
          points: Math.floor(dto.amount),
          eventId: 'evt_' + Math.random().toString(36).substring(2, 11),
          date,
          metadata: JSON.stringify({ purchaseId: id, amount: dto.amount }),
        }
      );

      // Check tier upgrade
      await this.checkTierUpgrade(session, dto.customerId);

      return result.records[0].get('p').properties;
    } finally {
      await session.close();
    }
  }

  private async checkTierUpgrade(session: Session, customerId: string) {
    const result = await session.run(
      `MATCH (c:Customer {id: $customerId})-[:MADE]->(p:Purchase)
       RETURN sum(p.amount) as totalSpent, c.tier as currentTier`,
      { customerId }
    );

    const totalSpent = result.records[0].get('totalSpent') || 0;
    const currentTier = result.records[0].get('currentTier');

    let newTier = currentTier;
    if (totalSpent >= 5000) newTier = 'VIP';
    else if (totalSpent >= 2000) newTier = 'Gold';
    else if (totalSpent >= 500) newTier = 'Silver';

    if (newTier !== currentTier) {
      await session.run(
        `MATCH (c:Customer {id: $customerId})
         SET c.tier = $newTier
         CREATE (c)-[:TRIGGERED]->(e:RewardEvent {
           id: $eventId,
           type: 'tier-upgrade',
           date: $date,
           metadata: $metadata
         })
         RETURN c`,
        {
          customerId,
          newTier,
          eventId: 'evt_' + Math.random().toString(36).substring(2, 11),
          date: new Date().toISOString(),
          metadata: JSON.stringify({ fromTier: currentTier, toTier: newTier }),
        }
      );
    }
  }

  async findAll(filters: { customerId?: string; storeId?: string }) {
    const session = this.getSession();
    try {
      let query = 'MATCH (p:Purchase)';
      const params: Record<string, any> = {};

      if (filters.customerId) {
        query = 'MATCH (c:Customer {id: $customerId})-[:MADE]->(p:Purchase)';
        params.customerId = filters.customerId;
      } else if (filters.storeId) {
        query = 'MATCH (s:Store {id: $storeId})<-[:AT]-(p:Purchase)';
        params.storeId = filters.storeId;
      }

      query += ' OPTIONAL MATCH (p)-[:AT]->(s:Store)';
      query += ' OPTIONAL MATCH (c:Customer)-[:MADE]->(p)';
      query += ' RETURN p, s.name as storeName, c.name as customerName ORDER BY p.date DESC LIMIT 200';

      const result = await session.run(query, params);
      return result.records.map((r) => ({
        ...r.get('p').properties,
        storeName: r.get('storeName'),
        customerName: r.get('customerName'),
      }));
    } finally {
      await session.close();
    }
  }

  async findOne(id: string) {
    const session = this.getSession();
    try {
      const result = await session.run(
        `MATCH (p:Purchase {id: $id})
         OPTIONAL MATCH (p)-[:AT]->(s:Store)
         OPTIONAL MATCH (c:Customer)-[:MADE]->(p)
         RETURN p, s.name as storeName, c.name as customerName`,
        { id }
      );

      if (!result.records.length) return null;
      const r = result.records[0];
      return {
        ...r.get('p').properties,
        storeName: r.get('storeName'),
        customerName: r.get('customerName'),
      };
    } finally {
      await session.close();
    }
  }
}
