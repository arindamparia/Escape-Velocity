import { Html } from '../ui/Html'
import { usePage, useTitle } from '../ui/hooks'

/** Resources and sources: where every claim in the plan comes from. */
export default function Sources() {
  useTitle('Sources')
  const page = usePage('library')
  return (
    <div class="page"><div class="slot-main stack">
      <h1>Resources and sources</h1>
      {page ? <Html html={page.resourcesHtml} class="prose prose-wide" /> : <div class="skeleton" style="min-height:20rem" />}
    </div></div>
  )
}
