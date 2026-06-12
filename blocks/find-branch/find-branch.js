// Sample data for standalone EDS preview (no bridge).
// In production, data comes dynamically from bridge.toolResult.
const SAMPLE_DATA = [
  {
    name: "Financial Center - Downtown",
    address: "123 Main Street, San Francisco, CA 94102",
    type: "Financial Center & ATM",
    distance: "0.3 mi",
    hours: "Mon-Fri 9:00 AM - 5:00 PM, Sat 9:00 AM - 1:00 PM",
    services: ["Personal Banking", "Business Banking", "Safe Deposit Boxes"]
  },
  {
    name: "ATM - Market Street",
    address: "456 Market Street, San Francisco, CA 94103",
    type: "ATM",
    distance: "0.5 mi",
    hours: "24/7",
    services: ["Cash Withdrawal", "Deposits"]
  }
];

// Brand palette from BuildWidgetRequest — darkened to luminance ≤ 0.12 for card backgrounds
const PALETTE = ['#0053c2','#012169','#a50e28','#555555','#696969'];

function getThemedCardBg(palette) {
  if (!palette || !palette[0]) return null;
  let hex = palette[0].replace('#', '');
  if (hex.length === 3) hex = hex[0]+hex[0]+hex[1]+hex[1]+hex[2]+hex[2];
  if (hex.length !== 6) return null;
  let [r, g, b] = [parseInt(hex.slice(0,2),16), parseInt(hex.slice(2,4),16), parseInt(hex.slice(4,6),16)];
  if (isNaN(r) || isNaN(g) || isNaN(b)) return null;
  const lum = (c) => { const s=c/255; return s<=0.03928?s/12.92:Math.pow((s+0.055)/1.055,2.4); };
  const relLum = (r,g,b) => 0.2126*lum(r)+0.7152*lum(g)+0.0722*lum(b);
  if (relLum(r,g,b) <= 0.12) return { bg: `#${hex}`, fg: '#ffffff' };
  let lo=0, hi=1;
  for (let i=0; i<20; i++) {
    const m=(lo+hi)/2;
    if (relLum(Math.round(r*m),Math.round(g*m),Math.round(b*m)) > 0.12) hi=m; else lo=m;
  }
  const dr=Math.round(r*lo), dg=Math.round(g*lo), db=Math.round(b*lo);
  return { bg:`#${dr.toString(16).padStart(2,'0')}${dg.toString(16).padStart(2,'0')}${db.toString(16).padStart(2,'0')}`, fg:'#ffffff' };
}

const theme = getThemedCardBg(PALETTE);

export default async function decorate(block, bridge) {
  let branches;

  if (bridge) {
    bridge.applyHostStyles();
    const isPreview = bridge.hostContext?.preview === true;
    if (isPreview) {
      branches = SAMPLE_DATA;
    } else {
      const _result = await bridge.toolResult;
      const structuredContent = _result?.structuredContent || _result;
      // structuredContent.branches — bare array outputSchema; key derived from actionName "find_branch"
      branches = structuredContent?.branches || [];
    }
  } else {
    branches = SAMPLE_DATA;
  }

  block.textContent = '';

  if (!branches || branches.length === 0) {
    renderEmptyState(block, bridge);
  } else {
    renderBranches(block, branches, bridge);
  }

  if (bridge) {
    bridge.reportSize(block.offsetWidth, block.offsetHeight);
    let resizeTimer;
    const ro = new ResizeObserver(() => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => bridge.reportSize(block.offsetWidth, block.offsetHeight), 150);
    });
    ro.observe(block);
  }
}

function renderEmptyState(block, bridge) {
  const card = document.createElement('div');
  card.className = 'find-branch-search-card';
  card.style.cssText = `background:${theme?.bg ?? '#1a3a5c'};color:${theme?.fg ?? '#fff'}`;

  const icon = document.createElement('div');
  icon.className = 'find-branch-pin-icon';
  icon.innerHTML = `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 1 1 18 0z"></path>
    <circle cx="12" cy="10" r="3"></circle>
  </svg>`;
  card.appendChild(icon);

  const heading = document.createElement('h2');
  heading.textContent = 'Find a Financial Center near you';
  card.appendChild(heading);

  const form = document.createElement('form');
  form.className = 'find-branch-search-form';

  const input = document.createElement('input');
  input.type = 'text';
  input.placeholder = 'Enter ZIP code...';
  input.className = 'find-branch-zip-input';
  form.appendChild(input);

  const button = document.createElement('button');
  button.type = 'submit';
  button.textContent = 'Find Nearby';
  button.className = 'find-branch-search-btn';
  form.appendChild(button);

  if (bridge) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const zip = input.value.trim();
      if (zip) {
        bridge.sendMessage(`Find branches near ${zip}`);
      }
    });
  }

  card.appendChild(form);
  block.appendChild(card);
}

function renderBranches(block, branches, bridge) {
  const container = document.createElement('div');
  container.className = 'find-branch-results';

  branches.slice(0, 2).forEach(branch => {
    const card = document.createElement('div');
    card.className = 'find-branch-card';
    card.style.cssText = `background:${theme?.bg ?? '#1a3a5c'};color:${theme?.fg ?? '#fff'}`;

    const pinCircle = document.createElement('div');
    pinCircle.className = 'find-branch-pin-circle';
    pinCircle.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 1 1 18 0z"></path>
      <circle cx="12" cy="10" r="3"></circle>
    </svg>`;
    card.appendChild(pinCircle);

    const name = document.createElement('div');
    name.className = 'find-branch-name';
    name.textContent = branch.name;
    card.appendChild(name);

    const type = document.createElement('div');
    type.className = 'find-branch-type';
    type.textContent = branch.type;
    card.appendChild(type);

    const address = document.createElement('div');
    address.className = 'find-branch-address';
    address.textContent = branch.address;
    card.appendChild(address);

    if (branch.hours) {
      const hours = document.createElement('div');
      hours.className = 'find-branch-hours';
      hours.textContent = branch.hours;
      card.appendChild(hours);
    }

    if (branch.distance) {
      const distance = document.createElement('div');
      distance.className = 'find-branch-distance';
      distance.textContent = branch.distance;
      card.appendChild(distance);
    }

    container.appendChild(card);
  });

  block.appendChild(container);
}
