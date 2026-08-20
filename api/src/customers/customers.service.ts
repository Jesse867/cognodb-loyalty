import { Injectable, Inject } from '@nestjs/common';
import { Driver, Session } from 'neo4j-driver';
import { NEO4J_DRIVER } from '../config/database.module';
import { CreateCustomerDto } from './dto/create-customer.dto';

@Injectable()
export class CustomersService {
  constructor(@Inject(NEO4J_DRIVER) private readonly driver: Driver) {}

  private getSession(): Session {
    return this.driver.session();
  }

  async create(dto: CreateCustomerDto) {
    const session = this.getSession();
    try {
      const id = 'cust_' + Math.random().toString(36).substring(2, 11);
      const joinDate = new Date().toISOString();

      const result = await session.run(
        `CREATE (c:Customer {
          id: $id,
          name: $name,
          email: $email,
          joinDate: $joinDate,
          tier: $tier,
          points: 0
        })
        RETURN c`,
        { id, name: dto.name, email: dto.email, joinDate, tier: dto.tier || 'Bronze' }
      );

      const customer = result.records[0].get('c').properties;

      // If referredBy is provided, create REFERRED relationship
      if (dto.referredBy) {
        await session.run(
          `MATCH (referrer:Customer {id: $referrerId}), (newCustomer:Customer {id: $newId})
           CREATE (referrer)-[:REFERRED {date: $date}]->(newCustomer)
           RETURN referrer`,
          { referrerId: dto.referredBy, newId: id, date: joinDate }
        );
      }

      return customer;
    } finally {
      await session.close();
    }
  }

  async findAll(filters: { tier?: string; search?: string }) {
    const session = this.getSession();
    try {
      let query = 'MATCH (c:Customer)';
      const params: Record<string, any> = {};

      const conditions: string[] = [];
      if (filters.tier) {
        conditions.push('c.tier = $tier');
        params.tier = filters.tier;
      }
      if (filters.search) {
        conditions.push('(c.name CONTAINS $search OR c.email CONTAINS $search)');
        params.search = filters.search;
      }

      if (conditions.length) {
        query += ' WHERE ' + conditions.join(' AND ');
      }

      query += ' RETURN c ORDER BY c.joinDate DESC LIMIT 100';

      const result = await session.run(query, params);
      return result.records.map((r) => r.get('c').properties);
    } finally {
      await session.close();
    }
  }

  async findOne(id: string) {
    const session = this.getSession();
    try {
      const result = await session.run(
        `MATCH (c:Customer {id: $id})
         OPTIONAL MATCH (c)-[:REFERRED]->(ref:Customer)
         OPTIONAL MATCH (c)<-[:REFERRED]-(referredBy:Customer)
         OPTIONAL MATCH (c)-[:MADE]->(p:Purchase)
         RETURN c,
                count(DISTINCT ref) as referralCount,
                referredBy.name as referredByName,
                referredBy.id as referredById,
                sum(p.amount) as totalSpent`,
        { id }
      );

      if (!result.records.length) return null;

      const record = result.records[0];
      return {
        ...record.get('c').properties,
        referralCount: record.get('referralCount').toNumber(),
        referredByName: record.get('referredByName'),
        referredById: record.get('referredById'),
        totalSpent: record.get('totalSpent') || 0,
      };
    } finally {
      await session.close();
    }
  }

  async getNetwork(id: string, depth: number = 2) {
    const session = this.getSession();
    try {
      // Get the referral tree up to N hops
      const result = await session.run(
        `MATCH path = (root:Customer {id: $id})-[:REFERRED*1..${depth}]->(descendant:Customer)
         OPTIONAL MATCH (descendant)-[:MADE]->(p:Purchase)
         RETURN descendant, sum(p.amount) as revenue, length(path) as depth
         ORDER BY depth, revenue DESC`,
        { id }
      );

      return result.records.map((r) => ({
        ...r.get('descendant').properties,
        depth: r.get('depth').toNumber(),
        revenue: r.get('revenue') || 0,
      }));
    } finally {
      await session.close();
    }
  }

  async getPurchases(id: string) {
    const session = this.getSession();
    try {
      const result = await session.run(
        `MATCH (c:Customer {id: $id})-[:MADE]->(p:Purchase)
         OPTIONAL MATCH (p)-[:AT]->(s:Store)
         RETURN p, s.name as storeName
         ORDER BY p.date DESC`,
        { id }
      );

      return result.records.map((r) => ({
        ...r.get('p').properties,
        storeName: r.get('storeName'),
      }));
    } finally {
      await session.close();
    }
  }
}
