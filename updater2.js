const fs = require('fs');

const targetPath = 'c:\\\\Arrows_Frontend\\\\src\\\\pages\\\\job-openings\\\\Candidates.jsx';
let code = fs.readFileSync(targetPath, 'utf8');

const headersOld = `                <thead>
                  <tr>
                    <th onClick={() => handleSort('candidateId')} style={{ cursor: 'pointer', userSelect: 'none', position: 'relative' }}>Application Id <span style={{ position: 'absolute', right: '8px' }}>{getSortArrow('candidateId')}</span></th>
                    <th onClick={() => handleSort('candidateName')} style={{ cursor: 'pointer', userSelect: 'none', position: 'relative' }}>Candidate Name <span style={{ position: 'absolute', right: '8px' }}>{getSortArrow('candidateName')}</span></th>
                    <th onClick={() => handleSort('candidateEmail')} style={{ cursor: 'pointer', userSelect: 'none', position: 'relative' }}>Email Address <span style={{ position: 'absolute', right: '8px' }}>{getSortArrow('candidateEmail')}</span></th>
                    <th onClick={() => handleSort('modifiedTime')} style={{ cursor: 'pointer', userSelect: 'none', position: 'relative' }}>Modified Time <span style={{ position: 'absolute', right: '8px' }}>{getSortArrow('modifiedTime')}</span></th>
                    <th onClick={() => handleSort('source')} style={{ cursor: 'pointer', userSelect: 'none', position: 'relative' }}>Source <span style={{ position: 'absolute', right: '8px' }}>{getSortArrow('source')}</span></th>
                    <th onClick={() => handleSort('rating')} style={{ cursor: 'pointer', userSelect: 'none', position: 'relative' }}>Rating <span style={{ position: 'absolute', right: '8px' }}>{getSortArrow('rating')}</span></th>
                    <th onClick={() => handleSort('stage')} style={{ cursor: 'pointer', userSelect: 'none', position: 'relative' }}>Stage <span style={{ position: 'absolute', right: '8px' }}>{getSortArrow('stage')}</span></th>
                    <th onClick={() => handleSort('status')} style={{ cursor: 'pointer', userSelect: 'none', position: 'relative' }}>Status <span style={{ position: 'absolute', right: '8px' }}>{getSortArrow('status')}</span></th>
                    <th className={styles.actionsCol}>Actions</th>
                  </tr>
                </thead>`;

const thStyle = `style={{ cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap' }}`;
const flexDiv = `<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>`;

const headersNew = `                <thead>
                  <tr>
                    <th onClick={() => handleSort('candidateId')} ${thStyle}>${flexDiv}<span>Application Id</span>{getSortArrow('candidateId')}</div></th>
                    <th onClick={() => handleSort('candidateName')} ${thStyle}>${flexDiv}<span>Candidate Name</span>{getSortArrow('candidateName')}</div></th>
                    <th onClick={() => handleSort('candidateEmail')} ${thStyle}>${flexDiv}<span>Email Address</span>{getSortArrow('candidateEmail')}</div></th>
                    <th onClick={() => handleSort('modifiedTime')} ${thStyle}>${flexDiv}<span>Modified Time</span>{getSortArrow('modifiedTime')}</div></th>
                    <th onClick={() => handleSort('source')} ${thStyle}>${flexDiv}<span>Source</span>{getSortArrow('source')}</div></th>
                    <th onClick={() => handleSort('rating')} ${thStyle}>${flexDiv}<span>Rating</span>{getSortArrow('rating')}</div></th>
                    <th onClick={() => handleSort('stage')} ${thStyle}>${flexDiv}<span>Stage</span>{getSortArrow('stage')}</div></th>
                    <th onClick={() => handleSort('status')} ${thStyle}>${flexDiv}<span>Status</span>{getSortArrow('status')}</div></th>
                    <th className={styles.actionsCol}>Actions</th>
                  </tr>
                </thead>`;

code = code.replace(headersOld, headersNew);
if (!code.includes(headersNew)) {
  code = code.replace(headersOld.replace(/\\n/g, '\\r\\n'), headersNew.replace(/\\n/g, '\\r\\n'));
}

fs.writeFileSync(targetPath, code);
console.log('Update finished');
