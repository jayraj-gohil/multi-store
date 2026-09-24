interface ToggleProps {
  checked: boolean;
  onChange: () => void;
  label?: string;
  disabled?: boolean;
}

/** iOS-style toggle switch. Same on/off action as before — just a clearer control for it. */
export function Toggle({ checked, onChange, label, disabled }: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={onChange}
      className="inline-flex items-center gap-2 disabled:cursor-not-allowed disabled:opacity-50"
    >
      <span
        className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${
          checked ? 'bg-green-600' : 'bg-slate-300'
        }`}
      >
        <span
          className={`inline-block size-3.5 transform rounded-full bg-white shadow transition-transform ${
            checked ? 'translate-x-[18px]' : 'translate-x-1'
          }`}
        />
      </span>
      {label && (
        <span className={`text-xs font-medium ${checked ? 'text-green-700' : 'text-slate-500'}`}>{label}</span>
      )}
    </button>
  );
}
