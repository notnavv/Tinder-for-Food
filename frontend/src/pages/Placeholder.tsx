interface PlaceholderProps {
  title: string
  area: string
  todo: string[]
}

/** Temporary page body. Delete it from a page once someone builds the real thing. */
export default function Placeholder({ title, area, todo }: PlaceholderProps) {
  return (
    <section className="mx-auto max-w-md p-6">
      <h1 className="font-display text-2xl font-bold">{title}</h1>
      <p className="mt-1 text-sm text-gray-500">Area: {area}</p>
      <ul className="mt-4 list-disc space-y-1 pl-5 text-sm">
        {todo.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </section>
  )
}
