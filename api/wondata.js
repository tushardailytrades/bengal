const BASE = 'https://results.eci.gov.in/ResultAcGenMay2026';

async function fetchText(url) {
  const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.text();
}

function parseWonPage(html) {
  // Each data row: <tr><td>1</td><td>CONSTITUENCY(no)</td><td>NAME</td><td>votes</td><td>margin</td><td>status</td></tr>
  const rows = [];
  const rowRe = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
  const tdRe = /<td[^>]*>([\s\S]*?)<\/td>/gi;
  let rowMatch;
  while ((rowMatch = rowRe.exec(html)) !== null) {
    const cells = [];
    let tdMatch;
    const tdSrc = rowMatch[1];
    const tdReLocal = /<td[^>]*>([\s\S]*?)<\/td>/gi;
    while ((tdMatch = tdReLocal.exec(tdSrc)) !== null) {
      cells.push(tdMatch[1].replace(/<[^>]+>/g, '').trim());
    }
    if (cells.length >= 4 && /^\d+$/.test(cells[0])) {
      // Parse constituency name and seat number: "KALIMPONG(22)"
      const constMatch = cells[1].match(/^(.+?)\((\d+)\)/);
      rows.push({
        sno: parseInt(cells[0]),
        constituency: constMatch ? constMatch[1].trim() : cells[1],
        seatNo: constMatch ? parseInt(constMatch[2]) : null,
        candidate: cells[2],
        votes: cells[3],
        margin: cells[4] || '',
        status: cells[5] || ''
      });
    }
  }
  return rows;
}

function parseMainPage(html) {
  // Table row pattern for party results: Party | Won | Leading | Total
  const result = {};
  const rowRe = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
  let rowMatch;
  while ((rowMatch = rowRe.exec(html)) !== null) {
    const inner = rowMatch[1];
    // Look for party name cell
    const partyMatch = inner.match(/Bharatiya Janata Party|All India Trinamool/i);
    if (!partyMatch) continue;
    // Extract all numbers from links (won then leading then total)
    const nums = [...inner.matchAll(/href="[^"]*"[^>]*>(\d+)<\/a>/g)].map(m => parseInt(m[1]));
    // Also get plain numbers
    const plainNum = [...inner.matchAll(/<[^/][^>]*>(\d+)<\/[^>]+>/g)].map(m => parseInt(m[1])).filter(n => !isNaN(n));
    const isBJP = /Bharatiya Janata/i.test(inner);
    const key = isBJP ? 'BJP' : 'AITC';
    if (nums.length >= 1) {
      result[key] = {
        won: nums[0] || 0,
        leading: nums[1] || 0,
        total: plainNum[plainNum.length - 1] || 0
      };
    }
  }
  return result;
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 's-maxage=30, stale-while-revalidate=60');
  try {
    // Fetch main partywise result page for Won/Leading totals
    const mainHtml = await fetchText(`${BASE}/partywiseresult-S25.htm`);
    const summary = parseMainPage(mainHtml);

    // Fetch BJP and TMC won constituency pages in parallel
    const [bjpWonHtml, tmcWonHtml] = await Promise.all([
      fetchText(`${BASE}/partywisewinresult-369S25.htm`).catch(() => ''),
      fetchText(`${BASE}/partywisewinresult-140S25.htm`).catch(() => '')
    ]);

    const bjpWonSeats = parseWonPage(bjpWonHtml);
    const tmcWonSeats = parseWonPage(tmcWonHtml);

    res.status(200).json({
      summary,
      bjpWonSeats,
      tmcWonSeats,
      updatedAt: new Date().toISOString()
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
