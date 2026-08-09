/**
 * One page header. Every screen, including the board.
 *
 * Each page opened with its own hand-written "← back to the board" link
 * above its own h1, all at slightly different sizes. The nav says where
 * you are now, so the back link is redundant — and a heading set the same
 * way on every page is what makes them feel like one app.
 *
 * The landing page had been the exception, declaring its own h1 one step
 * smaller: on a phone the page that has to say what this app is carried
 * the smallest title in it, below "Putar ulang". Titles step up with the
 * viewport here rather than being fixed, because the landing title is a
 * sentence while the others are single words, and 34px of sentence eats a
 * third of a phone screen.
 */
export function Kepala({
  judul,
  intro,
  children,
}: {
  judul: string
  intro?: string
  children?: React.ReactNode
}) {
  return (
    <header className="flex flex-col gap-3">
      <h1 className="font-display text-xl font-bold leading-tight sm:text-2xl">{judul}</h1>
      {intro && <p className="max-w-prose font-sans leading-relaxed text-fg">{intro}</p>}
      {children}
    </header>
  )
}
