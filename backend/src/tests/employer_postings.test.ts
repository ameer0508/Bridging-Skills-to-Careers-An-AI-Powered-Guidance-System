import './setupEnv.js';
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import CareerService from '../services/CareerService.js';
import EmployerPostingService from '../services/employer/EmployerPostingService.js';
import EmployerPosting from '../models/EmployerPosting.js';
import EmployerProfile from '../models/EmployerProfile.js';
import EmployerPostingReport from '../models/EmployerPostingReport.js';
import MarketPosting from '../models/MarketPosting.js';
import MarketImportBatch from '../models/MarketImportBatch.js';
import { User } from '../models/User.js';
import MarketOpportunityService from '../services/market/MarketOpportunityService.js';
import { EMPLOYER_SUBMISSIONS_SOURCE, activateEmployerSource, getMarketSource } from '../config/marketSources.js';
import { ensureFakeAiService } from './helpers/fakeAiService.js';
import { startHttpHarness } from './helpers/httpHarness.js';

/**
 * First-party employer postings (docs/EMPLOYER_POSTINGS.md). Every organization and posting here
 * is SYNTHETIC TEST DATA created by the test.
 */

const CONSENT = { termsVersion: 'employer-contribution-v1', authorizedToPost: true, realOpening: true, grantsUses: true };
const posting = (extra: Record<string, unknown> = {}) => ({
  title: 'Data Analyst',
  description: 'Build weekly sales dashboards in Excel and Power BI, write SQL against the warehouse and explain the results to the sales team. SYNTHETIC TEST DATA.',
  city: 'Pune',
  state: 'Maharashtra',
  workMode: 'hybrid',
  employmentType: 'full_time',
  salary: { min: 400000, max: 700000, currency: 'INR', period: 'YEAR' },
  skills: ['SQL', 'excel', 'Power BI', 'Wizardry'],
  applyUrl: 'https://careers.example.com/data-analyst',
  ...extra,
});

