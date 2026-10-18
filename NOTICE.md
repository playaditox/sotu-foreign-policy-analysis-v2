# Attribution and generated assets

Juan Francisco Fernández's original analysis code, codebook, analytical presentation, and documentation are covered by the project license. AI assistance is described in the README and validation records.

Presidential transcripts and archive metadata are attributed to the American Presidency Project. Comparative policy-topic data are attributed to the Policy Agendas Project / Comparative Agendas Project. Historical-event records retain their individual source links. These upstream materials retain their applicable terms; this repository does not relicense them as original project work.

The `portfolio` directory includes copied Data app presentation infrastructure supplied with the Data Analytics plugin. Protected runtime files, bundled dependencies, and their attribution remain intact. Authored project content lives in `portfolio/src/content/report`, reviewed rows in `portfolio/src/data.json`, and theme choices in `portfolio/src/theme.css`. Copied infrastructure is marked as vendored in `.gitattributes` so repository language statistics do not present it as original analysis code.

Compiled report files and chart exports are generated from the reviewed snapshot. The local single-file offline report is excluded from Git to avoid duplicating the full dataset; it can be distributed as a release asset separately. The split `portfolio/release` build is the GitHub Pages publication source.
