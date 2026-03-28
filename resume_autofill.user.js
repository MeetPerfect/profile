// ==UserScript==
// @name         秋招简历自动填写助手
// @namespace    http://tampermonkey.net/
// @version      2.0.0
// @description  读取本地 profile.json 个人信息，自动填写各大公司招聘官网简历表单（适配 beisen 等 React 自定义组件）
// @author       你的名字
// @match        *://beisen.zhiye.com/*
// @match        *://*.beisen.com/*
// @match        *://*.zhiye.com/*
// @match        *://*.taou.com/*
// @match        *://*.lagou.com/*
// @match        *://*.liepin.com/*
// @match        *://*.zhaopin.com/*
// @match        *://*.51job.com/*
// @match        *://*.bosszhipin.com/*
// @match        *://*.meituan.com/*
// @match        *://*.bytedance.com/*
// @match        *://*.tencent.com/*
// @match        *://*.alibaba-inc.com/*
// @match        *://*.huawei.com/*
// @match        *://*.baidu.com/*
// @match        *://*.jd.com/*
// @match        *://*.xiaomi.com/*
// @match        *://*.didi.com/*
// @match        *://*.pinduoduo.com/*
// @match        *://*.netease.com/*
// @match        *://*.bilibili.com/*
// @match        *://*.mihoyo.com/*
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_deleteValue
// @grant        GM_registerMenuCommand
// @grant        GM_addStyle
// @run-at       document-idle
// ==/UserScript==

