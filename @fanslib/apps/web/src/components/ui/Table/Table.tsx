import type { ReactNode } from 'react';
import { useRef } from 'react';
import type { AriaTableProps } from 'react-aria';
import { useTable, useTableCell, useTableColumnHeader, useTableRow, useTableRowGroup } from 'react-aria';
import type { TableState } from 'react-stately';
import { useTableState } from 'react-stately';
import { cn } from '~/lib/utils';

export type TableProps<T extends object> = AriaTableProps<T> & {
  className?: string;
  zebra?: boolean;
  compact?: boolean;
};

export const Table = <T extends object>({
  className,
  zebra = false,
  compact = false,
  ...props
}: TableProps<T>) => {
  const state = useTableState(props);
  const ref = useRef<HTMLTableElement>(null);
  const { collection } = state;
  const { gridProps } = useTable(props, state, ref);

  return (
    <div className="overflow-x-auto">
      <table
        {...gridProps}
        ref={ref}
        className={cn(
          'table',
          zebra && 'table-zebra',
          compact && 'table-sm',
          className
        )}
      >
        <TableRowGroup type="thead">
          {collection.headerRows.map((headerRow) => (
            <TableHeaderRow key={headerRow.key} item={headerRow} state={state}>
              {[...headerRow.childNodes].map((column) => (
                <TableColumnHeader key={column.key} column={column} state={state} />
              ))}
            </TableHeaderRow>
          ))}
        </TableRowGroup>
        <TableRowGroup type="tbody">
          {[...collection.body.childNodes].map((row) => (
            <TableRow key={row.key} item={row} state={state}>
              {[...row.childNodes].map((cell) => (
                <TableCell key={cell.key} cell={cell} state={state} />
              ))}
            </TableRow>
          ))}
        </TableRowGroup>
      </table>
    </div>
  );
};

type TableRowGroupProps = {
  type: 'thead' | 'tbody' | 'tfoot';
  children: ReactNode;
};

const TableRowGroup = ({ type, children }: TableRowGroupProps) => {
  const { rowGroupProps } = useTableRowGroup();
  const Element = type;

  return <Element {...rowGroupProps}>{children}</Element>;
};

type TableHeaderRowProps<T extends object> = {
  item: {
    key: React.Key;
    childNodes: Iterable<unknown>;
  };
  state: TableState<T>;
  children: ReactNode;
};

const TableHeaderRow = <T extends object>({ item, state, children }: TableHeaderRowProps<T>) => {
  const ref = useRef<HTMLTableRowElement>(null);
  const { rowProps } = useTableRow({ node: item }, state, ref);

  return (
    <tr {...rowProps} ref={ref}>
      {children}
    </tr>
  );
};

type TableColumnHeaderProps<T extends object> = {
  column: {
    key: React.Key;
    rendered: ReactNode;
  };
  state: TableState<T>;
};

const TableColumnHeader = <T extends object>({ column, state }: TableColumnHeaderProps<T>) => {
  const ref = useRef<HTMLTableCellElement>(null);
  const { columnHeaderProps } = useTableColumnHeader({ node: column }, state, ref);

  return (
    <th {...columnHeaderProps} ref={ref}>
      {column.rendered}
    </th>
  );
};

type TableRowProps<T extends object> = {
  item: {
    key: React.Key;
    childNodes: Iterable<unknown>;
  };
  state: TableState<T>;
  children: ReactNode;
};

const TableRow = <T extends object>({ item, state, children }: TableRowProps<T>) => {
  const ref = useRef<HTMLTableRowElement>(null);
  const { rowProps } = useTableRow({ node: item }, state, ref);

  return (
    <tr {...rowProps} ref={ref}>
      {children}
    </tr>
  );
};

type TableCellProps<T extends object> = {
  cell: {
    key: React.Key;
    rendered: ReactNode;
  };
  state: TableState<T>;
};

const TableCell = <T extends object>({ cell, state }: TableCellProps<T>) => {
  const ref = useRef<HTMLTableCellElement>(null);
  const { gridCellProps } = useTableCell({ node: cell }, state, ref);

  return (
    <td {...gridCellProps} ref={ref}>
      {cell.rendered}
    </td>
  );
};

