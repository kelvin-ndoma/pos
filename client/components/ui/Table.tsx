// client/components/ui/table.tsx
'use client';

import * as React from 'react';
import { cn } from '@/lib/cn';

export function Table(
  props: React.HTMLAttributes<HTMLTableElement>,
) {
  return (
    <table
      {...props}
      className={cn(
        'w-full border-collapse text-sm text-slate-100',
        props.className,
      )}
    />
  );
}

export function Thead(
  props: React.HTMLAttributes<HTMLTableSectionElement>,
) {
  return (
    <thead
      {...props}
      className={cn('bg-slate-900/80 text-xs text-slate-400', props.className)}
    />
  );
}

export function Tbody(
  props: React.HTMLAttributes<HTMLTableSectionElement>,
) {
  return <tbody {...props} />;
}

export function Tr(props: React.HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr
      {...props}
      className={cn(
        'border-b border-slate-800 last:border-b-0',
        props.className,
      )}
    />
  );
}

export function Th(
  props: React.ThHTMLAttributes<HTMLTableCellElement>,
) {
  return (
    <th
      {...props}
      className={cn(
        'px-3 py-2 text-left font-medium text-[11px] uppercase tracking-[0.12em]',
        props.className,
      )}
    />
  );
}

export function Td(
  props: React.TdHTMLAttributes<HTMLTableCellElement>,
) {
  return (
    <td
      {...props}
      className={cn('px-3 py-2 align-middle text-xs', props.className)}
    />
  );
}
