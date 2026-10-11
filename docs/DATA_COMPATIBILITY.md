# Data compatibility with databases created before the model repair

The backend's Mongoose models were rewritten during finalization because the previous
schemas did not match the services using them. A database created with the old schemas
(for example the embedded development database in `backend/data/local_db`) can therefore
hold documents in shapes the current code does not read.

Nothing is migrated automatically. The application never rewrites or deletes old-format
documents on startup, and no one is forced to re-register.

## What is and is not affected

| Data | Status with the current code | Action |
|---|---|---|
| Accounts (`users`), refresh tokens | Compatible | None |
| Resume files and upload records (`resumes`) | Compatible when the user id was stored as an ObjectId; old string ids need converting | Migration script |
| Saved jobs and application status (`savedopportunities`) | Old records stored the user id as a string and lacked `provider` / `applicationUrl`, so they are invisible to their owner | Migration script |
| Chat conversations (`conversations`, `conversationmessages`) | Old records stored the user id as a string and used `sender` / `text` | Migration script |
| Interview sessions (`interviewsessions`) | Compatible; sessions whose answers were never persisted stay unanswered | Migration script only for string user ids |
| Skills, matches, readiness, gaps, recommendations, roadmaps, analytics snapshots | Derived data. Old-format documents are ignored | Recomputed automatically (see below); nothing to migrate |
| Career taxonomy (`careers`, `careerrequirements`) | Missing careers and requirements are added on startup; existing ones are never changed or removed | None |

Derived data is rebuilt from the stored parsed resume the next time a resume is uploaded or
replaced. Matches, readiness and recommendations are also recomputed on demand the first
time their page is opened and no current-format record exists.

## The migration script

`backend/src/scripts/migrateLegacyData.ts`

- **Report only by default.** Without `--apply` it prints how many records it would change
  and writes nothing.
- **Non-destructive.** It converts string ids to ObjectIds (same value, correct type) and
  copies old fields into the new ones (`url` to `applicationUrl`, `sender`/`text` to
  `role`/`content`). It never deletes a document, never drops a collection or index, never
  overwrites a field that already has a value, and keeps the old fields in place.
- **Idempotent.** A second run changes nothing.
- **Private.** Output is counts per collection only.
- **Tested.** `backend/src/tests/legacy_migration.test.ts` inserts old-shape documents with
  the raw driver and checks all of the properties above.

### Procedure

1. Stop the backend (the embedded development database can only be opened by one process).
2. Take a copy of `backend/data/local_db` (file copy of the folder). This is the rollback:
   restoring the folder restores the exact previous state.
3. Report: `pnpm --filter backend migrate:legacy`
4. Review the counts. If they look right, apply: `pnpm --filter backend migrate:legacy -- --apply`
5. Start the backend and confirm saved jobs and conversations are visible again.

For a real MongoDB server add `--uri <connection string>` and use `mongodump` for step 2.

## Accounts in the old `users_backup.json` mirror

Earlier versions wrote every account, including its password hash, to
`backend/data/users_backup.json` and re-created missing accounts from it at login. That
behaviour has been removed: the application no longer reads or writes the file.

The existing file has been left in place and untouched. It contains password hashes, so:

- keep it out of version control (it already is, via `.gitignore`) and out of any shared folder;
- delete it yourself once you have confirmed you do not need it. The application will not do so.

It also contains accounts created by earlier test runs, which used to write to this same file.
Tests can no longer touch it: they run against a throwaway in-memory database with temporary
upload and log directories, and the test runner fails if the file, the local database folder
or the uploads folder change during a run.

If an account exists in that file but not in the database, it can be recovered explicitly:

1. Stop the backend.
2. Report: `pnpm --filter backend restore:users`
3. Apply: `pnpm --filter backend restore:users -- --apply`

The script only inserts accounts whose email is absent, never modifies existing accounts,
keeps the original account id so previously stored data stays linked, and prints counts only.
Review the report first: because of the test-run entries, the number of restorable accounts
may be larger than the number of real users.
