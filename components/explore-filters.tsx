import { Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { TASK_CATEGORIES } from '@/lib/domain'

export function ExploreFilters({
  query = '',
  category = 'all',
}: {
  query?: string
  category?: string
}) {
  return (
    <form action="/explore" method="get" role="search">
      <FieldGroup className="grid grid-cols-1 items-end gap-3 sm:grid-cols-[minmax(0,1fr)_12rem_auto]">
        <Field>
          <FieldLabel htmlFor="q">Search open checks</FieldLabel>
          <Input id="q" name="q" defaultValue={query} maxLength={100} placeholder="Try a neighborhood or task" />
        </Field>
        <Field>
          <FieldLabel htmlFor="category">Category</FieldLabel>
          <select
            id="category"
            name="category"
            defaultValue={category}
            className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <option value="all">All categories</option>
            {TASK_CATEGORIES.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </Field>
        <Button type="submit" className="w-full sm:w-auto">
          <Search aria-hidden="true" data-icon="inline-start" />
          Search
        </Button>
      </FieldGroup>
    </form>
  )
}
