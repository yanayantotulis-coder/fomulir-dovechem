<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Rules
- The official Word template (`src/assets/formulir-dover-template.docx`) is the single source of truth for every download: each candidate field needs a matching `{{token}}`, and extra table rows are cloned by `expandTemplateRows` in `src/lib/exporters.ts` — never hardcode form layout in the exporters, because Word/PDF/Excel all render from that template.
