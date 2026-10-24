# Agent instructions

Read `SKILL.md` first. The scope in it is binding.

- Build only what `SKILL.md` lists as in scope. Do not add features, pages, endpoints, storage, auth or new libraries on your own initiative.
- Make the smallest change that solves the request. Do not refactor, rename or reformat unrelated code.
- Keep the Loader → Answerer → Verifier separation, and keep the verifier in plain code.
- Never put API keys in code, logs or commits.
- If a request is ambiguous or outside scope, ask before building.
- Before finishing, run the checks in the "Verify before saying done" section of `SKILL.md`.
