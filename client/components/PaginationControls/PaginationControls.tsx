// Copyright (c) 2023 Massachusetts Institute of Technology
// SPDX-License-Identifier: MIT
import Button from 'react-bootstrap/Button'
import Form from 'react-bootstrap/Form'


import { Table } from '@tanstack/react-table';

import styles from "./PaginationControls.module.scss"

type Props = {
  numRows: number,
  table: Table<any>,
}

export function PaginationControls({numRows,table}: Props) {
  return (
    <div id={styles["pagination-container"]}>
      <div id={styles["pagination-buttons"]}>
        <Button
          onClick={() => table.setPageIndex(0)}
          disabled={!table.getCanPreviousPage()}
          size="sm"
        >
          First
        </Button>
        <Button
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
          size="sm"
        >
          Prev
        </Button>
        <Button
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
          size="sm"
        >
          Next
        </Button>
        <Button
          onClick={() => table.setPageIndex(table.getPageCount() - 1)}
          disabled={!table.getCanNextPage()}
          size="sm"
        >
          Last
        </Button>
      </div>
      
      <span>
        Page{' '}
        <strong>
          {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
        </strong>
      </span>
      
      <span>
        Go to page
        <Form.Control
          type="number"
          defaultValue={table.getState().pagination.pageIndex + 1}
          min={1}
          max={table.getPageCount()}
          onChange={(e) => {
            const page = e.target.value ? Number(e.target.value) - 1 : 0;
            table.setPageIndex(page);
          }}
        />
      </span>
      
      <Form.Select
        value={table.getState().pagination.pageSize}
        onChange={(e) => table.setPageSize(Number(e.target.value))}
      >
        {[5, 10, 20, 50].map((pageSize) => (
          <option key={pageSize} value={pageSize}>
            Show {pageSize}
          </option>
        ))}
      </Form.Select>
      
      <span style={{ marginLeft: '10px' }}>
        Total Records: {numRows}
      </span>
    </div>
  )
}
