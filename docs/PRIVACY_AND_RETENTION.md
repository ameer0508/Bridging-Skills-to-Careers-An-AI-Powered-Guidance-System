# Privacy, retention and deletion (X12), 2026-10-13

What SkillBridge stores about a person, where, for how long, and how it is removed. Everything is in the deployment's own MongoDB and local volumes. No third-party storage, analytics or paid service is used.

## What is stored and for how long

| Data | Where | Kept until |
|---|---|---|
| Account (name, e-mail, password hash, role, preferences) | MongoDB `users` | the account is deleted |
| Resume file | backend volume `uploads/<user>/` | replaced (the old file is removed at once), the resume is deleted, or the account is deleted |
| Parsed resume, skills, matches, readiness, roadmaps, recommendations, history | MongoDB | replaced on recalculation, or the account is deleted |
| Portfolio entries and the public share link | MongoDB | removed by the user, or the account is deleted. The link is off by default and shows shared entries only |
| Exam attempts and study plans; resume-language analyses (with the original lines) | MongoDB | removed by the user (analyses), or the account is deleted |
| Interview sessions and answers | MongoDB | the account is deleted |
| Interview **recordings** | backend volume `voice-recordings/` | the user's choice: end of the round, 7 or 30 days. Withdrawing consent deletes all of them. The daily job removes expired files and retries failed deletions |
| Chat conversations and messages | MongoDB | the account is deleted |
| Refresh tokens | MongoDB | expiry (TTL index), sign-out, or the account is deleted |
| AI audit log (codes and timings only: no prompts, resume text, messages or keys) | AI volume `ai-storage/ai-audit/` | 14 days by default (`AI_AUDIT_RETENTION_DAYS`, at most 90). Files are owner-only |
| AI response cache | AI service memory | 1 hour; never written to disk; lost on restart |
| Server logs (request path, status, client IP, account ids in paths, error traces) | backend volume `logs/` | **bounded**: each file rotates at 10 MB (`LOG_MAX_FILE_MB`) and 5 files are kept (`LOG_MAX_FILES`). Logs hold no resume text, answers or passwords. An unexpected error's message is logged, not returned to the client |
| Market import batches | MongoDB | kept as provenance. They hold the importing administrator's account id |

## Deleting an account

`DELETE /api/v1/users/me` needs the password and the word `DELETE`. It is also available in **Settings → Delete account**. It removes:
- the resume files and the recordings;
- the chat messages, through their conversations;
- every document in **every collection that has a `userId` field**, found from the registered models, so a new collection is included automatically;
- the account itself.

**Recordings that resist deletion.** A recording whose file cannot be removed keeps its record, marked for deletion, and the retention job keeps retrying.

**Tokens.** The account's id is revoked at once in the running process, so an access token issued before deletion is refused and cannot create new data.

**Test: `account_deletion.test.ts`.**
- Data is created in 28 collections, plus resume files and a recording.
- Without the password and the confirmation, nothing is deleted.
- After deletion, **no collection refers to the account and no file remains**.
- The old token is refused, even for creating data.
- Another user's data is unchanged.

**Browser:** `accessibility.mjs`, final step. A wrong password is explained; deletion signs the user out; signing in again is refused.

## Hardening already in place, tested elsewhere

- Every non-public route needs a valid token, and objects are scoped to their owner. Administrator rights are checked in the database on each request. See `docs/SECURITY_REVIEW.md`.
- Upload content is checked by its bytes, not only by its name. File names are stored as base names only.
- The zero-cost policy blocks paid providers even when their keys are present.
- Containers run as non-root users. Volumes for uploads, recordings and the AI audit log are private.

## Limits

- **Token revocation is per process.** With several backend instances, a deleted account's access token could keep working on the other instances until it expires (15 minutes by default).
- **Backups and logs.** Logs already written, and any database backups an operator takes, may still contain the account's id or IP addresses until they rotate out or the backup is removed. SkillBridge cannot reach copies outside its volumes.
- **No export.** There is no self-service data export yet; the resume file can be downloaded.
