const SAMPLE_DATA = [
  {
    name: 'Customized Cash Rewards Credit Card',
    description: 'Earn 6% cash back in the category of your choice for the first year, plus 2% at grocery stores and wholesale clubs.',
    image_url: 'https://www.bankofamerica.com/content/images/ContextualSiteGraphics/CreditCardArt/en_US/Approved_PCM/8ckn_cshsigcm_v_300x188.png',
    price: '$0 annual fee',
    category: 'Credit Card'
  },
  {
    name: 'Unlimited Cash Rewards Credit Card',
    description: 'Earn unlimited 1.5% cash back on all purchases with no annual fee.',
    image_url: 'https://www.bankofamerica.com/content/images/ContextualSiteGraphics/CreditCardArt/en_US/Approved_PCM/bofa_ucr_fifa_8284155_e_300.png',
    price: '$0 annual fee',
    category: 'Credit Card'
  },
  {
    name: 'Advantage SafeBalance Banking',
    description: 'Simple digital banking experience with no overdraft item fees, ideal for students and young adults.',
    price: '$4.95/month or $0',
    category: 'Checking'
  },
  {
    name: 'Advantage Plus Banking',
    description: 'Flexible banking with multiple ways to waive the monthly maintenance fee including direct deposit.',
    price: '$12/month or $0',
    category: 'Checking'
  },
  {
    name: 'Advantage Relationship Banking',
    description: 'Comprehensive banking that earns interest with no fees on select banking services.',
    price: '$25/month or $0',
    category: 'Checking'
  }
];

const PALETTE = ['#0053c2', '#012169', '#a50e28', '#555555', '#696969'];

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
    const mid=(lo+hi)/2;
    if (relLum(Math.round(r*mid),Math.round(g*mid),Math.round(b*mid)) > 0.12) hi=mid; else lo=mid;
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
      // structuredContent.products — bare array outputSchema; key derived from actionName "list_banking_products"
      items = structuredContent?.products || [];
    }
  } else {
    items = SAMPLE_DATA;
  }

  block.textContent = '';
  renderCarousel(block, items, bridge);

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

function renderCarousel(block, items, bridge) {
  const wrapper = document.createElement('div');
  wrapper.className = 'carousel-wrapper';

  const container = document.createElement('div');
  container.className = 'carousel-container';

  const CARD_COLORS = ['#378ef0','#9256d9','#0fb5ae','#e68619','#d83790','#2dca72','#4046ca','#72b340'];

  items.slice(0, 5).forEach((item, i) => {
    const card = document.createElement('div');
    card.className = 'product-card';

    const imageSection = document.createElement('div');
    imageSection.className = 'image-section';

    const fallbackColor = CARD_COLORS[i % CARD_COLORS.length];
    const colorDiv = () => {
      const d = document.createElement('div');
      d.style.cssText = `width:100%;height:100%;background-color:${fallbackColor};`;
      return d;
    };

    if (item.image_url) {
      const img = document.createElement('img');
      img.src = item.image_url;
      img.alt = item.name || '';
      img.style.cssText = 'width:100%;height:100%;object-fit:cover;display:block;';
      img.onerror = () => img.parentNode.replaceChild(colorDiv(), img);
      imageSection.appendChild(img);
    } else {
      imageSection.appendChild(colorDiv());
    }

    const ctaBtn = document.createElement('button');
    ctaBtn.className = 'cta-on-image';
    ctaBtn.textContent = 'View Details';
    if (bridge) {
      ctaBtn.addEventListener('click', () => {
        bridge.sendMessage(`Tell me more about ${item.name}`);
      });
    }
    imageSection.appendChild(ctaBtn);

    card.appendChild(imageSection);

    const contentSection = document.createElement('div');
    contentSection.className = 'content-section';
    contentSection.style.cssText = `background:${theme?.bg ?? '#1a1a1a'};color:${theme?.fg ?? '#fff'}`;

    const name = document.createElement('div');
    name.className = 'product-name';
    name.textContent = item.name;
    contentSection.appendChild(name);

    const price = document.createElement('div');
    price.className = 'product-price';
    price.textContent = item.price || '';
    contentSection.appendChild(price);

    if (item.category) {
      const badge = document.createElement('span');
      badge.className = 'category-badge';
      badge.textContent = item.category;
      contentSection.appendChild(badge);
    }

    card.appendChild(contentSection);
    container.appendChild(card);
  });

  const leftArrow = document.createElement('button');
  leftArrow.className = 'nav-arrow left-arrow';
  leftArrow.innerHTML = '&#9664;';
  leftArrow.setAttribute('aria-label', 'Scroll left');
  leftArrow.style.display = 'none';

  const rightArrow = document.createElement('button');
  rightArrow.className = 'nav-arrow right-arrow';
  rightArrow.innerHTML = '&#9654;';
  rightArrow.setAttribute('aria-label', 'Scroll right');

  const updateArrows = () => {
    leftArrow.style.display = container.scrollLeft <= 0 ? 'none' : 'block';
    rightArrow.style.display = container.scrollLeft + container.clientWidth >= container.scrollWidth - 1 ? 'none' : 'block';
  };

  leftArrow.addEventListener('click', () => {
    container.scrollBy({ left: -220, behavior: 'smooth' });
  });

  rightArrow.addEventListener('click', () => {
    container.scrollBy({ left: 220, behavior: 'smooth' });
  });

  container.addEventListener('scroll', updateArrows);

  const fade = document.createElement('div');
  fade.className = 'fade-overlay';
  fade.style.cssText = `position:absolute;top:0;right:0;height:100%;width:60px;background:linear-gradient(to right,transparent,${theme?.bg ?? '#1a1a1a'}cc);pointer-events:none;border-radius:0 10px 10px 0;`;

  wrapper.appendChild(container);
  wrapper.appendChild(leftArrow);
  wrapper.appendChild(rightArrow);
  wrapper.appendChild(fade);

  block.appendChild(wrapper);

  setTimeout(updateArrows, 100);
}
