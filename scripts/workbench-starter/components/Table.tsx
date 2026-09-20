import type { HTMLAttributes, ReactNode, TableHTMLAttributes, TdHTMLAttributes, ThHTMLAttributes } from 'react';
import './local.css';

export type TableProps = TableHTMLAttributes<HTMLTableElement> & {
  children?: ReactNode;
};

export type TableSectionProps = HTMLAttributes<HTMLTableSectionElement> & {
  children?: ReactNode;
};

export type TableRowProps = HTMLAttributes<HTMLTableRowElement> & {
  children?: ReactNode;
};

export type TableHeadProps = ThHTMLAttributes<HTMLTableCellElement> & {
  children?: ReactNode;
};

export type TableCellProps = TdHTMLAttributes<HTMLTableCellElement> & {
  children?: ReactNode;
};

export function Table({ children, className = '', ...props }: TableProps) {
  return (
    <div className="wb-table-wrap">
      <table {...props} className={['wb-table', className].filter(Boolean).join(' ')}>
        {children}
      </table>
    </div>
  );
}

export function TableHeader({ children, className = '', ...props }: TableSectionProps) {
  return <thead {...props} className={['wb-table__header', className].filter(Boolean).join(' ')}>{children}</thead>;
}

export function TableBody({ children, className = '', ...props }: TableSectionProps) {
  return <tbody {...props} className={['wb-table__body', className].filter(Boolean).join(' ')}>{children}</tbody>;
}

export function TableFooter({ children, className = '', ...props }: TableSectionProps) {
  return <tfoot {...props} className={['wb-table__footer', className].filter(Boolean).join(' ')}>{children}</tfoot>;
}

export function TableRow({ children, className = '', ...props }: TableRowProps) {
  return <tr {...props} className={['wb-table__row', className].filter(Boolean).join(' ')}>{children}</tr>;
}

export function TableHead({ children, className = '', ...props }: TableHeadProps) {
  return <th {...props} className={['wb-table__head', className].filter(Boolean).join(' ')}>{children}</th>;
}

export function TableCell({ children, className = '', ...props }: TableCellProps) {
  return <td {...props} className={['wb-table__cell', className].filter(Boolean).join(' ')}>{children}</td>;
}

export function TableCaption({ children, className = '', ...props }: HTMLAttributes<HTMLTableCaptionElement>) {
  return <caption {...props} className={['wb-table__caption', className].filter(Boolean).join(' ')}>{children}</caption>;
}