(function () {
  'use strict';

  const STORAGE_KEY = 'resume_profile_v1';

  // ============================================================
  //  数据读写
  // ============================================================
  function getProfile() {
    const raw = GM_getValue(STORAGE_KEY, null);
    if (!raw) return null;
    try { return JSON.parse(raw); } catch { return null; }
  }

  // ============================================================
  //  核心：React 受控组件赋值 + 事件触发
  // ============================================================
  function setNativeValue(el, value) {
    const proto = el.tagName === 'TEXTAREA'
      ? window.HTMLTextAreaElement.prototype
      : window.HTMLInputElement.prototype;
    const setter = Object.getOwnPropertyDescriptor(proto, 'value')?.set;
    if (setter) setter.call(el, String(value));
    else el.value = String(value);
  }

  function triggerAll(el) {
    ['input', 'change', 'blur'].forEach(t =>
      el.dispatchEvent(new Event(t, { bubbles: true }))
    );
  }

  function fillEl(el, value) {
    if (!el || value === null || value === undefined || value === '') return false;
    el.focus();
    setNativeValue(el, value);
    triggerAll(el);
    return true;
  }

  // ============================================================
  //  策略1：通过 label 文字精确匹配，向上爬父级找同容器内 input
  //  适配 beisen 等 label[for=""] 为空的 React 表单
  // ============================================================
  function fillByLabelText(labelText, value, exact = true) {
    if (value === null || value === undefined || value === '') return false;
    const labels = Array.from(document.querySelectorAll('label'));
    for (const label of labels) {
      const text = label.textContent.trim();
      const matched = exact ? text === labelText : text.includes(labelText);
      if (!matched) continue;

      // 先找 label 内部
      let input = label.querySelector('input:not([type=hidden]), textarea');
      if (input) return fillEl(input, value) && log(`✅ [label内] "${labelText}" => ${value}`) || true;

      // 找 label 后的兄弟元素
      let sib = label.nextElementSibling;
      while (sib) {
        input = (sib.tagName === 'INPUT' || sib.tagName === 'TEXTAREA')
          ? sib : sib.querySelector('input:not([type=hidden]), textarea');
        if (input) return fillEl(input, value) && log(`✅ [label兄弟] "${labelText}" => ${value}`) || true;
        sib = sib.nextElementSibling;
      }

      // 向上找父容器，再在容器内找 input（最多爬 6 层）
      let parent = label.parentElement;
      for (let i = 0; i < 6; i++) {
        if (!parent) break;
        // 找父容器内所有 input，排除 label 自身包含的
        const inputs = Array.from(parent.querySelectorAll('input:not([type=hidden]), textarea'));
        const target = inputs.find(el => !label.contains(el));
        if (target) return fillEl(target, value) && log(`✅ [父容器${i+1}层] "${labelText}" => ${value}`) || true;
        parent = parent.parentElement;
      }

      log(`⚠️ 找到label "${labelText}" 但未找到关联input`);
    }
    log(`⚠️ 未找到label: "${labelText}"`);
    return false;
  }

  // ============================================================
  //  策略2：通过 placeholder 匹配（兜底）
  // ============================================================
  function fillByPlaceholder(keywords, value) {
    if (!value) return false;
    const kws = Array.isArray(keywords) ? keywords : [keywords];
    for (const el of document.querySelectorAll('input:not([type=hidden]), textarea')) {
      if (kws.some(k => (el.placeholder || '').includes(k))) {
        return fillEl(el, value) && log(`✅ [placeholder] [${kws}] => ${value}`) || true;
      }
    }
    return false;
  }

  // 组合：先 label 精确匹配，再 placeholder 兜底
  function fill(labelText, value, placeholderKeys) {
    if (fillByLabelText(labelText, value)) return;
    if (placeholderKeys) fillByPlaceholder(placeholderKeys, value);
  }

  // ============================================================
  //  各模块填写
  // ============================================================
  function fillBasic(p) {
    const b = p['个人信息'];
    if (!b) return;
    fill('姓名',         b['姓名'],         ['姓名', '名字']);
    fill('邮箱',         b['邮箱'],         ['邮箱', 'Email', 'email']);
    fill('手机号码',     b['手机号码'],     ['手机', '电话']);
    fill('证件号码',     b['证件号码'],     ['身份证', '证件号']);
    fill('出生日期',     b['出生日期'],     ['出生日期', '生日']);
    fill('身高(厘米)',   String(b['身高(厘米)']), ['身高']);
    fill('体重(公斤)',   String(b['体重(公斤)']), ['体重']);
    fill('紧急联系人',   b['紧急联系人'],   ['紧急联系人']);
    fill('紧急联系电话', b['紧急联系电话'], ['紧急联系电话', '紧急电话']);
    fill('QQ',           b['QQ'],           ['QQ']);
    fill('微信',         b['微信'],         ['微信', 'WeChat']);
    fill('自我评价',     b['自我评价'],     ['自我评价', '自我介绍', '个人简介']);
    fill('英语等级成绩', b['英语等级成绩'], ['英语成绩', '等级成绩']);
    fill('毕业时间',     b['毕业时间'],     ['毕业时间', '预计毕业']);
    // 籍贯/现居住地/户口 beisen 通常是级联选择器，文本框填写
    fill('籍贯',         b['籍贯'],         ['籍贯']);
    fill('现居住地',     b['现居住地'],     ['现居住地', '居住地']);
    fill('户口所在地',   b['户口所在地'],   ['户口', '户籍']);
  }

  function fillEducation(p) {
    const list = p['教育经历'];
    if (!list?.length) return;
    list.forEach(edu => {
      fill('学校名称',             edu['学校名称'],             ['学校', '院校']);
      fill('所在校区/分校（全称）', edu['所在校区/分校（全称）'], ['校区', '分校全称']);
      fill('所在校区/分校地址',    edu['所在校区/分校地址'],    ['校区地址', '分校地址']);
      fill('学院名称',             edu['学院名称'],             ['学院']);
      fill('专业名称',             edu['专业名称'],             ['专业名称', '专业']);
      fill('专业类别',             edu['专业类别'],             ['专业类别']);
      fill('成绩(GPA)',            edu['成绩(GPA)'],            ['GPA', '成绩', '绩点']);
      fill('专业排名',             edu['专业排名'],             ['专业排名', '排名']);
      fill('专业课程',             edu['专业课程'],             ['专业课程', '主修课程']);
    });
  }

  function fillInternship(p) {
    const list = p['实习经历'];
    if (!list?.length) return;
    list.forEach(item => {
      fill('单位名称', item['单位名称'], ['单位名称', '公司名称']);
      fill('实习内容', item['实习内容'], ['实习内容', '工作内容']);
    });
  }

  function fillLanguages(p) {
    const list = p['语言能力'];
    if (!list?.length) return;
    list.forEach(lang => {
      fill('语言类型', lang['语言类型'], ['语言类型', '语言']);
      fill('听说',     lang['听说'],     ['听说']);
      fill('读写',     lang['读写'],     ['读写']);
    });
  }

  function fillCertificates(p) {
    const list = p['证书'];
    if (!list?.length) return;
    list.forEach(cert => {
      fill('证书名称', cert['证书名称'], ['证书名称', '证书']);
      fill('证书描述', cert['证书描述'], ['证书描述', '描述']);
    });
  }

  function fillSkills(p) {
    const list = p['技能'];
    if (!list?.length) return;
    list.forEach(skill => {
      fill('技能名称', skill['技能名称'], ['技能名称', '技能']);
      fill('技能描述', skill['技能描述'], ['技能描述', '描述']);
    });
  }

  function fillFamily(p) {
    const list = p['家庭情况'];
    if (!list?.length) return;
    // 家庭成员的"姓名"与个人信息的"姓名"label重名，用 index 区分
    const familyLabels = Array.from(document.querySelectorAll('label'))
      .filter(l => l.textContent.trim() === '姓名');
    list.forEach((member, i) => {
      // 跳过第一个（个人信息的姓名），从后面的开始
      const label = familyLabels[i + 1];
      if (label) {
        let parent = label.parentElement;
        for (let j = 0; j < 6; j++) {
          if (!parent) break;
          const inputs = Array.from(parent.querySelectorAll('input:not([type=hidden])'));
          const target = inputs.find(el => !label.contains(el));
          if (target) { fillEl(target, member['姓名']); break; }
          parent = parent.parentElement;
        }
      }
      fill('与本人关系', member['与本人关系'], ['关系', '与本人关系']);
    });
  }

  // ============================================================
  //  主入口
  // ============================================================
  function autoFill() {
    const profile = getProfile();
    if (!profile) {
      showToast('⚠️ 未找到个人信息，请先点击 📋 → 导入个人信息', 'warn');
      return;
    }
    console.log('[简历助手] 开始填写...');
    fillBasic(profile);
    fillEducation(profile);
    fillInternship(profile);
    fillLanguages(profile);
    fillCertificates(profile);
    fillSkills(profile);
    fillFamily(profile);
    showToast('✅ 填写完成！下拉框（性别/学历等）请手动选择，检查后再提交', 'success');
    console.log('[简历助手] 填写完毕');
  }

  function log(...args) { console.log('[简历助手]', ...args); }

  // ============================================================
  //  数据管理
  // ============================================================
  function importProfile() { showImportPanel(); }

  function clearProfile() {
    if (!confirm('确认清除已保存的个人信息？')) return;
    GM_deleteValue(STORAGE_KEY);
    showToast('🗑️ 已清除', 'info');
  }

  function previewProfile() {
    const p = getProfile();
    if (!p) { showToast('⚠️ 尚未导入个人信息', 'warn'); return; }
    showPreviewPanel(p);
  }

  // ============================================================
  //  样式
  // ============================================================
  GM_addStyle(`
    #_rfab {
      position:fixed;bottom:32px;right:32px;z-index:2147483640;
      width:52px;height:52px;border-radius:50%;background:#4f46e5;
      color:#fff;font-size:22px;border:none;cursor:pointer;
      box-shadow:0 4px 16px rgba(79,70,229,.45);
      display:flex;align-items:center;justify-content:center;
      transition:background .2s;
    }
    #_rfab:hover{background:#4338ca;}
    #_rmenu {
      position:fixed;bottom:94px;right:32px;z-index:2147483641;
      background:#fff;border-radius:12px;
      box-shadow:0 4px 24px rgba(0,0,0,.15);
      overflow:hidden;min-width:180px;display:none;
    }
    #_rmenu.open{display:block;}
    ._rmi {
      padding:12px 18px;font-size:14px;cursor:pointer;
      color:#1e1e2e;display:flex;align-items:center;gap:8px;
      transition:background .12s;font-family:-apple-system,sans-serif;
    }
    ._rmi:hover{background:#f5f5ff;}
    #_rovl {
      position:fixed;inset:0;background:rgba(0,0,0,.35);
      z-index:2147483639;display:none;
    }
    #_rovl.open{display:block;}
    #_rpanel,#_rpreview {
      position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);
      z-index:2147483642;background:#fff;border-radius:14px;
      box-shadow:0 8px 40px rgba(0,0,0,.18);padding:28px 32px;
      width:500px;max-width:96vw;font-family:-apple-system,sans-serif;color:#1e1e2e;
    }
    #_rpreview{max-height:80vh;overflow-y:auto;}
    ._rh2{margin:0 0 14px;font-size:17px;font-weight:700;color:#4f46e5;}
    ._rdesc{font-size:13px;color:#666;margin:0 0 10px;line-height:1.6;}
    #_rpanel textarea {
      width:100%;height:220px;border:1.5px solid #d4d4e8;
      border-radius:8px;padding:10px;font-size:12px;font-family:monospace;
      resize:vertical;box-sizing:border-box;outline:none;
    }
    #_rpanel textarea:focus{border-color:#4f46e5;}
    ._rstatus{font-size:12px;margin-top:6px;min-height:16px;}
    ._rbtns{display:flex;gap:10px;margin-top:14px;justify-content:flex-end;}
    ._rbtn {
      padding:8px 20px;border-radius:8px;border:none;cursor:pointer;
      font-size:14px;font-weight:600;transition:opacity .15s;
    }
    ._rbtn:hover{opacity:.85;}
    ._rbtn.pri{background:#4f46e5;color:#fff;}
    ._rbtn.sec{background:#f0f0f8;color:#4f46e5;}
    ._psec{margin-bottom:14px;}
    ._psec h3{font-size:13px;color:#6366f1;margin:0 0 6px;
      padding-bottom:4px;border-bottom:1px solid #e0e0f5;}
    ._prow{display:flex;gap:8px;font-size:13px;padding:3px 0;}
    ._pk{color:#888;min-width:120px;flex-shrink:0;}
    ._pv{color:#1e1e2e;word-break:break-all;}
    ._pitem{margin-bottom:8px;padding-left:8px;border-left:3px solid #e0e0f5;}
    ._pno{font-size:12px;color:#bbb;margin-bottom:4px;}
    ._toast {
      position:fixed;bottom:100px;left:50%;transform:translateX(-50%);
      z-index:2147483643;padding:12px 24px;border-radius:10px;
      font-size:14px;font-weight:600;color:#fff;pointer-events:none;
      box-shadow:0 4px 16px rgba(0,0,0,.15);white-space:nowrap;
      animation:_rfadein .25s ease;font-family:-apple-system,sans-serif;
    }
    ._toast.success{background:#16a34a;}
    ._toast.warn{background:#d97706;}
    ._toast.info{background:#2563eb;}
    @keyframes _rfadein{from{opacity:0;bottom:80px}to{opacity:1;bottom:100px}}
  `);

  // ============================================================
  //  UI 组件
  // ============================================================
  function closeAll() {
    document.getElementById('_rovl')?.classList.remove('open');
    document.getElementById('_rmenu')?.classList.remove('open');
    document.getElementById('_rpanel')?.remove();
    document.getElementById('_rpreview')?.remove();
  }

  // 悬浮按钮
  const fab = document.createElement('button');
  fab.id = '_rfab'; fab.title = '简历自动填写'; fab.textContent = '📋';
  document.body.appendChild(fab);

  // 遮罩
  const ovl = document.createElement('div');
  ovl.id = '_rovl';
  ovl.addEventListener('click', closeAll);
  document.body.appendChild(ovl);

  // 菜单
  const menu = document.createElement('div');
  menu.id = '_rmenu';
  menu.innerHTML = `
    <div class="_rmi" id="_rmi_fill">🚀 自动填写当前页面</div>
    <div class="_rmi" id="_rmi_import">📥 导入 / 更新个人信息</div>
    <div class="_rmi" id="_rmi_preview">👁️ 预览已保存信息</div>
    <div class="_rmi" id="_rmi_clear">🗑️ 清除已保存信息</div>
  `;
  document.body.appendChild(menu);

  fab.addEventListener('click', () => {
    menu.classList.toggle('open');
    ovl.classList.toggle('open');
  });

  document.getElementById('_rmi_fill').addEventListener('click',    () => { closeAll(); autoFill(); });
  document.getElementById('_rmi_import').addEventListener('click',  () => { closeAll(); importProfile(); });
  document.getElementById('_rmi_preview').addEventListener('click', () => { closeAll(); previewProfile(); });
  document.getElementById('_rmi_clear').addEventListener('click',   () => { closeAll(); clearProfile(); });

  // 快捷键 Alt+F 触发填写，Alt+I 触发导入
  document.addEventListener('keydown', e => {
    if (e.altKey && e.key === 'f') { e.preventDefault(); autoFill(); }
    if (e.altKey && e.key === 'i') { e.preventDefault(); importProfile(); }
  });

  // 油猴菜单
  GM_registerMenuCommand('🚀 自动填写（Alt+F）',    autoFill);
  GM_registerMenuCommand('📥 导入个人信息（Alt+I）', importProfile);
  GM_registerMenuCommand('👁️ 预览已保存信息',        previewProfile);
  GM_registerMenuCommand('🗑️ 清除已保存信息',        clearProfile);

  // 导入面板
  function showImportPanel() {
    document.getElementById('_rpanel')?.remove();
    const existing = getProfile();
    const panel = document.createElement('div');
    panel.id = '_rpanel';
    panel.innerHTML = `
      <div class="_rh2">📥 导入个人信息</div>
      <p class="_rdesc">
        将 <b>profile.json</b> 文件全部内容复制后粘贴到下方，点击保存。<br>
        保存成功后，按 <b>Alt+F</b> 或点击 📋 → 🚀 即可自动填写。
      </p>
      <textarea id="_rjson" placeholder="在此粘贴 profile.json 内容...">${existing ? JSON.stringify(existing, null, 2) : ''}</textarea>
      <div class="_rstatus" id="_rstatus"></div>
      <div class="_rbtns">
        <button class="_rbtn sec" id="_rbcancel">取消</button>
        <button class="_rbtn pri" id="_rbsave">💾 保存</button>
      </div>
    `;
    document.body.appendChild(panel);
    ovl.classList.add('open');

    const ta = document.getElementById('_rjson');
    const st = document.getElementById('_rstatus');
    ta.addEventListener('input', () => {
      try {
        JSON.parse(ta.value);
        st.style.color = '#16a34a'; st.textContent = '✅ JSON 格式正确';
      } catch(e) {
        st.style.color = '#dc2626'; st.textContent = '❌ ' + e.message;
      }
    });
    document.getElementById('_rbcancel').addEventListener('click', closeAll);
    document.getElementById('_rbsave').addEventListener('click', () => {
      try {
        JSON.parse(ta.value.trim());
        GM_setValue(STORAGE_KEY, ta.value.trim());
        closeAll();
        showToast('✅ 个人信息保存成功！按 Alt+F 开始填写', 'success');
      } catch(e) {
        st.style.color = '#dc2626'; st.textContent = '❌ 保存失败：' + e.message;
      }
    });
  }

  // 预览面板
  function showPreviewPanel(p) {
    document.getElementById('_rpreview')?.remove();
    const panel = document.createElement('div');
    panel.id = '_rpreview';
    let html = '<div class="_rh2">👁️ 已保存的个人信息</div>';

    function sec(title, data) {
      if (!data) return '';
      let s = `<div class="_psec"><h3>${title}</h3>`;
      if (Array.isArray(data)) {
        data.forEach((item, i) => {
          s += `<div class="_pitem"><div class="_pno">#${i+1}</div>`;
          Object.entries(item).forEach(([k,v]) =>
            s += `<div class="_prow"><span class="_pk">${k}</span><span class="_pv">${v}</span></div>`
          );
          s += '</div>';
        });
      } else {
        Object.entries(data).forEach(([k,v]) =>
          s += `<div class="_prow"><span class="_pk">${k}</span><span class="_pv">${v}</span></div>`
        );
      }
      return s + '</div>';
    }

    html += sec('个人信息', p['个人信息']);
    html += sec('教育经历', p['教育经历']);
    html += sec('实习经历', p['实习经历']);
    html += sec('语言能力', p['语言能力']);
    html += sec('证书',     p['证书']);
    html += sec('技能',     p['技能']);
    html += sec('家庭情况', p['家庭情况']);
    html += `<div class="_rbtns"><button class="_rbtn sec" id="_rbpclose">关闭</button></div>`;

    panel.innerHTML = html;
    document.body.appendChild(panel);
    ovl.classList.add('open');
    document.getElementById('_rbpclose').addEventListener('click', closeAll);
  }

  // Toast
  function showToast(msg, type = 'info') {
    const el = document.createElement('div');
    el.className = `_toast ${type}`;
    el.textContent = msg;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 4000);
  }

})();