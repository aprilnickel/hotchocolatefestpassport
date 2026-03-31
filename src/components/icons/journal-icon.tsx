export function JournalIcon({ active, className }: { active: boolean; className?: string }) {
  const cn = className ?? "size-6 shrink-0";
  if (active) {
    return (
      <svg className={cn} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <defs>
          <mask id="notebook-pen-icon-mask">
            <rect width="24" height="24" fill="#fff" stroke="none" />
            <g stroke="#000">
              <path d="M21.378 5.626a1 1 0 1 0-3.004-3.004l-5.01 5.012a2 2 0 0 0-.506.854l-.837 2.87a.5.5 0 0 0 .62.62l2.87-.837a2 2 0 0 0 .854-.506z" strokeWidth="6" fill="#000"/>
              <circle r=".5" cx="6" cy="6" stroke="#000" strokeWidth="1" fill="#000" />
              <circle r=".5" cx="6" cy="10" stroke="#000" strokeWidth="1" fill="#000" />
              <circle r=".5" cx="6" cy="14" stroke="#000" strokeWidth="1" fill="#000" />
              <circle r=".5" cx="6" cy="18" stroke="#000" strokeWidth="1" fill="#000" />
            </g>
          </mask>
        </defs>
        <g mask="url(#notebook-pen-icon-mask)">
          <path d="M2 6h4"/>
          <path d="M2 10h4"/>
          <path d="M2 14h4"/>
          <path d="M2 18h4"/>
          <rect width="16" height="20" x="4" y="2" rx="2" fill="currentColor" />
        </g>
        <path d="M21.378 5.626a1 1 0 1 0-3.004-3.004l-5.01 5.012a2 2 0 0 0-.506.854l-.837 2.87a.5.5 0 0 0 .62.62l2.87-.837a2 2 0 0 0 .854-.506z" />
      </svg>
    );
  }
  return (
    <svg className={cn} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M13.4 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7.4"/>
      <path d="M2 6h4"/>
      <path d="M2 10h4"/>
      <path d="M2 14h4"/>
      <path d="M2 18h4"/>
      <path d="M21.378 5.626a1 1 0 1 0-3.004-3.004l-5.01 5.012a2 2 0 0 0-.506.854l-.837 2.87a.5.5 0 0 0 .62.62l2.87-.837a2 2 0 0 0 .854-.506z" />
    </svg>
  );
}
