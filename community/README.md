# StellCoilBench community leaderboard preview

A static, bilingual preview covering **all ten surfaces** and **two reference cohorts**. The three-surface agent comparison is a separate page, not the scope of the design leaderboard.

Open locally from this directory:

```sh
python -m http.server 8765 --bind 127.0.0.1
```

Visit http://127.0.0.1:8765. There are no package dependencies, external fonts, API keys, analytics, or remote model calls. The page requires HTTP to load its packaged JSON; opening `index.html` as `file://` is not supported.

![Desktop preview](preview.png)

## Included

- Ten surfaces in each of the current and historical **reference** cohorts; retained designs may originate from a historical recipe when paired physics is compatible. These are not two isolated original-agent campaigns.
- Composite score, field error, hard eligibility and soft-target counts, plus a separate all-soft candidate selection.
- Strict paired-comparison checks: complete hard PASS, matching protocol hash, grid, cohort and surface. Missing/incompatible references never become a zero-score win.
- 48 curated design records and 33 sanitized scientific evidence summaries. Original report hashes remain attached. This is a curated research snapshot, not exhaustive ranking of every public geometry.
- Ten manuscript arms from a completed 24-opportunity agent experiment on QA/QH/W7-X, with declared prior-information asymmetry. Historical design results and controlled-search outcomes stay separate.
- Local JSON manifest structure validation and an example manifest. This does **not** upload artifacts, run the scientific evaluator, check actual file content hashes, or submit to a leaderboard. Placeholder hashes in the example are not real scientific provenance.
- Chinese/English navigation, search, cohort switching, candidate details, data download, and mobile layouts.

## Scientific scope

The evaluator and thresholds remain those of upstream StellCoilBench. The snapshot combines complete paired 64/128 evaluations and selected independent fresh128 confirmations. Grids and exact protocol hashes are exposed per record. Current Schuett lacks a matched physical configuration; rotating-ellipse references are hard-ineligible. Their rows remain visible without a win claim.

The QA all-soft candidate comes from **fixed search**, not our agent, and has a different evaluation protocol from the current design reference. It is shown with its origin and without a cross-protocol score delta. Latest warm-start designs are not copied into historical-reference comparisons without matching paired evidence.

The 24-opportunity experiment is one controller trajectory. The official-policy adapter has additional complete-baseline advice. Equal solver caps do not imply equal actual runtime, tokens, model requests, or end-to-end cost. ScienceEvolve is a fixed-runtime substitution condition, not a test of unrestricted workflow evolution.

These are research re-evaluations, not accepted official leaderboard submissions. The original upstream leaderboard is https://stellcoilbench.readthedocs.io/en/latest/leaderboard/surface_specific.html. Public intake, hosting and a shared evaluation protocol remain proposals for collaboration with the original author.

## Checks

```sh
node --test
```

The model tests guard scientific compatibility, missing-result handling, evidence URL restrictions and manifest validation. `data/snapshot-manifest.json` records SHA256 of the packaged datasets/evidence for independent inspection.

## Attribution

Based on [StellCoilBench](https://github.com/akaptano/stellcoilbench) by its original authors, under the repository's MIT license. This community UI and curated snapshot are additional work in a fork; they do not imply author endorsement or transfer of official maintenance.
