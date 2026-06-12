// Sample data for standalone/preview mode.
// In production, data comes dynamically from bridge.toolResult.
const SAMPLE_DATA = {
  name: 'Customized Cash Rewards Credit Card',
  description: 'Earn 6% cash back in the category of your choice for the first year, plus 2% at grocery stores and wholesale clubs.',
  image_url: 'https://www.bankofamerica.com/content/images/ContextualSiteGraphics/CreditCardArt/en_US/Approved_PCM/8ckn_cshsigcm_v_300x188.png',
  price: '$0 annual fee',
  category: 'Credit Card'
};

// Brand palette from BuildWidgetRequest
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
    const mid=(lo+hi)/2;
    if (relLum(Math.round(r*mid),Math.round(g*mid),Math.round(b*mid)) > 0.12) hi=mid; else lo=mid;
  }
  const dr=Math.round(r*lo), dg=Math.round(g*lo), db=Math.round(b*lo);
  return { bg:`#${dr.toString(16).padStart(2,'0')}${dg.toString(16).padStart(2,'0')}${db.toString(16).padStart(2,'0')}`, fg:'#ffffff' };
}

const theme = getThemedCardBg(PALETTE);

export default async function decorate(block, bridge) {
  let product;

  if (bridge) {
    bridge.applyHostStyles();
    const isPreview = bridge.hostContext?.preview === true;
    if (isPreview) {
      product = SAMPLE_DATA;
    } else {
      const _result = await bridge.toolResult;
      const structuredContent = _result?.structuredContent || _result;
      product = structuredContent;
    }
  } else {
    product = SAMPLE_DATA;
  }

  block.textContent = '';
  renderProduct(block, product, bridge);

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

function renderProduct(block, product, bridge) {
  if (!product) return;

  const card = document.createElement('div');
  card.className = 'detail-card';

  const imageSection = document.createElement('div');
  imageSection.className = 'image-section';

  const CARD_COLORS = ['#0053c2','#012169','#a50e28','#378ef0','#9256d9'];
  const fallbackColor = CARD_COLORS[0];

  const colorDiv = () => {
    const d = document.createElement('div');
    d.className = 'image-fallback';
    d.style.cssText = `width:100%;height:100%;background-color:${fallbackColor};`;
    return d;
  };

  if (product.image_url) {
    const img = document.createElement('img');
    img.src = product.image_url;
    img.alt = product.name || 'Product image';
    img.onerror = () => img.parentNode.replaceChild(colorDiv(), img);
    imageSection.appendChild(img);
  } else {
    imageSection.appendChild(colorDiv());
  }

  const ctaBtn = document.createElement('button');
  ctaBtn.className = 'cta-btn';
  ctaBtn.textContent = 'Learn More';
  ctaBtn.setAttribute('aria-label', `Learn more about ${product.name || 'this product'}`);
  if (bridge) {
    ctaBtn.addEventListener('click', () => {
      bridge.sendMessage(`Tell me more about ${product.name}`);
    });
  }
  imageSection.appendChild(ctaBtn);

  card.appendChild(imageSection);

  const contentSection = document.createElement('div');
  contentSection.className = 'content-section';
  contentSection.style.cssText = `background:${theme?.bg ?? '#001845'};color:${theme?.fg ?? '#ffffff'}`;

  const name = document.createElement('h2');
  name.className = 'product-name';
  name.textContent = product.name || '';
  contentSection.appendChild(name);

  if (product.description) {
    const desc = document.createElement('p');
    desc.className = 'product-description';
    desc.textContent = product.description;
    contentSection.appendChild(desc);
  }

  if (product.price || product.monthly_fee) {
    const priceEl = document.createElement('div');
    priceEl.className = 'product-price';
    priceEl.textContent = product.price || product.monthly_fee || '';
    contentSection.appendChild(priceEl);
  }

  if (product.category) {
    const badge = document.createElement('span');
    badge.className = 'category-badge';
    badge.textContent = product.category;
    contentSection.appendChild(badge);
  }

  card.appendChild(contentSection);
  block.appendChild(card);
}