export async function runEmployerPostingTests() {
  console.log('🧪 Running Employer Postings Tests...');
  await ensureFakeAiService();
  await CareerService.seedInitialTaxonomy();
  const h = await startHttpHarness();
  try {
    const alice = await h.registerUser('employer-alice');
    const bob = await h.registerUser('employer-bob');
    const A = (method: string, path: string, json?: unknown) => h.api(method, path, { token: alice.token, json });
    const B = (method: string, path: string, json?: unknown) => h.api(method, path, { token: bob.token, json });

    // 1. Sign-in, terms, organization
    assert.equal((await h.api('GET', '/employer/terms')).status, 401);
    const terms = (await A('GET', '/employer/terms')).body.data;
    assert.equal(terms.terms.version, 'employer-contribution-v1');
    assert.equal(Object.keys(terms.terms.uses).length, 7);
    assert.match(terms.terms.verification, /does not verify/);
    assert.equal(terms.options.states.length, 36);
    assert.equal((await A('POST', '/employer/postings', posting())).status, 409, 'no organization yet');
    for (const bad of [{ organizationName: 'X' }, { organizationName: 'Example Analytics', website: 'http://example.com' }, { organizationName: 'Example', website: 'javascript:alert(1)' }, { organizationName: 'Example', extra: 1 }]) {
      assert.equal((await A('PUT', '/employer/organization', bad)).status, 400, JSON.stringify(bad));
    }
    const org = (await A('PUT', '/employer/organization', { organizationName: 'Example Analytics <b>Pvt</b> Ltd', website: 'https://www.example.com' })).body.data.organization;
    assert.equal(org.organizationName, 'Example Analytics Pvt Ltd', 'markup is stripped');
    assert.equal(org.emailDomainMatchesWebsite, true, 'the test e-mail is @example.com');
    assert.equal(org.selfDeclared, true);
    console.log('  ✓ Terms list 7 uses and say nothing is verified; organization validated; e-mail domain shown only as a signal');

    // 2. Validation
    const invalid: Array<[string, Record<string, unknown>]> = [
      ['unknown state', { state: 'Atlantis' }],
      ['short description', { description: 'Too short.' }],
      ['dollars', { salary: { min: 400000, max: 700000, currency: 'USD', period: 'YEAR' } }],
      ['below the yearly floor', { salary: { min: 40000, max: 70000, currency: 'INR', period: 'YEAR' } }],
      ['min above max', { salary: { min: 900000, max: 700000, currency: 'INR', period: 'YEAR' } }],
      ['range over 10x', { salary: { min: 100000, max: 1500000, currency: 'INR', period: 'YEAR' } }],
      ['no bound', { salary: { currency: 'INR', period: 'MONTH' } }],
      ['hourly', { salary: { min: 500, max: 900, currency: 'INR', period: 'HOUR' } }],
      ['no skills', { skills: [] }],
      ['only unknown skills', { skills: ['Wizardry'] }],
      ['http apply link', { applyUrl: 'http://example.com/apply' }],
      ['unknown field', { country: 'US' }],
      ['bad employment type', { employmentType: 'gig' }],
    ];
    for (const [label, extra] of invalid) assert.equal((await A('POST', '/employer/postings', posting(extra))).status, 400, label);
    const draft = (await A('POST', '/employer/postings', posting())).body.data.posting;
    assert.equal(draft.status, 'draft');
    assert.deepEqual(draft.skills, ['SQL', 'Excel', 'Power BI'], 'canonical lexicon names');
    assert.deepEqual(draft.unrecognisedSkills, ['Wizardry'], 'unknown skills kept apart, never analysed');
    assert.equal(draft.inMarketData, false);
    console.log(`  ✓ ${invalid.length} invalid postings refused (place, pay bounds and currency, skills, links, fields); skills normalised`);

    // 3. Isolation of drafts
    assert.equal((await B('GET', '/employer/postings')).body.data.postings.length, 0, 'drafts are not listed');
    for (const [method, path] of [['PATCH', `/employer/postings/${draft.id}`], ['DELETE', `/employer/postings/${draft.id}`], ['POST', `/employer/postings/${draft.id}/publish`], ['POST', `/employer/postings/${draft.id}/close`], ['POST', `/employer/postings/${draft.id}/withdraw`]] as const) {
      assert.equal((await B(method, path, method === 'POST' && path.endsWith('publish') ? CONSENT : { description: 'x'.repeat(100) })).status, 404, `bob ${method} ${path}`);
    }
    assert.equal((await A('POST', '/employer/postings/not-an-id/publish', CONSENT)).status, 400);
    console.log("  ✓ Another account cannot see, edit, publish, close, withdraw or delete someone's posting (404)");

    const admin = await h.registerUser('employer-admin');
    await User.updateOne({ _id: admin.userId }, { $set: { role: 'admin' } });
    const ADMIN = (method: string, path: string, json?: unknown) => h.api(method, path, { token: admin.token, json });

    // 4. Publishing needs every consent; the posting is listed at once, but enters the market
    //    records only after an administrator has reviewed the organization's claim
    assert.equal(getMarketSource(EMPLOYER_SUBMISSIONS_SOURCE.id), undefined, 'no source before anything is published');
    for (const partial of [{}, { ...CONSENT, grantsUses: false }, { ...CONSENT, realOpening: false }, { ...CONSENT, termsVersion: 'v0' }]) {
      assert.equal((await A('POST', `/employer/postings/${draft.id}/publish`, partial)).status, 400, JSON.stringify(partial));
    }
    const open = (await A('POST', `/employer/postings/${draft.id}/publish`, CONSENT)).body.data.posting;
    assert.equal(open.status, 'open');
    assert.equal(open.consent.uses.length, 7);
    assert.ok(open.publishedAt && open.expiresAt);
    assert.deepEqual([open.inMarketData, open.marketExclusion], [false, 'organization_awaiting_review']);
    assert.equal(await MarketPosting.countDocuments({ sourceId: EMPLOYER_SUBMISSIONS_SOURCE.id }), 0, 'nothing counts before review');
    assert.equal(getMarketSource(EMPLOYER_SUBMISSIONS_SOURCE.id), undefined, 'no source while nothing has been reviewed');
    assert.equal((await B('GET', '/employer/admin/organizations')).status, 403, 'administrators only');
    // A second account claiming the same name is shown to the reviewer
    await B('PUT', '/employer/organization', { organizationName: 'example analytics pvt ltd' });
    const pending = (await ADMIN('GET', '/employer/admin/organizations?status=pending')).body.data.organizations;
    const aliceOrg = pending.find((o: any) => o.organizationId === alice.userId);
    assert.deepEqual([aliceOrg.otherAccountsWithSameName, aliceOrg.publishedPostings, aliceOrg.emailDomainMatchesWebsite], [1, 1, true]);
    assert.equal((await ADMIN('GET', '/employer/admin/organizations?status=maybe')).status, 400);
    assert.equal((await ADMIN('POST', `/employer/admin/organizations/${alice.userId}/review`, { decision: 'yes' })).status, 400);
    assert.equal((await ADMIN('POST', `/employer/admin/organizations/${new mongoose.Types.ObjectId()}/review`, { decision: 'approve' })).status, 404);
    const reviewed = (await ADMIN('POST', `/employer/admin/organizations/${alice.userId}/review`, { decision: 'approve', note: 'Website and e-mail domain match' })).body.data.organization;
    assert.equal(reviewed.marketReview.status, 'approved');
    assert.ok(getMarketSource(EMPLOYER_SUBMISSIONS_SOURCE.id), 'the channel is a source once a reviewed posting is held');
    const record = await MarketPosting.findOne({ sourceId: EMPLOYER_SUBMISSIONS_SOURCE.id, sourceRecordId: draft.id }).lean();
    assert.ok(record, 'mirrored into the market records');
    assert.deepEqual(
      [record!.dataset, record!.country, record!.company, record!.locationText, record!.salary?.min, record!.salary?.period],
      ['sourced', 'IN', 'Example Analytics Pvt Ltd', 'Pune, Maharashtra', 400000, 'YEAR']
    );
    assert.ok(record!.skills.includes('SQL') && record!.skills.includes('Power BI'));
    assert.ok(!('description' in record!), 'no description in the market records');
    const listed = (await B('GET', '/employer/postings')).body.data;
    assert.equal(listed.postings.length, 1);
    assert.equal(listed.postings[0].organization.selfDeclared, true, 'still self-declared after review');
    assert.equal(listed.postings[0].organization.includedInMarketFigures, true);
    assert.match(listed.disclosure, /self-declared; SkillBridge has not verified/);
    assert.equal((await B('GET', '/employer/postings?skill=SQL')).body.data.postings.length, 1);
    assert.equal((await B('GET', '/employer/postings?skill=Kubernetes')).body.data.postings.length, 0);
    assert.equal((await B('GET', '/employer/postings?state=Kerala')).body.data.postings.length, 0);
    for (const q of ['?skill=Wizardry', '?state=Atlantis', '?sort=salary']) assert.equal((await B('GET', `/employer/postings${q}`)).status, 400, q);
    console.log('  ✓ Publishing needs all four confirmations; the posting is listed with its disclosure and mirrored into market records (no description)');

    // 5. Duplicates and editing
    const again = (await A('POST', '/employer/postings', posting())).body.data.posting;
    assert.equal((await A('POST', `/employer/postings/${again.id}/publish`, CONSENT)).status, 409, 'the same role, place and day again');
    assert.equal((await A('DELETE', `/employer/postings/${again.id}`)).status, 200, 'a draft can be deleted');
    assert.equal((await A('PATCH', `/employer/postings/${draft.id}`, { title: 'Senior Data Analyst' })).status, 400, 'title is fixed once published');
    const edited = (await A('PATCH', `/employer/postings/${draft.id}`, { salary: { min: 500000, max: 800000, currency: 'INR', period: 'YEAR' }, skills: ['SQL', 'Python'] })).body.data.posting;
    assert.deepEqual(edited.skills, ['SQL', 'Python']);
    const updated = await MarketPosting.findOne({ sourceId: EMPLOYER_SUBMISSIONS_SOURCE.id, sourceRecordId: draft.id }).lean();
    assert.equal(updated!.salary?.min, 500000, 'the market record follows the edit');
    assert.ok(updated!.skills.includes('Python'));
    assert.equal(await MarketPosting.countDocuments({ sourceId: EMPLOYER_SUBMISSIONS_SOURCE.id }), 1, 'still one record');
    console.log('  ✓ Duplicates refused; title and place fixed after publishing; pay and skills edits reach the market record');

    // 6. Reports, hiding and moderation
    assert.equal((await A('POST', `/employer/postings/${draft.id}/reports`, { reason: 'misleading' })).status, 409, 'not your own');
    assert.equal((await B('POST', `/employer/postings/${draft.id}/reports`, { reason: 'made-up' })).status, 400);
    assert.equal((await B('POST', `/employer/postings/${draft.id}/reports`, { reason: 'misleading', note: 'Salary seems wrong' })).status, 201);
    assert.equal((await B('POST', `/employer/postings/${draft.id}/reports`, { reason: 'misleading' })).status, 409, 'once per user');
    assert.equal((await B('GET', '/employer/admin/reports')).status, 403, 'administrators only');
    const reporters = [await h.registerUser('r1'), await h.registerUser('r2')];
    let last;
    for (const r of reporters) last = (await h.api('POST', `/employer/postings/${draft.id}/reports`, { token: r.token, json: { reason: 'not_a_real_job' } })).body.data;
    assert.equal(last.hidden, true, 'hidden after three reports');
    assert.equal((await B('GET', '/employer/postings')).body.data.postings.length, 0);
    assert.equal(await MarketPosting.countDocuments({ sourceId: EMPLOYER_SUBMISSIONS_SOURCE.id }), 0, 'removed from market figures while hidden');
    const queue = (await h.api('GET', '/employer/admin/reports', { token: admin.token })).body.data.postings;
    assert.equal(queue.length, 1);
    assert.equal(queue[0].reports, 3);
    const restored = (await h.api('POST', `/employer/admin/postings/${draft.id}/restore`, { token: admin.token })).body.data.posting;
    assert.equal(restored.status, 'open');
    assert.equal(await MarketPosting.countDocuments({ sourceId: EMPLOYER_SUBMISSIONS_SOURCE.id }), 1, 'back in the market records');
    assert.equal(await EmployerPostingReport.countDocuments({ postingId: draft.id }), 0, 'reports cleared on review');
    console.log('  ✓ Reports: not your own, once each, three hide it and remove it from market figures; an administrator restores it');

    // 7. Closing keeps history; withdrawing removes it; expiry closes
    const closed = (await A('POST', `/employer/postings/${draft.id}/close`)).body.data.posting;
    assert.equal(closed.status, 'closed');
    assert.equal((await B('GET', '/employer/postings')).body.data.postings.length, 0);
    const kept = await MarketPosting.findOne({ sourceId: EMPLOYER_SUBMISSIONS_SOURCE.id, sourceRecordId: draft.id }).lean();
    assert.ok(kept && kept.lastSeenAt.toISOString() === closed.closedAt, 'kept as history, last advertised when it closed');
    assert.equal((await A('POST', `/employer/postings/${draft.id}/withdraw`)).body.data.posting.status, 'withdrawn');
    assert.equal(await MarketPosting.countDocuments({ sourceId: EMPLOYER_SUBMISSIONS_SOURCE.id }), 0, 'withdrawal removes it from every figure');
    const second = (await A('POST', '/employer/postings', posting({ title: 'Business Analyst', city: 'Mumbai' }))).body.data.posting;
    await A('POST', `/employer/postings/${second.id}/publish`, CONSENT);
    await EmployerPosting.updateOne({ _id: second.id }, { $set: { expiresAt: new Date(Date.now() - 1000) } });
    assert.equal((await A('GET', '/employer/postings/mine')).body.data.postings.find((p: any) => p.id === second.id).status, 'closed', 'closed after 60 days');
    console.log('  ✓ Closing keeps the record as history; withdrawing removes it everywhere; postings close after 60 days');

    // 8. Into the market figures, with provenance and every minimum still applied
    const orgUsers: Array<{ token: string; userId: string }> = [];
    for (let i = 1; i <= 6; i++) {
      const u = await h.registerUser(`org${i}`);
      orgUsers.push(u);
      await h.api('PUT', '/employer/organization', { token: u.token, json: { organizationName: `Synthetic Employer ${i}` } });
      const p = (await h.api('POST', '/employer/postings', { token: u.token, json: posting({ city: `City ${i}` }) })).body.data.posting;
      await h.api('POST', `/employer/postings/${p.id}/publish`, { token: u.token, json: CONSENT });
      if (i <= 5) await ADMIN('POST', `/employer/admin/organizations/${u.userId}/review`, { decision: 'approve' });
    }
    const month = new Date().toISOString().slice(0, 7);
    const career = { id: new mongoose.Types.ObjectId().toString(), title: 'Data Analyst' };
    const summary = await MarketOpportunityService.summaryForCareer(career, { dataset: 'sourced', from: month, to: month });
    assert.equal(summary.distinctPostings, 5, 'the sixth organization has not been reviewed, so it does not count');
    assert.equal(summary.sources[0].name, EMPLOYER_SUBMISSIONS_SOURCE.name);
    assert.equal(summary.evidenceClass, 'sourced_sparse', 'six postings in one month are still too few');
    assert.deepEqual(summary.insufficientDataReasons, ['too_few_postings', 'too_few_months_with_postings']);
    // Changing a reviewed name is a new claim: out of the figures until reviewed again
    const counted = await MarketPosting.countDocuments({ sourceId: EMPLOYER_SUBMISSIONS_SOURCE.id });
    await h.api('PUT', '/employer/organization', { token: orgUsers[0].token, json: { organizationName: 'Renamed Employer' } });
    assert.equal(await MarketPosting.countDocuments({ sourceId: EMPLOYER_SUBMISSIONS_SOURCE.id }), counted - 1, 'a renamed organization leaves the figures');
    assert.equal((await h.api('GET', '/employer/organization', { token: orgUsers[0].token })).body.data.organization.marketReview.status, 'pending');
    // Rejecting a reviewed organization removes its postings from the figures; the listing stays, labelled
    await ADMIN('POST', `/employer/admin/organizations/${orgUsers[1].userId}/review`, { decision: 'reject', note: 'Website does not exist' });
    assert.equal(await MarketPosting.countDocuments({ sourceId: EMPLOYER_SUBMISSIONS_SOURCE.id }), counted - 2);
    const org2Listing = (await B('GET', '/employer/postings')).body.data.postings.find((x: any) => x.organizationName === 'Synthetic Employer 2');
    assert.equal(org2Listing.organization.includedInMarketFigures, false);
    console.log('  ✓ Only reviewed organizations reach market summaries (named as employer submissions, usual minimums apply); renaming needs a new review; rejection removes them');

    // 9. Daily limit
    const already = await EmployerPosting.countDocuments({ userId: alice.userId });
    for (let i = already; i < 10; i++) assert.equal((await A('POST', '/employer/postings', posting({ title: `Analyst ${i}` }))).status, 201);
    assert.equal((await A('POST', '/employer/postings', posting({ title: 'One too many' }))).status, 429);
    console.log('  ✓ At most 10 new postings a day');

    // 10. Account deletion removes the user's postings from the market records
    const before = await MarketPosting.countDocuments({ sourceId: EMPLOYER_SUBMISSIONS_SOURCE.id });
    const someone = await User.findOne({ email: /^org3\./ }); // still reviewed and counted
    await EmployerPostingService.removeAllForUser(someone!._id.toString());
    assert.equal(await MarketPosting.countDocuments({ sourceId: EMPLOYER_SUBMISSIONS_SOURCE.id }), before - 1);
    console.log('  ✓ Deleting an account removes its postings from the market records');

    // 11. Regression checks for defects found in the 2026-10-14 review ==========================
    const fresh = async (label: string, name: string, approve: boolean) => {
      const u = await h.registerUser(label);
      await h.api('PUT', '/employer/organization', { token: u.token, json: { organizationName: name } });
      if (approve) await ADMIN('POST', `/employer/admin/organizations/${u.userId}/review`, { decision: 'approve' });
      return u;
    };
    const as = (u: { token: string }) => (method: string, path: string, json?: unknown) => h.api(method, path, { token: u.token, json });
    const recordsFor = (id: string) => MarketPosting.countDocuments({ sourceId: EMPLOYER_SUBMISSIONS_SOURCE.id, sourceRecordId: id });

    // a. Bidirectional overrides and zero-width characters cannot disguise a name or title
    const spoof = await fresh('spoof', 'Real\u202eCo\u200b Ltd', false);
    const spoofOrg = (await as(spoof)('GET', '/employer/organization')).body.data.organization;
    assert.equal(spoofOrg.organizationName, 'RealCo Ltd', 'bidi and zero-width characters stripped from the name');
    const spoofPosting = (await as(spoof)('POST', '/employer/postings', posting({ title: 'Data\u2066 Analyst\u2069' }))).body.data.posting;
    assert.equal(spoofPosting.title, 'Data Analyst');

    // b. A rename followed by a new review certifies, and counts, the new name only
    const renamer = await fresh('renamer', 'Old Name Analytics', true);
    const rp = (await as(renamer)('POST', '/employer/postings', posting({ city: 'Nashik' }))).body.data.posting;
    await as(renamer)('POST', `/employer/postings/${rp.id}/publish`, CONSENT);
    assert.equal((await MarketPosting.findOne({ sourceRecordId: rp.id }).lean())?.company, 'Old Name Analytics');
    await as(renamer)('PUT', '/employer/organization', { organizationName: 'New Name Analytics' });
    assert.equal(await recordsFor(rp.id), 0, 'out of the figures after the rename');
    await ADMIN('POST', `/employer/admin/organizations/${renamer.userId}/review`, { decision: 'approve' });
    assert.equal((await MarketPosting.findOne({ sourceRecordId: rp.id }).lean())?.company, 'New Name Analytics', 'counted under the reviewed name, not the old one');
    assert.equal((await as(renamer)('GET', '/employer/postings/mine')).body.data.postings[0].organizationName, 'New Name Analytics');

    // c. Every market record needs a complete, current grant; reconciliation removes anything else
    const granter = await fresh('granter', 'Grant Check Ltd', true);
    const gp = (await as(granter)('POST', '/employer/postings', posting({ city: 'Kochi', state: 'Kerala' }))).body.data.posting;
    await as(granter)('POST', `/employer/postings/${gp.id}/publish`, CONSENT);
    assert.equal(await recordsFor(gp.id), 1);
    await EmployerPosting.updateOne({ _id: gp.id }, { $set: { 'consent.uses': ['display_to_signed_in_users'] } }); // a partial grant
    const repaired = await EmployerPostingService.reconcileMarketRecords();
    assert.ok(repaired.removed >= 1 && (await recordsFor(gp.id)) === 0, 'a record without every derived use is removed');
    await ADMIN('POST', `/employer/admin/organizations/${granter.userId}/review`, { decision: 'approve' });
    assert.equal(await recordsFor(gp.id), 0, 'and an approval does not bring it back');
    await EmployerPosting.updateOne({ _id: gp.id }, { $set: { status: 'withdrawn' } });
    await MarketPosting.create({ dataset: 'sourced', sourceId: EMPLOYER_SUBMISSIONS_SOURCE.id, sourceRecordId: gp.id, fingerprint: `orphan-${gp.id}`, title: 'Data Analyst', company: 'Grant Check Ltd', locationText: 'Kochi, Kerala', country: 'IN', postedAt: new Date(), firstSeenAt: new Date(), lastSeenAt: new Date(), importBatchId: new mongoose.Types.ObjectId() });
    await EmployerPostingService.reconcileMarketRecords();
    assert.equal(await recordsFor(gp.id), 0, 'a record left behind for a withdrawn posting is removed');

    // d. Two simultaneous publishes of one draft: exactly one succeeds
    const racer = await fresh('racer', 'Race Ltd', true);
    const rd = (await as(racer)('POST', '/employer/postings', posting({ city: 'Surat', state: 'Gujarat' }))).body.data.posting;
    const statuses = (await Promise.all([1, 2, 3].map(() => as(racer)('POST', `/employer/postings/${rd.id}/publish`, CONSENT)))).map(r => r.status).sort();
    assert.deepEqual(statuses, [200, 409, 409]);
    assert.equal(await recordsFor(rd.id), 1);

    // e. A withdrawal racing an approval or an edit never leaves the posting in the figures
    for (let i = 0; i < 4; i++) {
      const w = await fresh(`withdrawer${i}`, `Withdraw Race ${i} Ltd`, false);
      const wp = (await as(w)('POST', '/employer/postings', posting({ city: `Race City ${i}` }))).body.data.posting;
      await as(w)('POST', `/employer/postings/${wp.id}/publish`, CONSENT);
      await Promise.all([
        ADMIN('POST', `/employer/admin/organizations/${w.userId}/review`, { decision: 'approve' }),
        as(w)('POST', `/employer/postings/${wp.id}/withdraw`),
        as(w)('PATCH', `/employer/postings/${wp.id}`, { salary: { min: 500000, max: 900000, currency: 'INR', period: 'YEAR' } }),
      ]);
      assert.equal((await EmployerPosting.findById(wp.id).lean())?.status, 'withdrawn');
      assert.equal(await recordsFor(wp.id), 0, `withdrawn posting ${i} is in no figure`);
      assert.equal(await MarketPosting.countDocuments({ 'alsoSeenIn.sourceRecordId': wp.id }), 0);
    }

    // f. Two accounts post the same role under the same name: counted once; withdrawing the first
    //    keeps the second, which was merged into it, in the figures
    const twinA = await fresh('twinA', 'Twin Employer Ltd', true);
    const twinB = await fresh('twinB', 'Twin Employer Ltd', true);
    const ta = (await as(twinA)('POST', '/employer/postings', posting({ city: 'Indore', state: 'Madhya Pradesh' }))).body.data.posting;
    const tb = (await as(twinB)('POST', '/employer/postings', posting({ city: 'Indore', state: 'Madhya Pradesh' }))).body.data.posting;
    await as(twinA)('POST', `/employer/postings/${ta.id}/publish`, CONSENT);
    await as(twinB)('POST', `/employer/postings/${tb.id}/publish`, CONSENT);
    assert.equal(await recordsFor(ta.id), 1);
    assert.equal(await recordsFor(tb.id), 0, 'the same vacancy is counted once');
    assert.equal(await MarketPosting.countDocuments({ 'alsoSeenIn.sourceRecordId': tb.id }), 1);
    await as(twinA)('POST', `/employer/postings/${ta.id}/withdraw`);
    assert.equal(await recordsFor(ta.id), 0);
    assert.equal(await recordsFor(tb.id), 1, "the second account's posting keeps its own record");
    console.log('  ✓ Regressions: spoofing characters stripped; a rename is counted only under the re-reviewed name; partial grants and orphans reconciled away; one of three simultaneous publishes wins; withdrawal beats a racing approval or edit; a merged twin survives the other being withdrawn');
  } finally {
    await EmployerPosting.deleteMany({});
    await EmployerProfile.deleteMany({});
    await EmployerPostingReport.deleteMany({});
    await MarketPosting.deleteMany({ sourceId: EMPLOYER_SUBMISSIONS_SOURCE.id });
    await MarketImportBatch.deleteMany({ sourceId: EMPLOYER_SUBMISSIONS_SOURCE.id });
    activateEmployerSource()(); // leave the process as it was: no employer source
    await h.close();
  }
  console.log('✅ Employer Postings Tests Passed\n');
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  (async () => {
    const mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
    try {
      await runEmployerPostingTests();
    } catch (err) {
      console.error('❌ Employer Postings Test Failed:', err);
      process.exitCode = 1;
    } finally {
      await mongoose.disconnect();
      await mongoServer.stop();
    }
  })();
}
