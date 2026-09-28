// Shared by the browser and tools/build-portfolio.mjs. All song data comes from the manifest.
export const escapeHTML = value => String(value).replace(/[&<>"']/g, char => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[char]));

export function validateManifest(data) {
  const fail = () => { throw new Error('Invalid portfolio manifest'); };
  const title = value => typeof value === 'string' && value.trim().length > 0 && value.length <= 160;
  const audio = value => typeof value === 'string' && /^assets\/audio\/[a-z0-9_-]+\.mp3$/.test(value);
  const youtube = value => value == null || value === '' || (typeof value === 'string' && /^https:\/\/(?:www\.)?(?:youtube\.com|youtu\.be)\//i.test(value));
  const unique = values => new Set(values).size === values.length;
  if (!data || data.portfolio_count !== 10 || !Array.isArray(data.works) || data.works.length !== 10) fail();
  if (data.works.some(work => !work || !title(work.title) || !audio(work.audio) || !youtube(work.youtube_url))) fail();
  const titles = data.works.map(work => work.title);
  if (!unique(titles) || !unique(data.works.map(work => work.audio))) fail();
  if (!Array.isArray(data.all_works) || data.all_works.length !== 10 || !unique(data.all_works) || data.all_works.some(value => !titles.includes(value))) fail();
  if (!Array.isArray(data.featured) || data.featured.length !== 5 || !unique(data.featured) || data.featured.some(value => !titles.includes(value))) fail();
  if (!Array.isArray(data.removed) || data.removed.some(value => titles.includes(value))) fail();
  if (!Array.isArray(data.before_after) || data.before_after.length !== 2 || data.before_after.some(pair => !pair || !titles.includes(pair.title) || !audio(pair.before) || !audio(pair.after) || !Number.isFinite(pair.duration_sec) || pair.duration_sec <= 0)) fail();
  if (!data.harmony_demo || !audio(data.harmony_demo.main_only) || !audio(data.harmony_demo.harmony_on)) fail();
  const settings = data.performance;
  if (!settings || settings.audio_preload !== 'none' || settings.one_audio_at_a_time !== true || ['desktop_initial_allworks', 'mobile_initial_allworks'].some(key => !Number.isInteger(settings[key]) || settings[key] < 1 || settings[key] > data.portfolio_count)) fail();
  return data;
}

export function heroWork(data) {
  validateManifest(data);
  return data.works.find(work => work.title === data.featured[0]);
}

const player = (src, label) => `<audio controls preload="none" src="${escapeHTML(src)}" aria-label="${escapeHTML(label)}"></audio>`;
const youtubeLink = work => work.youtube_url ? `<a class="lian-youtube-link" href="${escapeHTML(work.youtube_url)}" target="_blank" rel="noopener" aria-label="${escapeHTML(work.title)}をYouTubeで見る"><span aria-hidden="true">▶</span> YouTubeで作品を見る</a>` : '';
const sample = (label, heading, description, src, name, after = false) => `<article>
  <span class="lian-demo-label${after ? ' lian-after' : ''}">${label}</span>
  <h4>${heading}</h4><p>${description}</p>
  ${player(src, name + ' · ' + heading)}
</article>`;

export function renderPortfolio(data) {
  validateManifest(data);
  const lookup = new Map(data.works.map(work => [work.title, work]));
  const featured = data.featured.map(name => { const work = lookup.get(name); return `<article class="lian-featured-card">
  <div class="lian-work-meta"><span>FEATURED WORK</span><span>VOCAL MIX</span></div>
  <h3>${escapeHTML(name)}</h3>${player(work.audio, name + ' · FEATURED WORK')}${youtubeLink(work)}
</article>`; }).join('\n');
  const comparisons = data.before_after.map((pair, index) => `<article class="lian-demo-set">
  <div class="lian-demo-set-head"><div><span class="lian-demo-kicker">BEFORE / AFTER ${String(index + 1).padStart(2, '0')}</span><h3>${escapeHTML(pair.title)}</h3></div><span class="lian-demo-time">${escapeHTML(pair.duration_sec)} sec</span></div>
  <div class="lian-ab-grid">
    ${sample('BEFORE', 'MIX前', 'ご用意いただいた比較用のBefore音源です。', pair.before, pair.title)}
    <div class="lian-demo-arrow" aria-hidden="true">→</div>
    ${sample('LIAN MIX / AFTER', '完成MIX', '同じ楽曲区間の完成版です。', pair.after, pair.title, true)}
  </div>
</article>`).join('\n');
  const works = data.all_works.map(name => { const work = lookup.get(name); return `<article class="lian-work-card${data.featured.includes(name) ? ' is-featured' : ''}" data-work data-featured="${data.featured.includes(name)}">
  <div class="lian-work-meta"><span>VOCAL MIX</span><span>${data.featured.includes(name) ? 'FEATURED' : 'WORK'}</span></div>
  <h3>${escapeHTML(name)}</h3>${player(work.audio, name + ' · ALL WORKS')}${youtubeLink(work)}
  <div class="lian-tags"><span>MIX</span><span>MASTER</span></div>
</article>`; }).join('\n');
  return `<section class="lian-section lian-featured" aria-labelledby="featured-title">
  <p class="lian-eyebrow">FEATURED WORKS</p>
  <h2 id="featured-title">まずは、Lian MIXを聴いてみてください。</h2>
  <p class="lian-lead">自然な補正、ボーカルの明瞭感、楽曲に合う奥行きと広がりを大切に仕上げています。</p>
  <div class="lian-featured-grid">${featured}</div>
</section>
<section class="lian-section lian-demo-section" aria-labelledby="demo-title">
  <p class="lian-eyebrow">MIX DEMO</p>
  <h2 id="demo-title">MIX前後の違いを、同じ区間で比較できます。</h2>
  <p class="lian-lead">比較しやすいように同じ長さで切り出し、冒頭と末尾には自然なフェードを入れています。</p>
  <div class="lian-demo-tabs" role="tablist" aria-label="MIXデモの種類" hidden>
    <button id="demo-tab-ba" class="is-active" type="button" role="tab" aria-selected="true" aria-controls="demo-panel-ba" tabindex="0" data-demo-tab="ba">BEFORE / AFTER</button>
    <button id="demo-tab-harmony" type="button" role="tab" aria-selected="false" aria-controls="demo-panel-harmony" tabindex="-1" data-demo-tab="harmony">ハモリ生成</button>
  </div>
  <div id="demo-panel-ba" class="lian-demo-panel is-active" role="tabpanel" aria-labelledby="demo-tab-ba" tabindex="0" data-demo-panel="ba">
    ${comparisons}
    <p class="lian-note">※ Before / Afterは同じ楽曲区間を比較しています。試聴用のフェードは音源ファイル自体に適用しています。</p>
  </div>
  <div id="demo-panel-harmony" class="lian-demo-panel" role="tabpanel" aria-labelledby="demo-tab-harmony" tabindex="0" data-demo-panel="harmony">
    <article class="lian-demo-set">
      <div class="lian-demo-set-head"><div><span class="lian-demo-kicker">HARMONY DEMO</span><h3>ハモリ生成の比較</h3></div></div>
      <div class="lian-ab-grid">
        ${sample('MAIN ONLY', 'メインのみ', 'ハモリを加える前の状態です。', data.harmony_demo.main_only, 'ハモリ生成')}
        <div class="lian-demo-arrow" aria-hidden="true">→</div>
        ${sample('HARMONY ON', 'ハモリ生成後', 'メインをもとにハモリを加えた比較です。', data.harmony_demo.harmony_on, 'ハモリ生成', true)}
      </div>
    </article>
    <p class="lian-note">ハモリ生成のほか、録音用のハモリガイド制作もご相談いただけます。</p>
  </div>
</section>
<section class="lian-section lian-allworks" aria-labelledby="allworks-title">
  <p class="lian-eyebrow">ALL WORKS</p><h2 id="allworks-title">Portfolio</h2>
  <p class="lian-lead">現在掲載中の${data.portfolio_count}作品です。代表作以外もこちらから試聴できます。</p>
  <div class="lian-work-grid" id="portfolio-allworks" data-work-grid data-desktop-count="${data.performance.desktop_initial_allworks}" data-mobile-count="${data.performance.mobile_initial_allworks}">${works}</div>
  <div class="lian-more-wrap"><button class="lian-more" type="button" data-more aria-controls="portfolio-allworks" aria-expanded="false" hidden>もっと見る <span aria-hidden="true">＋</span></button></div>
</section>`;
}
