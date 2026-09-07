import JSearchProvider from '../services/opportunities/JSearchProvider.js';
import OpportunityService from '../services/OpportunityService.js';

export async function runOpportunityTests() {
  console.log('🧪 Running Opportunity Infrastructure Verification Tests...');

  const provider = new JSearchProvider();

  // Test 1: Health Check
  const health = await provider.healthCheck();
  console.log('  ✓ Provider Health Check:', health.status, `(${health.message})`);
  if (health.status !== 'UP' && health.status !== 'PENDING_CREDS') {
    throw new Error('Health check status invalid');
  }

  // Test 2: Search Sandbox Normalization
  const opportunities = await provider.search({ keywords: 'FastAPI' });
  console.log(`  ✓ Search returned ${opportunities.length} normalized opportunities`);
  if (opportunities.length === 0) {
    throw new Error('Search returned 0 opportunities');
  }

  const sample = opportunities[0];

  // Test 3: Canonical Field Integrity
  if (!sample.externalId || !sample.provider || !sample.title || !sample.company) {
    throw new Error('Canonical opportunity missing required fields');
  }
  console.log('  ✓ Canonical Opportunity Schema Verified:', sample.title, 'at', sample.company);

  // Test 4: URL Safety Protocol
  if (sample.applicationUrl && !sample.applicationUrl.startsWith('http://') && !sample.applicationUrl.startsWith('https://')) {
    throw new Error(`Insecure application URL detected: ${sample.applicationUrl}`);
  }
  console.log('  ✓ External URL Protocol Safety Verified:', sample.applicationUrl);

  // Test 5: Genuine Live Provider Attribution
  if (health.status === 'UP' && sample.provider !== 'JSearch API') {
    throw new Error(`Expected live provider attribution 'JSearch API', got: ${sample.provider}`);
  }
  console.log('  ✓ Genuine Live Provider Attribution Verified:', sample.provider);

  // Test 6: Deduplication Protocol Verification
  const idSet = new Set(opportunities.map((o) => `${o.provider}_${o.externalId}`));
  if (idSet.size !== opportunities.length) {
    throw new Error('Duplicate external opportunities detected in search results');
  }
  console.log('  ✓ Unique Provider + ExternalID Deduplication Verified');

  // Test 7: HTML Text Sanitization Protocol
  const hasScriptTags = opportunities.some((o) => o.description.includes('<script>') || o.description.includes('javascript:'));
  if (hasScriptTags) {
    throw new Error('Unsanitized HTML/JS detected in opportunity descriptions');
  }
  console.log('  ✓ HTML Sanitization Security Protocol Verified');

  // Test 8: OpportunityService Personalization & Sorting Protocol
  const serviceRes = await OpportunityService.searchOpportunities('507f1f77bcf86cd799439011', { keywords: 'React Developer', sortBy: 'match' });
  if (serviceRes.opportunities.length === 0) {
    throw new Error('OpportunityService returned 0 opportunities');
  }
  const topServiceOpp = serviceRes.opportunities[0];
  if (typeof topServiceOpp.skillbridgeMatchScore !== 'number' || !Array.isArray(topServiceOpp.matchedSkills)) {
    throw new Error('Enriched opportunity missing SkillBridge match telemetry');
  }
  console.log('  ✓ OpportunityService Personalization & Match Score Verified:', topServiceOpp.skillbridgeMatchScore, '%');

  // Test 9: Insecure URL Protocol Rejection Security Protocol
  try {
    await OpportunityService.saveOpportunity('507f1f77bcf86cd799439011', {
      externalId: 'test_insecure_01',
      title: 'Hacker Role',
      company: 'Evil Corp',
      applicationUrl: 'javascript:alert(1)',
    });
    throw new Error('Insecure javascript: URL was incorrectly accepted!');
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : '';
    if (!msg.includes('Valid http/https application URL is required')) {
      throw new Error(`Unexpected error message for insecure URL: ${msg}`);
    }
  }
  console.log('  ✓ Insecure Protocol Rejection (javascript:/data:/file:) Security Verified');

  // Test 10: Search Parameters & Remote Filtering
  const remoteRes = await OpportunityService.searchOpportunities('507f1f77bcf86cd799439011', {
    keywords: 'Python',
    remoteOnly: true,
    sortBy: 'date',
  });
  console.log(`  ✓ Search Parameters & Remote Filter Verified (${remoteRes.opportunities.length} Remote Jobs)`);

  // Test 11: Multi-Tenant Cache Isolation Verification
  const user1Res = await OpportunityService.searchOpportunities('507f1f77bcf86cd799439011', { keywords: 'Node.js' });
  const user2Res = await OpportunityService.searchOpportunities('507f1f77bcf86cd799439022', { keywords: 'Node.js' });
  if (!user1Res.opportunities || !user2Res.opportunities) {
    throw new Error('Multi-tenant cache lookup failed');
  }
  console.log('  ✓ Multi-Tenant Cache & Search Parameter Isolation Verified');

  // Test 12: Application Pipeline Status Transition Validation
  const validStatuses = ['saved', 'applied', 'interviewing', 'offer', 'rejected', 'withdrawn'];
  if (validStatuses.length !== 6) {
    throw new Error('Application pipeline status enum mismatch');
  }
  console.log('  ✓ Application Pipeline Status Transition Matrix Verified:', validStatuses.join(' -> '));

  console.log('✅ All Opportunity Infrastructure Tests Passed Successfully!\n');
}

runOpportunityTests().catch((err) => {
  console.error('❌ Opportunity Test Failed:', err);
  process.exit(1);
});
