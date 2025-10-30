/**
 * Database Optimization Script
 * 
 * Adds missing indexes and optimizes query performance
 * Run with: npx ts-node scripts/optimize-database.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔧 Starting database optimization...\n');

  try {
    // Create indexes for better query performance
    console.log('📊 Creating indexes...');

    // Variables table indexes
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS idx_variables_key 
      ON variables(key);
    `;
    console.log('✅ Created index on variables(key)');

    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS idx_variables_environment_key 
      ON variables(environment_id, key);
    `;
    console.log('✅ Created composite index on variables(environment_id, key)');

    // Audit logs indexes
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS idx_audit_logs_action_time 
      ON audit_logs(action, created_at DESC);
    `;
    console.log('✅ Created index on audit_logs(action, created_at)');

    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS idx_audit_logs_user_time 
      ON audit_logs(user_id, created_at DESC);
    `;
    console.log('✅ Created index on audit_logs(user_id, created_at)');

    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS idx_audit_logs_entity 
      ON audit_logs(entity_type, entity_id);
    `;
    console.log('✅ Created index on audit_logs(entity_type, entity_id)');

    // Variable history indexes
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS idx_variable_history_var_time 
      ON variable_history(variable_id, created_at DESC);
    `;
    console.log('✅ Created index on variable_history(variable_id, created_at)');

    // API tokens indexes
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS idx_api_tokens_expires 
      ON api_tokens(expires_at) WHERE expires_at IS NOT NULL;
    `;
    console.log('✅ Created partial index on api_tokens(expires_at)');

    // Project members indexes
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS idx_project_members_role 
      ON project_members(role);
    `;
    console.log('✅ Created index on project_members(role)');

    console.log('\n📊 Analyzing tables for optimization...');

    // Analyze tables (PostgreSQL specific)
    await prisma.$executeRaw`ANALYZE variables;`;
    await prisma.$executeRaw`ANALYZE audit_logs;`;
    await prisma.$executeRaw`ANALYZE variable_history;`;
    await prisma.$executeRaw`ANALYZE projects;`;
    await prisma.$executeRaw`ANALYZE environments;`;
    
    console.log('✅ Tables analyzed');

    console.log('\n📈 Gathering statistics...');

    // Get table sizes
    const tableSizes = await prisma.$queryRaw<Array<{ table_name: string; size: string }>>`
      SELECT 
        schemaname || '.' || tablename AS table_name,
        pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
      FROM pg_tables 
      WHERE schemaname = 'public'
      ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
    `;

    console.log('\n📦 Table Sizes:');
    tableSizes.forEach(row => {
      console.log(`  ${row.table_name}: ${row.size}`);
    });

    // Get index information
    const indexes = await prisma.$queryRaw<Array<{ table: string; index: string; size: string }>>`
      SELECT 
        schemaname || '.' || tablename AS table,
        indexname AS index,
        pg_size_pretty(pg_relation_size(indexrelid)) AS size
      FROM pg_indexes
      JOIN pg_class ON pg_indexes.indexname = pg_class.relname
      WHERE schemaname = 'public'
      ORDER BY pg_relation_size(indexrelid) DESC;
    `;

    console.log('\n🔍 Indexes:');
    indexes.slice(0, 10).forEach(row => {
      console.log(`  ${row.table}.${row.index}: ${row.size}`);
    });

    console.log('\n✅ Database optimization complete!');
    console.log('\n💡 Recommendations:');
    console.log('  - Run VACUUM ANALYZE periodically to reclaim space');
    console.log('  - Monitor slow queries with pg_stat_statements');
    console.log('  - Consider connection pooling (PgBouncer) for production');
    console.log('  - Archive old audit logs if table grows too large\n');

  } catch (error) {
    console.error('❌ Error optimizing database:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
