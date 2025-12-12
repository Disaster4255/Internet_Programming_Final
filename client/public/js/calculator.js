document.addEventListener('DOMContentLoaded', () => {
  const displayEl = document.getElementById('display');
  const exprEl = document.getElementById('expr');
  const keys = document.querySelectorAll('button.key');

  let current = '0';
  let expr = '';
  let justEvaluated = false;

  const update = () => {
    displayEl.textContent = current;
    exprEl.textContent = expr;
  };

  const reset = () => {
    current = '0';
    expr = '';
    justEvaluated = false;
    update();
  };

  const backspace = () => {
    if (justEvaluated) return;
    if (current.length <= 1 || (current.length === 2 && current.startsWith('-'))) {
      current = '0';
    } else {
      current = current.slice(0, -1);
    }
    update();
  };

  const appendNum = (n) => {
    if (justEvaluated) {
      // 重新開始一個新數字
      current = '0';
      expr = '';
      justEvaluated = false;
    }
    if (current === '0') current = n;
    else current += n;
    update();
  };

  const dot = () => {
    if (justEvaluated) {
      current = '0';
      expr = '';
      justEvaluated = false;
    }
    if (!current.includes('.')) current += '.';
    update();
  };

  const setOp = (op) => {
    if (justEvaluated) {
      // 以結果繼續算
      justEvaluated = false;
    }
    // 如果 current 有值，把它推進 expr
    if (current !== '') {
      expr += (expr ? ' ' : '') + current;
      current = '';
    }

    // 避免連續 operator：若 expr 最後是 operator，就替換
    expr = expr.replace(/\s[+\-*/]$/g, '');
    expr += ' ' + op;

    update();
  };

  const percent = () => {
    // %：把 current 變成 current/100
    if (current === '' || current === '-') return;
    const v = Number(current);
    if (!Number.isFinite(v)) return;
    current = String(v / 100);
    update();
  };

  const safeEval = (raw) => {
    // 只允許數字、空白、+-*/. 和負號
    if (!/^[0-9\s+\-*/.]+$/.test(raw)) return null;
    try {
      // eslint-disable-next-line no-new-func
      const fn = new Function('return (' + raw + ')');
      const r = fn();
      if (!Number.isFinite(r)) return null;
      // 避免超長小數
      return String(Math.round(r * 1e10) / 1e10);
    } catch {
      return null;
    }
  };

  const equal = () => {
    // 把 current 推進 expr
    let full = expr;
    if (current !== '' && current !== '-') {
      full += (full ? ' ' : '') + current;
    }
    // 沒有足夠資訊
    if (!full.trim()) return;

    // expr 用於顯示，eval 用於計算
    const raw = full.replace(/\s+/g, ' ').trim();
    const result = safeEval(raw);

    if (result === null) {
      current = 'Error';
      justEvaluated = true;
      expr = raw;
      update();
      return;
    }

    expr = raw + ' =';
    current = result;
    justEvaluated = true;
    update();
  };

  keys.forEach(btn => {
    btn.addEventListener('click', () => {
      const num = btn.dataset.num;
      const op = btn.dataset.op;
      const action = btn.dataset.action;

      if (num !== undefined) return appendNum(num);
      if (op !== undefined) return setOp(op);

      switch (action) {
        case 'clear': return reset();
        case 'back': return backspace();
        case 'dot': return dot();
        case 'percent': return percent();
        case 'equal': return equal();
      }
    });
  });

  // Keyboard support
  window.addEventListener('keydown', (e) => {
    const k = e.key;

    if (k >= '0' && k <= '9') return appendNum(k);
    if (k === '.') return dot();
    if (k === 'Escape') return reset();
    if (k === 'Backspace') return backspace();

    if (k === 'Enter' || k === '=') {
      e.preventDefault();
      return equal();
    }
    if (k === '+' || k === '-' || k === '*' || k === '/') return setOp(k);
    if (k === '%') return percent();
  });

  reset();
});
