import { Injectable, Inject } from '@nestjs/common';
import { Driver, Session } from 'neo4j-driver';
import { NEO4J_DRIVER } from '../config/database.module';
import { CreateStoreDto } from './dto/create-store.dto';

@Injectable()
export class StoresService {
  constructor(@Inject(NEO4J_DRIVER) private readonly driver: Driver) {}

  private getSession(): Session {
    return this.driver.session();
  }

  async create(dto: CreateStoreDto) {
    const session = this.getSession();
    try {
      const id = 'store_' + Math.random().toString(36).substring(2, 11);
      const result = await session.run(
        `CREATE (s:Store {
          id: $id,
          name: $name,
          location: $location
        })
        RETURN s`,
        { id, name: dto.name, location: dto.location }
      );
      return result.records[0].get('s').properties;
    } finally {
      await session.close();
    }
  }

  async findAll() {
    const session = this.getSession();
    try {
      const result = await session.run(
        `MATCH (s:Store)
         OPTIONAL MATCH (s)<-[:AT]-(p:Purchase)
         RETURN s, count(p) as purchaseCount, sum(p.amount) as totalRevenue
         ORDER BY totalRevenue DESC`
      );
      return result.records.map((r) => ({
        ...r.get('s').properties,
        purchaseCount: r.get('purchaseCount').toNumber(),
        totalRevenue: r.get('totalRevenue') || 0,
      }));
    } finally {
      await session.close();
    }
  }

  async findOne(id: string) {
    const session = this.getSession();
    try {
      const result = await session.run(
        `MATCH (s:Store {id: $id})
         OPTIONAL MATCH (s)<-[:AT]-(p:Purchase)
         OPTIONAL MATCH (c:Customer)-[:MADE]->(p)
         RETURN s,
                count(DISTINCT p) as purchaseCount,
                sum(p.amount) as totalRevenue,
                count(DISTINCT c) as uniqueCustomers`,
        { id }
      );
      if (!result.records.length) return null;
      const r = result.records[0];
      return {
        ...r.get('s').properties,
        purchaseCount: r.get('purchaseCount').toNumber(),
        totalRevenue: r.get('totalRevenue') || 0,
        uniqueCustomers: r.get('uniqueCustomers').toNumber(),
      };
    } finally {
      await session.close();
    }
  }

  async getAnalytics(id: string) {
    const session = this.getSession();
    try {
      // Top customers by spend at this store
      const topCustomers = await session.run(
        `MATCH (s:Store {id: $id})<-[:AT]-(p:Purchase)<-[:MADE]-(c:Customer)
         RETURN c.id as id, c.name as name, c.tier as tier, sum(p.amount) as totalSpent
         ORDER BY totalSpent DESC
         LIMIT 10`,
        { id }
      );

      // Referral influence at this store (customers who referred others who bought here)
      const referralInfluence = await session.run(
        `MATCH (s:Store {id: $id})<-[:AT]-(p:Purchase)<-[:MADE]-(buyer:Customer)
         MATCH (referrer:Customer)-[:REFERRED*1..]->(buyer)
         RETURN referrer.id as id, referrer.name as name, count(DISTINCT buyer) as influencedBuyers, sum(p.amount) as influencedRevenue
         ORDER BY influencedRevenue DESC
         LIMIT 10`,
        { id }
      );

      return {
        topCustomers: topCustomers.records.map((r) => ({
          id: r.get('id'),
          name: r.get('name'),
          tier: r.get('tier'),
          totalSpent: r.get('totalSpent'),
        })),
        referralInfluence: referralInfluence.records.map((r) => ({
          id: r.get('id'),
          name: r.get('name'),
          influencedBuyers: r.get('influencedBuyers').toNumber(),
          influencedRevenue: r.get('influencedRevenue'),
        })),
      };
    } finally {
      await session.close();
    }
  }
}
