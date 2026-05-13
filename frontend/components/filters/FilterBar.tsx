"use client";

type Option = {
  label: string;
  value: string;
};

type Props = {
  filters: {
    key: string;
    label: string;
    options: Option[];
  }[];

  onChange: (key: string, value: string) => void;
  values: Record<string, string>;
};

export function FilterBar({ filters, onChange, values }: Props) {
  return (
    <div className="rounded-xl p-3 flex flex-wrap gap-3 items-center">
      {filters.map((filter) => (
        <select
          key={filter.key}
          value={values[filter.key] || ""}
          onChange={(e) => onChange(filter.key, e.target.value)}
          className="border rounded-lg px-3 py-2 text-sm"
        >
          <option value="">All {filter.label}</option>

          {filter.options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      ))}
    </div>
  );
}