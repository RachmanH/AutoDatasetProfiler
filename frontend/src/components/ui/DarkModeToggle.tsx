interface Props {
  dark: boolean
  toggle: () => void
}

export default function DarkModeToggle({ dark, toggle }: Props) {
  return (
    <button
      onClick={toggle}
      aria-label="Toggle dark mode"
      className="rounded-xl border border-slate-200 dark:border-slate-700 px-3 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
    >
      {dark ? '☀️' : '🌙'}
    </button>
  )
}
