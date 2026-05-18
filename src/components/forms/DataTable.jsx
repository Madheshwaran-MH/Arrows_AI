import React, { useState } from 'react';
import { FiEdit2, FiEye, FiTrash2 } from "react-icons/fi";
import './DataTable.css';

const DataTable = ({ data, columns, onView, onEdit, onDelete }) => {
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  const handleSort = (columnKey) => {
    // Don't sort the actions column
    if (columnKey === 'actions') return;
    
    let newDirection = 'asc';
    if (sortConfig.key === columnKey && sortConfig.direction === 'asc') {
      newDirection = 'desc';
    }
    setSortConfig({ key: columnKey, direction: newDirection });
  };

  const sortedData = React.useMemo(() => {
    let sortableData = [...data];
    if (sortConfig.key) {
      sortableData.sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];

        // Handle array values
        const aStr = Array.isArray(aValue) ? aValue.join(', ') : String(aValue || '');
        const bStr = Array.isArray(bValue) ? bValue.join(', ') : String(bValue || '');

        if (aStr < bStr) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aStr > bStr) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableData;
  }, [data, sortConfig]);

  const getSortArrow = (columnKey) => {
    if (sortConfig.key !== columnKey) {
      return (
        <span style={{ marginLeft: '6px', fontSize: '12px', verticalAlign: 'middle' }}>
          <span style={{ display: 'inline-block', lineHeight: '0.8' }}>
            <div style={{ fontSize: '10px' }}>▲</div>
            <div style={{ fontSize: '10px' }}>▼</div>
          </span>
        </span>
      );
    }
    return sortConfig.direction === 'asc' ? (
      <span style={{ marginLeft: '6px', fontSize: '12px', verticalAlign: 'middle' }}>▲</span>
    ) : (
      <span style={{ marginLeft: '6px', fontSize: '12px', verticalAlign: 'middle' }}>▼</span>
    );
  };

  return (
    <div className="data-table-container">
      <table className="data-table">
        <thead>
          <tr>
            {columns.map((col) => (
              <th 
                key={col.key}
                onClick={() => handleSort(col.key)}
                style={{ 
                  cursor: col.key === 'actions' ? 'default' : 'pointer', 
                  userSelect: 'none', 
                  position: 'relative' 
                }}
              >
                {col.label}
                {col.key !== 'actions' && (
                  <span style={{ marginLeft: '8px', float: 'right' }}>
                    {getSortArrow(col.key)}
                  </span>
                )}
              </th>
            ))}
            <th key="actions-col" style={{ textAlign: 'center' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {sortedData.map((row, index) => (
            <tr key={index}>
              {columns.map((col) => {
                const value = row[col.key];
                if (col.render) {
                  return <td key={col.key}>{col.render(value, row, index)}</td>;
                }

                return (
                  <td key={col.key}>
                    {Array.isArray(value) ? value.join(', ') : value}
                  </td>
                );
              })}
              <td key={`actions-${index}`} style={{ textAlign: 'center' }}>
                <div className="action-icons">
                  <button 
                    className="action-btn view-btn"
                    onClick={() => onView?.(row, index)}
                    title="View"
                    aria-label="View row"
                  >
                    <FiEye size={16} />
                  </button>
                  <button 
                    className="action-btn edit-btn"
                    onClick={() => onEdit?.(row, index)}
                    title="Edit"
                    aria-label="Edit row"
                  >
                    <FiEdit2 size={16} />
                  </button>
                  <button 
                    className="action-btn delete-btn"
                    onClick={() => onDelete?.(row, index)}
                    title="Delete"
                    aria-label="Delete row"
                  >
                    <FiTrash2 size={16} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default DataTable;
