const SAMPLE_DATA = [
  {
    name: 'Alaska Cruises',
    description: 'Explore glaciers, national parks, and wildlife on the highest-rated Alaska cruise line.',
    image_url: 'https://www.princess.com/content/dam/hero-v2-assets/alaska-hero-image.jpeg',
    category: 'Alaska'
  },
  {
    name: 'Caribbean Cruises',
    description: 'Experience unforgettable tropical adventures with award-winning service and pristine beaches.',
    image_url: 'https://www.princess.com/content/dam/princess/destination/caribbean/sizzle-videos/whats-next-caribbean-16x9-15s-2164x765.jpg',
    category: 'Caribbean'
  },
  {
    name: 'European Cruises',
    description: 'Discover the beauty of Barcelona, the Mediterranean, British Isles, and Scandinavia.',
    image_url: 'https://assets.princess.com/is/image/princesscruises/barcelona-spain-park-guell-gaudi-architecture-overlooking-city?qlt=82&ts=1781210764230',
    category: 'Europe'
  },
  {
    name: 'Mediterranean Cruises',
    description: 'Sail through the Greek Isles, Italy, and the French Riviera with stunning coastal views.',
    image_url: 'https://assets.princess.com/is/image/princesscruises/plc-santorini-greece-sp-sun-fira-sunset-location-drone:16x9',
    category: 'Mediterranean'
  },
  {
    name: 'British Isles Cruises',
    description: 'Explore Ireland, Scotland, and England\'s coastal treasures and historic landmarks.',
    image_url: 'https://assets.princess.com/is/image/princesscruises/cork-ireland-british-isles-blackrock-castle-observatory-1%3A1x1-Square?ts=1780949154991',
    category: 'British Isles'
  }
];

const PALETTE = ['#b6254f','#e60060','#020215','#003595','#ea0063'];
const CARD_COLORS = ['#378ef0','#9256d9','#0fb5ae','#e68619','#d83790','#2dca72','#4046ca','#72b340'];

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
  let items;

  if (bridge) {
    bridge.applyHostStyles();
    const isPreview = bridge.hostContext?.preview === true;
    if (isPreview) {
      items = SAMPLE_DATA;
    } else {
      const _result = await bridge.toolResult;
      const structuredContent = _result?.structuredContent || _result;
      // structuredContent.deals — bare array outputSchema; key derived from actionName "get_cruise_deals"
      items = structuredContent?.deals || [];
    }
  } else {
    items = SAMPLE_DATA;
  }

  block.textContent = '';
  renderDeals(block, items, bridge);

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

function renderDeals(block, items, bridge) {
  const wrapper = document.createElement('div');
  wrapper.className = 'carousel-wrapper';

  const carousel = document.createElement('div');
  carousel.className = 'deals-carousel';

  items.slice(0, 5).forEach((item, idx) => {
    const card = document.createElement('div');
    card.className = 'deal-card';

    const imageContainer = document.createElement('div');
    imageContainer.className = 'image-container';

    const fallbackColor = CARD_COLORS[idx % CARD_COLORS.length];
    const createColorDiv = () => {
      const d = document.createElement('div');
      d.style.cssText = `width:100%;height:100%;background-color:${fallbackColor};`;
      return d;
    };

    if (item.image_url) {
      const img = document.createElement('img');
      img.src = item.image_url;
      img.alt = item.name || item.deal_title || '';
      img.style.cssText = 'width:100%;height:100%;object-fit:cover;display:block;';
      img.onerror = () => {
        if (img.parentNode) {
          img.parentNode.replaceChild(createColorDiv(), img);
        }
      };
      imageContainer.appendChild(img);
    } else {
      imageContainer.appendChild(createColorDiv());
    }

    if (item.discount_amount) {
      const badge = document.createElement('div');
      badge.className = 'discount-badge';
      badge.textContent = item.discount_amount;
      imageContainer.appendChild(badge);
    }

    const ctaBtn = document.createElement('button');
    ctaBtn.className = 'cta-btn';
    ctaBtn.textContent = 'View Deal';
    if (bridge) {
      ctaBtn.addEventListener('click', () => {
        bridge.sendMessage(`Tell me more about ${item.name || item.deal_title}`);
      });
    }
    imageContainer.appendChild(ctaBtn);

    card.appendChild(imageContainer);

    const info = document.createElement('div');
    info.className = 'deal-info';
    info.style.cssText = `background:${theme?.bg ?? '#1a1a1a'};color:${theme?.fg ?? '#fff'}`;

    const name = document.createElement('h3');
    name.className = 'deal-name';
    name.textContent = item.name || item.deal_title || '';
    info.appendChild(name);

    const desc = document.createElement('p');
    desc.className = 'deal-description';
    desc.textContent = item.description || '';
    info.appendChild(desc);

    if (item.price_from || item.category || item.destination) {
      const priceRow = document.createElement('div');
      priceRow.className = 'price-row';

      if (item.price_from) {
        const salePrice = document.createElement('span');
        salePrice.className = 'sale-price';
        salePrice.textContent = item.price_from;
        priceRow.appendChild(salePrice);
      }

      info.appendChild(priceRow);
    }

    if (item.category || item.destination) {
      const categoryBadge = document.createElement('span');
      categoryBadge.className = 'category-badge';
      categoryBadge.textContent = item.category || item.destination || '';
      info.appendChild(categoryBadge);
    }

    card.appendChild(info);
    carousel.appendChild(card);
  });

  wrapper.appendChild(carousel);

  const leftArrow = document.createElement('button');
  leftArrow.className = 'nav-arrow left hidden';
  leftArrow.setAttribute('aria-label', 'Scroll left');
  leftArrow.textContent = '◀';
  wrapper.appendChild(leftArrow);

  const rightArrow = document.createElement('button');
  rightArrow.className = 'nav-arrow right';
  rightArrow.setAttribute('aria-label', 'Scroll right');
  rightArrow.textContent = '▶';
  wrapper.appendChild(rightArrow);

  const fade = document.createElement('div');
  fade.style.cssText = `position:absolute;top:0;right:0;height:100%;width:60px;background:linear-gradient(to right,transparent,${theme?.bg ?? '#1a1a1a'}cc);pointer-events:none;border-radius:0 10px 10px 0;`;
  wrapper.appendChild(fade);

  block.appendChild(wrapper);

  const updateArrows = () => {
    const atStart = carousel.scrollLeft <= 1;
    const atEnd = carousel.scrollLeft >= carousel.scrollWidth - carousel.clientWidth - 1;
    leftArrow.classList.toggle('hidden', atStart);
    rightArrow.classList.toggle('hidden', atEnd);
  };

  carousel.addEventListener('scroll', updateArrows);
  updateArrows();

  const scrollBy = () => 220 + 16;

  leftArrow.addEventListener('click', () => {
    carousel.scrollBy({ left: -scrollBy(), behavior: 'smooth' });
  });

  rightArrow.addEventListener('click', () => {
    carousel.scrollBy({ left: scrollBy(), behavior: 'smooth' });
  });

  leftArrow.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      carousel.scrollBy({ left: -scrollBy(), behavior: 'smooth' });
    }
  });

  rightArrow.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      carousel.scrollBy({ left: scrollBy(), behavior: 'smooth' });
    }
  });
}