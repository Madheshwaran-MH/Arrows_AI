const fs = require('fs');

const targetPath = 'c:\\\\Arrows_Frontend\\\\src\\\\pages\\\\job-openings\\\\Candidates.jsx';
let code = fs.readFileSync(targetPath, 'utf8');

const stateOld = `  const [currentPage, setCurrentPage] = React.useState(1);\n  const [isMoreMenuOpen, setIsMoreMenuOpen] = React.useState(false);`;
const stateNew = `  const [currentPage, setCurrentPage] = React.useState(1);\n  const [sortConfig, setSortConfig] = React.useState({ key: null, direction: 'asc' });\n  const [isMoreMenuOpen, setIsMoreMenuOpen] = React.useState(false);`;

code = code.replace(stateOld, stateNew);
if (!code.includes(stateNew)) {
  code = code.replace(stateOld.replace(/\n/g, '\r\n'), stateNew.replace(/\n/g, '\r\n'));
}

const filterOld = `  // Memoized filter logic - only recalculates when dependencies change
  const filteredData = React.useMemo(() =>
    submittedData
      .map((item, sourceIndex) => ({ item, sourceIndex }))
      .filter(({ item }) => {
        const matchesSearch =
          !searchTerm ||
          Object.values(item).some((value) =>
            String(value).toLowerCase().includes(searchTerm.toLowerCase())
          );

        const matchesSource = !filterSource || item.source === filterSource;
        const matchesRating = !filterRating || item.rating === filterRating;
        const matchesStage = !filterStage || item.stage === filterStage;
        const matchesStatus = !filterStatus || item.status === filterStatus;

        return matchesSearch && matchesSource && matchesRating && matchesStage && matchesStatus;
      }),
    [submittedData, searchTerm, filterSource, filterRating, filterStage, filterStatus]
  );`;

const filterNew = `  // Memoized filter logic - only recalculates when dependencies change
  const filteredData = React.useMemo(() => {
    let result = submittedData
      .map((item, sourceIndex) => ({ item, sourceIndex }))
      .filter(({ item }) => {
        const matchesSearch =
          !searchTerm ||
          Object.values(item).some((value) =>
            String(value).toLowerCase().includes(searchTerm.toLowerCase())
          );

        const matchesSource = !filterSource || item.source === filterSource;
        const matchesRating = !filterRating || item.rating === filterRating;
        const matchesStage = !filterStage || item.stage === filterStage;
        const matchesStatus = !filterStatus || item.status === filterStatus;

        return matchesSearch && matchesSource && matchesRating && matchesStage && matchesStatus;
      });

    if (sortConfig.key) {
      result.sort((a, b) => {
        const aValue = a.item[sortConfig.key] || "";
        const bValue = b.item[sortConfig.key] || "";
        
        const aStr = String(aValue).toLowerCase();
        const bStr = String(bValue).toLowerCase();

        if (aStr < bStr) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aStr > bStr) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }

    return result;
  }, [submittedData, searchTerm, filterSource, filterRating, filterStage, filterStatus, sortConfig]);

  const handleSort = React.useCallback((key) => {
    setSortConfig((prev) => {
      let direction = 'asc';
      if (prev.key === key && prev.direction === 'asc') {
        direction = 'desc';
      }
      return { key, direction };
    });
  }, []);

  const getSortArrow = React.useCallback((columnKey) => {
    if (sortConfig.key !== columnKey) {
      return (
        <span style={{ marginLeft: '6px', fontSize: '10px', verticalAlign: 'middle', opacity: 0.5 }}>
          <span style={{ display: 'inline-block', lineHeight: '0.8' }}>
            <span style={{ display: 'block', fontSize: '10px' }}>▲</span>
            <span style={{ display: 'block', fontSize: '10px' }}>▼</span>
          </span>
        </span>
      );
    }
    return sortConfig.direction === 'asc' ? (
      <span style={{ marginLeft: '6px', fontSize: '12px', verticalAlign: 'middle' }}>▲</span>
    ) : (
      <span style={{ marginLeft: '6px', fontSize: '12px', verticalAlign: 'middle' }}>▼</span>
    );
  }, [sortConfig]);`;

code = code.replace(filterOld, filterNew);
if (!code.includes(filterNew)) {
  code = code.replace(filterOld.replace(/\n/g, '\r\n'), filterNew.replace(/\n/g, '\r\n'));
}

const headersOld = `                <thead>\n                  <tr>\n                    <th>Application Id</th>\n                    <th>Candidate Name</th>\n                    <th>Email Address</th>\n                    <th>Modified Time</th>\n                    <th>Source</th>\n                    <th>Rating</th>\n                    <th>Stage</th>\n                    <th>Status</th>\n                    <th className={styles.actionsCol}>Actions</th>\n                  </tr>\n                </thead>`;

const headersNew = `                <thead>\n                  <tr>\n                    <th onClick={() => handleSort('candidateId')} style={{ cursor: 'pointer', userSelect: 'none', position: 'relative' }}>Application Id <span style={{ position: 'absolute', right: '8px' }}>{getSortArrow('candidateId')}</span></th>\n                    <th onClick={() => handleSort('candidateName')} style={{ cursor: 'pointer', userSelect: 'none', position: 'relative' }}>Candidate Name <span style={{ position: 'absolute', right: '8px' }}>{getSortArrow('candidateName')}</span></th>\n                    <th onClick={() => handleSort('candidateEmail')} style={{ cursor: 'pointer', userSelect: 'none', position: 'relative' }}>Email Address <span style={{ position: 'absolute', right: '8px' }}>{getSortArrow('candidateEmail')}</span></th>\n                    <th onClick={() => handleSort('modifiedTime')} style={{ cursor: 'pointer', userSelect: 'none', position: 'relative' }}>Modified Time <span style={{ position: 'absolute', right: '8px' }}>{getSortArrow('modifiedTime')}</span></th>\n                    <th onClick={() => handleSort('source')} style={{ cursor: 'pointer', userSelect: 'none', position: 'relative' }}>Source <span style={{ position: 'absolute', right: '8px' }}>{getSortArrow('source')}</span></th>\n                    <th onClick={() => handleSort('rating')} style={{ cursor: 'pointer', userSelect: 'none', position: 'relative' }}>Rating <span style={{ position: 'absolute', right: '8px' }}>{getSortArrow('rating')}</span></th>\n                    <th onClick={() => handleSort('stage')} style={{ cursor: 'pointer', userSelect: 'none', position: 'relative' }}>Stage <span style={{ position: 'absolute', right: '8px' }}>{getSortArrow('stage')}</span></th>\n                    <th onClick={() => handleSort('status')} style={{ cursor: 'pointer', userSelect: 'none', position: 'relative' }}>Status <span style={{ position: 'absolute', right: '8px' }}>{getSortArrow('status')}</span></th>\n                    <th className={styles.actionsCol}>Actions</th>\n                  </tr>\n                </thead>`;

code = code.replace(headersOld, headersNew);
if (!code.includes(headersNew)) {
  code = code.replace(headersOld.replace(/\n/g, '\r\n'), headersNew.replace(/\n/g, '\r\n'));
}

fs.writeFileSync(targetPath, code);
console.log('Update finished');
