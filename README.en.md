# Autumn Recruitment Resume Autofill Helper

This project is a Tampermonkey userscript that reads your local `profile.json` and automatically fills common fields in online application forms on various company recruitment websites, reducing repetitive manual input.

---

## Features

- Load personal data from local `profile.json`, including personal info, education, internships, language skills, certificates, technical skills, and family information
- Automatically fill typical form fields such as name, contact information, ID number, education background, internship experience, and skill descriptions
- Supports many popular recruitment sites, including but not limited to:
  - Beisen / zhiye.com based career sites
  - Liepin, Lagou, Zhaopin, 51job
  - Boss Zhipin
  - Meituan, ByteDance, Tencent, Alibaba, Huawei, Baidu, JD, Xiaomi, Didi, Pinduoduo, NetEase, Bilibili, miHoYo, etc.
- Special handling for React and other controlled-component based forms by locating inputs via label text, sibling elements, and parent containers
- All data is stored only in the browser (Tampermonkey storage) and is never uploaded to any remote server

---

## Requirements

- A modern web browser (Chrome, Edge, etc.)
- Tampermonkey or a compatible userscript manager installed
- A local `profile.json` file prepared in advance (an example file is provided at the repository root)

---

## Installation

1. Install the Tampermonkey extension from your browser's extension store.
2. Open the Tampermonkey dashboard and create a new userscript.
3. Copy the entire content of `resume_autofill.user.js` from this repository into the new script and save it.
4. Make sure the script is enabled for the target recruitment sites.

---

## profile.json Schema

`profile.json` is the only data source used by this tool. Its top-level structure looks like this (values are omitted here; fill in your own data):

```jsonc
{
  "个人信息": { /* personal info fields */ },
  "教育经历": [ /* education entries */ ],
  "实习经历": [ /* internship entries */ ],
  "语言能力": [ /* language skills */ ],
  "证书": [ /* certificates */ ],
  "技能": [ /* technical skills */ ],
  "家庭情况": [ /* family members */ ]
}
```

It is recommended to use the `profile.json` provided in this repository as a template so that all field names match the mappings used in the script.

---

## Shortcuts and UI

- A floating button is shown at the bottom-right corner of the page. Clicking it opens a menu with options:
  - Autofill the current page
  - Import / update personal information
  - Preview saved information
  - Clear saved information
- Keyboard shortcuts:
  - `Alt + F`: autofill the current page
  - `Alt + I`: open the "Import personal information" dialog
- A toast-like message bar appears near the top of the page to display success / warning / info messages.

---

## Privacy

- The script only reads and writes data to the local Tampermonkey storage in your browser. No personal data is sent to any remote server.
- Use this script on your own trusted devices and avoid storing sensitive information on public or shared computers.
- On public machines, remember to clear saved data from the menu and sign out of your accounts after use.

---

## Limitations

- Some dropdown fields (such as gender, education level, political status, etc.) are implemented as custom components on certain sites and may still require manual selection.
- If a recruitment site significantly changes its page structure or form fields, some mappings may stop working and the script will need updates.
- The script is primarily designed for Chinese-language application forms. Support for non-Chinese sites is limited.

---

## License and Disclaimer

This script is intended for personal learning and job application purposes only. The author assumes no responsibility for any direct or indirect consequences arising from the use of this script. Please review and understand the behavior of the script before using it and decide at your own risk.
