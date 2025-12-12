document.addEventListener('DOMContentLoaded', () => {
  const namesEl = document.getElementById('names');
  const modeEl = document.getElementById('mode');
  const groupCountBox = document.getElementById('groupCountBox');
  const groupSizeBox = document.getElementById('groupSizeBox');
  const groupCountEl = document.getElementById('groupCount');
  const groupSizeEl = document.getElementById('groupSize');
  const keepOrderEl = document.getElementById('keepOrder');

  const btnSplit = document.getElementById('btnSplit');
  const btnCopy = document.getElementById('btnCopy');
  const btnClear = document.getElementById('btnClear');

  const outputEl = document.getElementById('output');
  const statusEl = document.getElementById('status');

  const parseNames = (raw) => {
    // 支援：每行、逗號、頓號、空白分隔
    const parts = raw
      .replace(/，/g, ',')
      .split(/\n|,|\s+/g)
      .map(s => s.trim())
      .filter(Boolean);

    // 去除重複（保留第一次出現）
    const seen = new Set();
    const unique = [];
    for (const p of parts) {
      const key = p.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(p);
      }
    }
    return unique;
  };

  const shuffle = (arr) => {
    // Fisher–Yates
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  };

  const renderGroups = (groups) => {
    outputEl.innerHTML = '';
    groups.forEach((members, idx) => {
      const box = document.createElement('div');
      box.className = 'group';
      const title = document.createElement('h3');
      title.textContent = `第 ${idx + 1} 組（${members.length} 人）`;
      box.appendChild(title);

      if (members.length === 0) {
        const empty = document.createElement('div');
        empty.style.color = '#aaa';
        empty.textContent = '（空）';
        box.appendChild(empty);
      } else {
        members.forEach(name => {
          const pill = document.createElement('span');
          pill.className = 'pill';
          pill.textContent = name;
          box.appendChild(pill);
        });
      }

      outputEl.appendChild(box);
    });
  };

  const buildGroups = (names, mode, groupCount, groupSize) => {
    const total = names.length;

    let k = 0; // 組數
    if (mode === 'groupCount') {
      k = Math.max(1, Math.min(total || 1, groupCount));
    } else {
      const size = Math.max(1, groupSize);
      k = Math.max(1, Math.ceil(total / size));
    }

    const groups = Array.from({ length: k }, () => []);

    // 輪流發牌（讓各組人數差最多 1）
    names.forEach((name, i) => {
      groups[i % k].push(name);
    });

    return groups;
  };

  const toText = (groups) => {
    return groups
      .map((g, i) => `第 ${i + 1} 組（${g.length} 人）: ${g.join('、')}`)
      .join('\n');
  };

  const splitNow = () => {
    const names = parseNames(namesEl.value);
    if (names.length === 0) {
      statusEl.textContent = '請先輸入至少 1 個名字。';
      outputEl.innerHTML = '';
      return;
    }

    const mode = modeEl.value;
    const groupCount = parseInt(groupCountEl.value || '1', 10);
    const groupSize = parseInt(groupSizeEl.value || '1', 10);

    const working = names.slice();
    if (!keepOrderEl.checked) shuffle(working);

    const groups = buildGroups(working, mode, groupCount, groupSize);
    renderGroups(groups);

    statusEl.textContent = `完成：共 ${names.length} 人，分成 ${groups.length} 組。`;
    outputEl.dataset.clipboard = toText(groups);
  };

  modeEl.addEventListener('change', () => {
    const isCount = modeEl.value === 'groupCount';
    groupCountBox.style.display = isCount ? '' : 'none';
    groupSizeBox.style.display = isCount ? 'none' : '';
  });

  btnSplit.addEventListener('click', splitNow);

  btnCopy.addEventListener('click', async () => {
    const text = outputEl.dataset.clipboard || '';
    if (!text) {
      statusEl.textContent = '目前沒有結果可複製，請先分組。';
      return;
    }
    try {
      await navigator.clipboard.writeText(text);
      statusEl.textContent = '已複製分組結果到剪貼簿 ✅';
    } catch (e) {
      // fallback
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      statusEl.textContent = '已複製分組結果到剪貼簿 ✅';
    }
  });

  btnClear.addEventListener('click', () => {
    namesEl.value = '';
    outputEl.innerHTML = '';
    outputEl.dataset.clipboard = '';
    statusEl.textContent = '已清空。';
  });

  // Enter 快捷：Ctrl/Cmd + Enter 直接分組
  namesEl.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') splitNow();
  });
});
