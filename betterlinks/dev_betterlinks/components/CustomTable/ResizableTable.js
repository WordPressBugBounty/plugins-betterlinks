import { useState, useRef, useEffect } from 'react';

export default function ResizableTable({
  columns: initialColumns,
  data,
  defaultSortKey,
  defaultSortDirection = 'asc',
  onSelectedRowsChange,
  selectableRows = false,
  selectedRowKey = 'ID',
  clearSelectedRows = false,
  customCellRender = {},
  enablePagination = true,
  loading = false,
  skeletonRows = 10,
  storageKey = 'betterlinks-table-columns',
}) {
  const buildColumns = (cols, withCheckbox) => ([
    ...(withCheckbox
      ? [{
          key: '__checkbox__',
          label: '',
          width: 40,
          minWidth: 40,
          sortable: false,
        }]
      : []),
    ...cols.map((col) => {
      // Ensure width/minWidth are numeric values (remove any "px" suffix)
      const normalize = (w, fallback) => {
        if (typeof w === 'string') {
          const n = parseInt(w, 10);
          return isNaN(n) ? fallback : n;
        }
        if (typeof w === 'number') return w;
        return fallback;
      };

      return {
        ...col,
        width: normalize(col.width, 150),
        minWidth: normalize(col.minWidth, 80),
        sortable: col.sortable !== false,
      };
    }),
  ]);

  const getStoredColumnOrder = () => {
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      // normalize stored widths to numbers as well
      if (parsed && parsed.widths) {
        Object.keys(parsed.widths).forEach((k) => {
          const val = parsed.widths[k];
          if (typeof val === 'string') {
            const n = parseInt(val, 10);
            parsed.widths[k] = isNaN(n) ? undefined : n;
          }
        });
      }
      return parsed;
    } catch {
      return null;
    }
  };

  const buildColumnsWithStoredOrder = (cols, withCheckbox) => {
    const builtCols = buildColumns(cols, withCheckbox);
    const stored = getStoredColumnOrder();

    if (!stored || !stored.order) return builtCols;

    const reordered = [];
    for (const key of stored.order) {
      const col = builtCols.find(c => c.key === key);
      if (col) {
        // if there's a stored width, normalize it, otherwise use current
        const widthFromStore = stored.widths && stored.widths[key];
        const width = typeof widthFromStore !== 'undefined' ? widthFromStore : col.width;
        reordered.push({ ...col, width });
      }
    }

    const missing = builtCols.filter(c => !reordered.find(r => r.key === c.key));
    return [...reordered, ...missing];
  };

  const [columns, setColumns] = useState(buildColumnsWithStoredOrder(initialColumns || [], selectableRows));
  const [draggedColumnIndex, setDraggedColumnIndex] = useState(null);

  // inconsistent state.
  useEffect(() => {
    const newCols = buildColumnsWithStoredOrder(initialColumns || [], selectableRows);
    setColumns(newCols);
    // sync storage now that visible columns have changed
    saveColumnState(newCols);
  }, [initialColumns, selectableRows]);

  useEffect(() => {
    saveColumnState(columns);
  }, [columns]);

  const [selectedRows, setSelectedRows] = useState([]);

  useEffect(() => {
    if (clearSelectedRows) setSelectedRows([]);
  }, [clearSelectedRows]);

  const [sortKey, setSortKey] = useState(defaultSortKey || null);
  const [sortDirection, setSortDirection] = useState(
    defaultSortKey ? defaultSortDirection : null
  );
  const [resizingIndex, setResizingIndex] = useState(null);
  const [startX, setStartX] = useState(0);
  const [startWidth, setStartWidth] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const tableRef = useRef(null);

  const handleSort = (key, sortable) => {
    if (!sortable || loading) return;

    if (sortKey === key) {
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else if (sortDirection === 'desc') {
        setSortDirection(null);
        setSortKey(null);
      }
    } else {
      setSortKey(key);
      setSortDirection('asc');
    }
  };

  const sortedData = [...data].sort((a, b) => {
    if (!sortKey || !sortDirection) return 0;

    // if column has custom sort function, use it
    const column = columns.find(c => c.key === sortKey);
    if (column && typeof column.sortFunction === 'function') {
      const result = column.sortFunction(a, b);
      return sortDirection === 'asc' ? result : -result;
    }

    const aVal = a[sortKey];
    const bVal = b[sortKey];

    if (aVal === bVal) return 0;

    let comparison = 0;
    if (typeof aVal === 'number' && typeof bVal === 'number') {
      comparison = aVal - bVal;
    } else {
      comparison = String(aVal).localeCompare(String(bVal));
    }

    return sortDirection === 'asc' ? comparison : -comparison;
  });

  const totalPages = Math.ceil(sortedData.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = Math.min(startIndex + rowsPerPage, sortedData.length);
  const paginatedData = sortedData.slice(startIndex, endIndex);

  useEffect(() => {
    setCurrentPage(1);
  }, [rowsPerPage, sortKey, sortDirection]);

  const saveColumnState = (cols) => {
    try {
      const order = cols.map(c => c.key);
      const widths = {};
      cols.forEach(col => {
        // always store numeric widths
        const w = typeof col.width === 'number' ? col.width : parseInt(col.width, 10);
        widths[col.key] = isNaN(w) ? 0 : w;
      });
      window.localStorage.setItem(storageKey, JSON.stringify({ order, widths }));
    } catch {}
  };

  const handleMouseDown = (index, e) => {
    if (loading) return;
    e.preventDefault();
    setResizingIndex(index);
    setStartX(e.clientX);
    setStartWidth(columns[index].width || 150);
  };

  const handleDragStart = (index, e) => {
    if (loading || columns[index].key === '__checkbox__') {
      e.preventDefault();
      return;
    }
    setDraggedColumnIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (index, e) => {
    if (draggedColumnIndex === null || loading) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';

    if (draggedColumnIndex !== index) {
      const newColumns = [...columns];
      const draggedCol = newColumns[draggedColumnIndex];
      newColumns.splice(draggedColumnIndex, 1);
      newColumns.splice(index, 0, draggedCol);
      setDraggedColumnIndex(index);
      setColumns(newColumns);
      saveColumnState(newColumns);
    }
  };

  const handleDragEnd = () => {
    setDraggedColumnIndex(null);
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (resizingIndex === null) return;

      const diff = e.clientX - startX;
      const newWidth = Math.max(
        columns[resizingIndex].minWidth || 80,
        startWidth + diff
      );

      setColumns((prev) => {
        const updated = prev.map((col, idx) =>
          idx === resizingIndex ? { ...col, width: newWidth } : col
        );
        saveColumnState(updated);
        return updated;
      });
    };

    const handleMouseUp = () => {
      setResizingIndex(null);
    };

    if (resizingIndex !== null) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [resizingIndex, startX, startWidth, columns]);

  const getSortIcon = (key, sortable) => {
    if (!sortable) return null;

    if (sortKey !== key) {
      return <span className="btl-tbl-sort-icon">⇅</span>;
    }

    return sortDirection === 'asc' ? (
      <span className="btl-tbl-sort-icon btl-tbl-sort-active">▲</span>
    ) : (
      <span className="btl-tbl-sort-icon btl-tbl-sort-active">▼</span>
    );
  };

  const allSelected =
    paginatedData.length > 0 &&
    paginatedData.every((row) => selectedRows.includes(row[selectedRowKey]));

  const handleSelectAll = (e) => {
    if (loading) return;
    if (e.target.checked) {
      const pageRowIds = paginatedData.map((row) => row[selectedRowKey]);
      const newSelected = [...new Set([...selectedRows, ...pageRowIds])];
      setSelectedRows(newSelected);
      onSelectedRowsChange &&
        onSelectedRowsChange({
          selectedRows: sortedData.filter((r) => newSelected.includes(r[selectedRowKey])),
        });
    } else {
      const pageRowIds = paginatedData.map((row) => row[selectedRowKey]);
      const newSelected = selectedRows.filter((id) => !pageRowIds.includes(id));
      setSelectedRows(newSelected);
      onSelectedRowsChange &&
        onSelectedRowsChange({
          selectedRows: sortedData.filter((r) => newSelected.includes(r[selectedRowKey])),
        });
    }
  };

  const handleSelectRow = (row, checked) => {
    if (loading) return;
    let newSelected;
    if (checked) {
      newSelected = [...selectedRows, row[selectedRowKey]];
    } else {
      newSelected = selectedRows.filter((id) => id !== row[selectedRowKey]);
    }
    setSelectedRows(newSelected);
    onSelectedRowsChange &&
      onSelectedRowsChange({
        selectedRows: sortedData.filter((r) => newSelected.includes(r[selectedRowKey])),
      });
  };

  const renderCellContent = (value, isTruncated = false) => {
    if (!value) return value;
    const text = String(value);
    return <div className={isTruncated ? 'btl-tbl-cell-truncated' : 'btl-tbl-cell-content'}>{text}</div>;
  };

  const renderSkeletonRows = () => {
    return Array.from({ length: skeletonRows }).map((_, rowIndex) => (
      <tr key={`skeleton-${rowIndex}`} className="btl-tbl-row btl-tbl-skeleton-row">
        {columns.map((column) => (
          <td
            key={column.key}
            className="btl-tbl-td"
            style={{ width: `${column.width}px` }}
          >
            {column.key === '__checkbox__' ? (
              <div className="btl-tbl-skeleton btl-tbl-skeleton-checkbox"></div>
            ) : (
              <div className="btl-tbl-skeleton btl-tbl-skeleton-text"></div>
            )}
          </td>
        ))}
      </tr>
    ));
  };

  return (
    <>
      <div className="btl-tbl-container" ref={tableRef}>
        <div className="btl-tbl-wrapper">
          <table className="btl-tbl-table">
            <thead className="btl-tbl-thead">
              <tr className="btl-tbl-header-row">
                {columns.map((column, index) => (
                  <th
                    key={column.key}
                    className={`btl-tbl-th ${column.sortable && !loading ? 'btl-tbl-sortable' : ''} ${draggedColumnIndex === index ? 'btl-tbl-th-dragging' : ''}`}
                    style={{ width: `${column.width}px` }}
                    onClick={() => column.key !== '__checkbox__' && handleSort(column.key, column.sortable || false)}
                    draggable={column.key !== '__checkbox__' && !loading}
                    onDragStart={(e) => handleDragStart(index, e)}
                    onDragOver={(e) => handleDragOver(index, e)}
                    onDragEnd={handleDragEnd}
                  >
                    <div className="btl-tbl-th-content">
                      {column.key === '__checkbox__' ? (
                        <input
                          type="checkbox"
                          checked={allSelected}
                          onChange={handleSelectAll}
                          disabled={loading}
                          aria-label="Select all rows"
                        />
                      ) : (
                        <>
                          <span className="btl-tbl-th-label">{column.label}</span>
                          {getSortIcon(column.key, column.sortable || false)}
                        </>
                      )}
                    </div>
                    {column.key !== '__checkbox__' && (
                      <div
                        className="btl-tbl-resizer"
                        onMouseDown={(e) => handleMouseDown(index, e)}
                      />
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="btl-tbl-tbody">
              {loading ? (
                renderSkeletonRows()
              ) : (
                paginatedData.map((row, rowIndex) => (
                  <tr key={rowIndex} className="btl-tbl-row">
                    {columns.map((column) => (
                      <td
                        key={column.key}
                        className="btl-tbl-td"
                        style={{ width: `${column.width}px` }}
                      >
                        {column.key === '__checkbox__' ? (
                          <input
                            type="checkbox"
                            checked={selectedRows.includes(row[selectedRowKey])}
                            onChange={(e) => handleSelectRow(row, e.target.checked)}
                            aria-label="Select row"
                          />
                        ) : customCellRender[column.key] ? (
                          customCellRender[column.key](row)
                        ) : (
                          renderCellContent(row[column.key], column.key === 'user_agent' || column.key === 'referrer')
                        )}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
        {enablePagination && (
          <div className="btl-tbl-pagination">
            <div className="btl-tbl-pagination-left">
              <label htmlFor="rows-per-page" className="btl-tbl-pagination-label">
                Rows per page:
              </label>
              <select
                id="rows-per-page"
                className="btl-tbl-pagination-select"
                value={rowsPerPage}
                onChange={(e) => setRowsPerPage(Number(e.target.value))}
                disabled={loading}
              >
                <option value={10}>10</option>
                <option value={30}>30</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
                <option value={200}>200</option>
                <option value={500}>500</option>
              </select>
            </div>

            <div className="btl-tbl-pagination-center">
              <span className="btl-tbl-pagination-info">
                {loading ? (
                  <div className="btl-tbl-skeleton btl-tbl-skeleton-text" style={{ width: '80px', height: '16px' }}></div>
                ) : sortedData.length === 0 ? (
                  '0 of 0'
                ) : (
                  `${startIndex + 1}-${endIndex} of ${sortedData.length}`
                )}
              </span>
            </div>

            <div className="btl-tbl-pagination-right">
              <button
                className="btl-tbl-pagination-btn"
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1 || loading}
                aria-label="First page"
              >
                ⏮
              </button>
              <button
                className="btl-tbl-pagination-btn"
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                disabled={currentPage === 1 || loading}
                aria-label="Previous page"
              >
                ◀
              </button>
              <button
                className="btl-tbl-pagination-btn"
                onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                disabled={currentPage === totalPages || loading}
                aria-label="Next page"
              >
                ▶
              </button>
              <button
                className="btl-tbl-pagination-btn"
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages || loading}
                aria-label="Last page"
              >
                ⏭
              </button>
            </div>
          </div>
        )}
    </>
  );
}
