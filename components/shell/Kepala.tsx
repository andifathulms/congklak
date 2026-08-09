/**
 * One page header for every screen that is not the board.
 *
 * Each page opened with its own hand-written "← back to the board" link
 * above its own h1, all at slightly different sizes. The nav says where
 * you are now, so the back link is redundant — and a heading that is set
 * the same way on every page is what makes them feel like one app.
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
      <h1 className="font-display text-3xl font-bold sm:text-4xl">{judul}</h1>
      {intro && <p className="max-w-prose font-sans leading-relaxed text-fg">{intro}</p>}
      {children}
    </header>
  )
}
