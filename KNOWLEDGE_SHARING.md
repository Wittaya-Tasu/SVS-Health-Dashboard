# SVS056 Knowledge Sharing

Frontend v0.1.56, based on SVS055 / `0e628d65d98f597ec7e291e29e9a965788a06128`. Backend changes are integrated against verified deployed source v29 and deployed as Apps Script version 30 on 21 October 2026. Production data is imported separately through the authenticated Admin preview/apply flow.

Member names in both SVS and Region organization charts now open a read-only member detail view. A Knowledge Sharing button opens the directory, including historical people who have no login account. Member histories show presentations, recorded audience, annual totals, source locations, and co-presenters. Year and audience-scope filters default to all groups including CPF Swine BU.

## Data and identity

`knowledge-sharing-core.js` derives a member view from schemaVersion 2. Canonical `members` are separate from source speaker aliases and login `Users`. Confirmed identical user IDs combine histories once per presentation. Former members have stable member IDs and `userId: null`; they do not require creating or enabling a login. Team credits remain distinct, including two source teams with the same confirmed display name. Do not merge by display name.

`records` keep original IDs, revisions, raw speaker names, source lineage and nullable audience. `memberIds` and `memberLinks` link confirmed people to presentations. The source `speakerIds`/`speakerLinks` remain available for audit. Audience means recorded person-attendances per presentation; it is not a deduplicated audience. Missing values remain null. Presentation count is not a confirmed unique event count.

No named historical dataset is included in the public frontend. The reviewed data package stays outside this repository.

## Verified current Backend

The user supplied Apps Script project `1e9dhy2RW2LkZNCpAYq13g8fyUYPQwL0DC02f_vw7T8vMEMlDfe4VRACP`. Manage deployments identifies the production `/exec` deployment `AKfycbxa1qr-gzpA_XHbLf7AJaJTzxe2yWgx37dqXaedn2EvArsN7gW7xC_k9kUmvcvmclJ3` as version **29**, dated 9 October 2026 19:01 in the UI. All 28 files were read from both editor HEAD and Project history Version 29; their contents match after newline normalization. Captures, hashes and a complete working copy remain in the private workspace `backend-current/`, outside this public repository. No online source or deployment was modified.

The repository's legacy `backend/Code.gs` has not been substituted for the deployed source. **Do not deploy the repository backend directory wholesale.** `qa/build-knowledge-backend.cjs` applies two exact integration edits to captured current `Code.gs`: add an authenticated `knowledgeSharing` dispatch case and bootstrap capability fields. All other current Backend files are preserved. The new `backend/KnowledgeSharing001.gs` depends on current `session`, `admin`, `rows`, `book`, `audit`, `check`, and the existing script lock/migration guards.

## Read/import contract

The bridge calls the existing authenticated `api()` wrapper with action `knowledgeSharing`, `op: read` only if bootstrap settings advertise `knowledgeSharingProtocol: 1`. Backend must advertise that flag only after its authenticated read endpoint and authorized data are ready. The response uses the normal `{ok, data}` wrapper, where `data` has schemaVersion 2, `members`, `records`, `reviewItems`, source aliases and links. Member records require `id`, `displayName`, `kind`, nullable `userId`, `membershipStatus`, `sourceNames` and optional `sourceScope`. Presentation records require the schema fields consumed by the core/UI, including `memberIds`, source fields, year, month, dates, audience, categories, channel, reach and audienceGroup.

The Backend must enforce session and record visibility, resolve roles from server-side Users, and return only fields the viewer may access. The browser does not authorize access using a supplied member ID. A linked member uses `team.userId`, never `team.id`, to match historical data. Missing capability displays an unavailable message without sending unsupported actions or reporting zero historical activity. Unmatched IDs and read errors remain visible. Responses arriving after navigation cannot overwrite another view. Auth tokens and session data are not cached by this component.

The optional Admin initial-import page loads JSON from a local file, sends `previewImport`, and shows server-validated totals. `applyImport` requires the preview's batch ID/hash/base snapshot plus a checked confirmation. No file selection, page load or preview writes data. This page appears only for Admin when bootstrap advertises `knowledgeSharingImportProtocol: 1`; the server independently resolves current roles from Users. Read capability stays zero until a committed snapshot exists. Non-Admin imports, inactive sessions and forged client roles are rejected server-side.

## Import preparation

The importer uses dedicated `KnowledgeSharingRows001` and `KnowledgeSharingBatches001` tables. It never edits Farms, farm Records, costs, assignments, files or Users. It revalidates user ID/name pairs, source IDs, revisions, alias membership, link completeness, dates, audiences and review counts. Former people remain independent of login accounts.

The initial importer writes an immutable snapshot, preserving imported IDs/revisions, and rejects replacement of an active snapshot by a changed dataset. This deliberately prevents silent history overwrite; future editing/version upgrades require a separate reviewed operation. Apply requires the current base snapshot and confirmed server hash. Same batch/hash is a no-op; reused batch ID with changed content fails.

Publication uses STAGING -> persisted rows -> verified row hashes -> deduplicated audit -> COMMITTED receipt -> active pointer. Reads ignore staging. Recovery reuses matching staging rows and preserves their ordinals; it never overwrites conflicting staging data. An interrupted write can leave blank physical sheet rows, which do not represent business records. Receipt/hash validation prevents partial or corrupt reads. No active pointer is set until the complete batch and audit are durable. Pre-existing conflicting table headers fail before creation or overwrite.

Source duplicates, unknown dates and audience remain pending until separately confirmed. Aliases resolved by the returned workbook are retained in audit. Do not run historical migrations or infer event audience from sums/maxima.

## Validation

`node --test tests/knowledge-sharing.test.cjs` covers historical identity, alias/co-presenter totals, pending review and referential validation using synthetic data. Workspace QA tests the real reviewed dataset plus the complete captured current Backend in a Node VM with in-memory Google services. The 14 Backend tests cover preview zero-writes, source-preserving apply/read, replay, hash conflict, stale base, active-snapshot protection, real session/role/migration guards, malformed input, conflicting headers, interrupted storage headers/rows/audit/receipt/pointer, and corrupt reads.

Browser QA runs the actual SVS index and component against that Backend harness. It verifies JSON selection -> read-only preview -> checked confirmation -> apply -> member read, no-write replay, preview invalidation and hidden non-Admin import controls, alongside member history/navigation/filter/mobile checks. Existing SVS055 regression and report layout suites pass against this frontend. These are local/mock results: actual Google Sheets writes, production OAuth, deployed API and production import have not been tested. The existing app header has a 22px overflow at 390px; the Knowledge Sharing content itself stays within its page.
