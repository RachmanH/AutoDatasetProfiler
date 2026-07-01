export const TYPE_BADGE_COLOR: Record<string, string> = {
  numeric: 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300',
  categorical: 'bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300',
  datetime: 'bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-300',
  boolean: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-950/40 dark:text-yellow-300',
  text: 'bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300',
  id_like: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
  constant: 'bg-red-100 text-red-600 dark:bg-red-950/40 dark:text-red-300',
}

export const CONFIDENCE_COLOR: Record<string, string> = {
  high: 'bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-300',
  medium: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-950/40 dark:text-yellow-300',
  low: 'bg-red-100 text-red-600 dark:bg-red-950/40 dark:text-red-300',
}
