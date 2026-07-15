interface PillsProps<T extends string> {
  options: T[];
  selected: T | null;
  onChange: (v: T) => void;
  labelMap: Record<T, string>;
  btnBase?: string;
  btnNormal?: string;
  btnActive?: string;
}

const defaultBtnBase = 'px-3 py-2 text-sm rounded-xl border-2 transition-all select-none';
const defaultBtnNormal = 'bg-gray-100 border-gray-200 text-gray-500 hover:border-gray-400 hover:text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:border-gray-500 dark:hover:text-gray-300';
const defaultBtnActive = 'bg-blue-50 border-blue-500 text-blue-700 shadow-[0_0_8px_rgba(59,130,246,0.3)] dark:bg-blue-900/30 dark:border-blue-600 dark:text-blue-400';

export function Pills<T extends string>({
  options,
  selected,
  onChange,
  labelMap,
  btnBase = defaultBtnBase,
  btnNormal = defaultBtnNormal,
  btnActive = defaultBtnActive,
}: PillsProps<T>) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map(opt => (
        <button
          key={opt}
          onClick={() => onChange(opt)}
          className={`${btnBase} ${selected === opt ? btnActive : btnNormal}`}
        >
          {labelMap[opt]}
        </button>
      ))}
    </div>
  );
}