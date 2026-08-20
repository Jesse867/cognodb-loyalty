import { Injectable, Inject } from '@nestjs/common';
import { Driver, Session } from 'neo4j-driver';
import { NEO4J_DRIVER } from '../config/database.module';

@Injectable()
export class ReferralsService {
  constructor(@Inject(NEO4J_DRIVER) private readonly driver: Driver) {}

  private getSession(): Session {
    return this.driver.session();
  }

  /**
   * Referral ROI Leaderboard
   * Which customers' referral trees generated the most revenue?
   * This is the killer graph query — recursive aggregation over a tree.
   */
  async getLeaderboard(limit: number = 10) {
    const session = this.getSession();
    try {
      const result = await session.run(
        `MATCH (referrer:Customer)-[:REFERRED*1..]->(ref:Customer)-[:MADE]->(p:Purchase)
         RETURN referrer.id as id,
                referrer.name as name,
                referrer.tier as tier,
                count(DISTINCT ref) as referrals,
                sum(p.amount) as generatedRevenue,
                count(p) as purchaseCount
         ORDER BY generatedRevenue DESC
         LIMIT $limit`,
        { limit }
      );

      return result.records.map((r) => ({
        id: r.get('id'),
        name: r.get('name'),
        tier: r.get('tier'),
        referrals: r.get('referrals').toNumber(),
        generatedRevenue: r.get('generatedRevenue'),
        purchaseCount: r.get('purchaseCount').toNumber(),
      }));
    } finally {
      await session.close();
    }
  }

  /**
   * Longest referral chain in the entire graph.
   * Awkward in SQL (recursive CTE with cycle detection), trivial in Cypher.
   */
  async getLongestChain() {
    const session = this.getSession();
    try {
      const result = await session.run(
        `MATCH path = (c:Customer)-[:REFERRED*]->(leaf:Customer)
         WHERE NOT (leaf)-[:REFERRED]->()
         RETURN c.id as rootId,
                c.name as rootName,
                length(path) as chainLength,
                [n IN nodes(path) | {id: n.id, name: n.name, tier: n.tier}] as chain
         ORDER BY chainLength DESC
         LIMIT 1`
      );

      if (!result.records.length) return null;

      const r = result.records[0];
      return {
        rootId: r.get('rootId'),
        rootName: r.get('rootName'),
        chainLength: r.get('chainLength').toNumber(),
        chain: r.get('chain'),
      };
    } finally {
      await session.close();
    }
  }

  /**
   * All customers within N referral hops of any VIP.
   * Multi-hop traversal — the bread and butter of graph queries.
   */
  async getVipNetwork(depth: number = 2) {
    const session = this.getSession();
    try {
      const result = await session.run(
        `MATCH (vip:Customer {tier: 'VIP'})-[:REFERRED*1..${depth}]->(c:Customer)
         WHERE c <> vip
         RETURN DISTINCT c.id as id,
                c.name as name,
                c.email as email,
                c.tier as tier,
                vip.name as vipName,
                vip.id as vipId
         ORDER BY c.name
         LIMIT 100`
      );

      return result.records.map((r) => ({
        id: r.get('id'),
        name: r.get('name'),
        email: r.get('email'),
        tier: r.get('tier'),
        vipName: r.get('vipName'),
        vipId: r.get('vipId'),
      }));
    } finally {
      await session.close();
    }
  }

  /**
   * Total transitive revenue through a customer's entire referral tree.
   * The single best argument for using a graph database.
   */
  async getTreeRevenue(customerId: string) {
    const session = this.getSession();
    try {
      const result = await session.run(
        `MATCH (root:Customer {id: $customerId})
         OPTIONAL MATCH (root)-[:REFERRED*0..]->(descendant:Customer)-[:MADE]->(p:Purchase)
         RETURN root.name as rootName,
                root.tier as rootTier,
                count(DISTINCT descendant) as treeSize,
                sum(p.amount) as totalRevenue,
                count(p) as totalPurchases`,
        { customerId }
      );

      const r = result.records[0];
      return {
        rootId: customerId,
        rootName: r.get('rootName'),
        rootTier: r.get('rootTier'),
        treeSize: r.get('treeSize').toNumber(),
        totalRevenue: r.get('totalRevenue') || 0,
        totalPurchases: r.get('totalPurchases').toNumber(),
      };
    } finally {
      await session.close();
    }
  }

  /**
   * Get graph data for D3 force-directed visualization.
   * Returns nodes and links in a format ready for D3.
   */
  async getGraphData(customerId: string, depth: number = 3) {
    const session = this.getSession();
    try {
      const nodesResult = await session.run(
        `MATCH path = (root:Customer {id: $customerId})-[:REFERRED*0..${depth}]->(c:Customer)
         RETURN DISTINCT c.id as id, c.name as name, c.tier as tier, c.points as points,
                CASE WHEN c.id = $customerId THEN 'root' ELSE 'descendant' END as role`,
        { customerId }
      );

      const linksResult = await session.run(
        `MATCH (root:Customer {id: $customerId})-[:REFERRED*0..${depth}]->(c:Customer)
         MATCH (c)-[:REFERRED]->(child:Customer)
         WHERE child.id IN [n IN nodes(path) | n.id]
         RETURN c.id as source, child.id as target`,
        { customerId }
      );

      const nodes = nodesResult.records.map((r) => ({
        id: r.get('id'),
        name: r.get('name'),
        tier: r.get('tier'),
        points: r.get('points'),
        role: r.get('role'),
      }));

      const links = linksResult.records.map((r) => ({
        source: r.get('source'),
        target: r.get('target'),
      }));

      return { nodes, links };
    } finally {
      await session.close();
    }
  }
}
