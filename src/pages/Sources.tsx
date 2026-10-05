import { Html } from '../ui/Html'
import { StudyLinks } from '../ui/StudyLinks'
import { usePage, useTitle } from '../ui/hooks'

/** Study links and sources: every link in the plan, and where each claim comes from. */
export default function Sources() {
  useTitle('Study links and sources')
  const page = usePage('library')
  return (
    <div class="page"><div class="slot-main stack">
      <header>
        <p class="eyebrow">Library</p>
        <h1>Study links</h1>
        {page ? <p class="muted" style="margin:0"><Html html={page.studyIntroHtml} inline class="" /> Each task has these under “Study”; each design has its own in the <a href="/library">library</a>.</p> : null}
      </header>
      <StudyLinks />
    </div></div>
  )
}
