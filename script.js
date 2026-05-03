const OSState = {
  activeScreen: 'bootScreen',
  windowList: [],
  focusedWindow: null,
  menuStates: {
    startMenu: false,
    wallpaperMenu: false,
    notifications: false
  }
};




 document.addEventListener('DOMContentLoaded', () => {
  bootSystem();
});

function bootSystem() {
  setTimeout(() => {
    const progressBar = document.getElementById('progressFill');
    if (progressBar) progressBar.style.width = '100%';
  }, 500);

  setTimeout(() => {
    changeScreen('loginScreen');
  }, 3000);

  startClockSync();
  restoreWallpaperPreference();
}

function startClockSync() {
  const updateClock = () => {
    const now = new Date();
    
    const timeStr = now.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit'
    });
    
    const dateStr = now.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });

    const clockEl = document.getElementById('clock');
    const dateEl = document.getElementById('date');

    if (clockEl) clockEl.textContent = timeStr;
    if (dateEl) dateEl.textContent = dateStr;
  };

  updateClock();
  setInterval(updateClock, 1000);
}

function changeScreen(screenId) {
  const currentScreen = document.getElementById(OSState.activeScreen);
  if (currentScreen) {
    currentScreen.classList.remove('active');
  }

  const newScreen = document.getElementById(screenId);
  if (newScreen) {
    newScreen.classList.add('active');
    OSState.activeScreen = screenId;
  }
}

function handleAuthSubmit(e) {
  e.preventDefault();
  
  const usernameInput = document.getElementById('username');
  const passwordInput = document.getElementById('password');
  
  const username = usernameInput?.value || '';
  const password = passwordInput?.value || '';

  if (authenticate(username, password)) {
    changeScreen('desktopScreen');
    displayNotification(
      'Welcome back, Administrator!',
      'You have successfully logged in.'
    );
    usernameInput.value = '';
    passwordInput.value = '';
  } else {
    displayNotification(
      'Login Failed',
      'Invalid username or password.',
      'error'
    );
  }
}

function authenticate(user, pass) {
  return user === 'admin' && pass === 'admin123';
}

function launchApp(appName) {
  if (OSState.menuStates.startMenu) {
    toggleStartMenu();
  }

  const existing = OSState.windowList.find(w => w.app === appName);
  if (existing) {
    bringToFront(existing.id);
    return;
  }

  const windowId = `win_${Date.now()}`;
  const windowEl = buildWindow(windowId, appName);
  
  OSState.windowList.push({
    id: windowId,
    app: appName,
    element: windowEl
  });

  attachTaskbarItem(windowId, appName);
  bringToFront(windowId);
}

function buildWindow(windowId, appName) {
  const container = document.getElementById('windowsContainer');
  if (!container) return null;

  const windowDiv = document.createElement('div');
  windowDiv.id = windowId;
  windowDiv.className = 'window';

  const appContent = getApplicationData(appName);
  windowDiv.innerHTML = `
    <div class="window-header" onmousedown="initDrag(event, '${windowId}')">
      <div class="window-controls">
        <div class="window-control minimize" onclick="minimizeWin('${windowId}')"></div>
        <div class="window-control maximize" onclick="maximizeWin('${windowId}')"></div>
        <div class="window-control close" onclick="closeWin('${windowId}')"></div>
      </div>
      <div class="window-title">${appContent.title}</div>
    </div>
    <div class="window-body">
      ${appContent.content}
    </div>
  `;

  container.appendChild(windowDiv);

  const offset = OSState.windowList.length * 30;
  windowDiv.style.left = (100 + offset) + 'px';
  windowDiv.style.top = (80 + offset) + 'px';

  return windowDiv;
}

function getApplicationData(appId) {
  const appRegistry = {
    fileManager: {
      title: 'File Manager',
      content: buildFileManagerUI()
    },
    browser: {
      title: 'Web Browser',
      content: buildBrowserUI()
    },
    terminal: {
      title: 'Terminal',
      content: buildTerminalUI()
    },
    calculator: {
      title: 'Calculator',
      content: buildCalculatorUI()
    },
    notes: {
      title: 'Notes',
      content: buildNotesUI()
    },
    weather: {
      title: 'Weather',
      content: buildWeatherUI()
    },
    settings: {
      title: 'Settings',
      content: buildSettingsUI()
    }
  };

  return appRegistry[appId] || {
    title: 'Unknown',
    content: '<p>Application not found</p>'
  };
}

function buildFileManagerUI() {
  return `
    <div class="file-manager">
      <div class="file-toolbar">
        <button onclick="fileNav.back()" id="backBtn" style="display:none;">⬅ Back</button>
        <button onclick="fileNav.createFile()">New File</button>
        <button onclick="fileNav.createFolder()">New Folder</button>
      </div>
      <div class="file-list" id="fileList-fileManager">
        <div class="file-item" ondblclick="fileNav.open('Documents')">
          <div class="file-icon">📁</div>
          <div class="file-name">Documents</div>
        </div>
        <div class="file-item" ondblclick="fileNav.open('Pictures')">
          <div class="file-icon">📁</div>
          <div class="file-name">Pictures</div>
        </div>
        <div class="file-item" ondblclick="fileNav.open('Downloads')">
          <div class="file-icon">📁</div>
          <div class="file-name">Downloads</div>
        </div>
      </div>
    </div>
  `;
}

function buildBrowserUI() {
  return `
    <div class="browser">
      <div class="browser-toolbar">
        <button onclick="browserCtrl.goBack()">←</button>
        <button onclick="browserCtrl.goForward()">→</button>
        <button onclick="browserCtrl.refresh()">↻</button>
        <input type="text" id="urlBar" placeholder="Enter URL or search" value="https://www.google.com">
        <button onclick="browserCtrl.navigate()">Go</button>
      </div>
      <div class="browser-content">
        <iframe id="browserFrame" src="https://www.google.com/webhp?igu=1" frameborder="0"></iframe>
      </div>
    </div>
  `;
}

function buildTerminalUI() {
  return `
    <div class="terminal">
      <div class="terminal-output" id="terminalOutput">
        <div class="terminal-line">CHANAKYA Terminal v1.0</div>
        <div class="terminal-line">Type 'help' for commands</div>
        <div class="terminal-line">$ <span class="cursor">_</span></div>
      </div>
      <div class="terminal-input">
        <input type="text" id="terminalInput" placeholder="Enter command..." onkeypress="terminalCtrl.handleInput(event)">
      </div>
    </div>
  `;
}

function buildCalculatorUI() {
  return `
    <div class="calculator">
      <div class="calc-display" id="calcDisplay">0</div>
      <div class="calc-buttons">
        <button onclick="calcCtrl.input('C')">C</button>
        <button onclick="calcCtrl.input('⌫')">⌫</button>
        <button onclick="calcCtrl.input('%')">%</button>
        <button onclick="calcCtrl.input('/')">/</button>
        <button onclick="calcCtrl.input('7')">7</button>
        <button onclick="calcCtrl.input('8')">8</button>
        <button onclick="calcCtrl.input('9')">9</button>
        <button onclick="calcCtrl.input('*')">*</button>
        <button onclick="calcCtrl.input('4')">4</button>
        <button onclick="calcCtrl.input('5')">5</button>
        <button onclick="calcCtrl.input('6')">6</button>
        <button onclick="calcCtrl.input('-')">-</button>
        <button onclick="calcCtrl.input('1')">1</button>
        <button onclick="calcCtrl.input('2')">2</button>
        <button onclick="calcCtrl.input('3')">3</button>
        <button onclick="calcCtrl.input('+')">+</button>
        <button onclick="calcCtrl.input('0')">0</button>
        <button onclick="calcCtrl.input('.')">.</button>
        <button onclick="calcCtrl.input('=')" class="equals">=</button>
      </div>
    </div>
  `;
}

function buildNotesUI() {
  return `
    <div class="notes-app">
      <div class="notes-toolbar">
        <button onclick="notesCtrl.save()">Save</button>
        <button onclick="notesCtrl.newNote()">New Note</button>
        <button onclick="notesCtrl.delete()">Delete</button>
      </div>
      <div class="notes-list" id="notesList">
        <div class="note-item" onclick="notesCtrl.load(0)">
          <div class="note-title">Welcome Note</div>
          <div class="note-preview">Welcome to CHANAKYA Notes...</div>
        </div>
      </div>
      <textarea id="noteEditor" placeholder="Start typing...">Welcome to CHANAKYA Notes!

This is a simple note-taking application.

Features:
- Create and save notes
- Organize your thoughts
- Access from anywhere

Enjoy using CHANAKYA OS!</textarea>
    </div>
  `;
}

function buildWeatherUI() {
  return `
    <div class="weather-app">
      <div class="weather-search">
        <input type="text" id="weatherLocation" placeholder="Enter city or town" value="London">
        <button onclick="weatherCtrl.fetch()">Search</button>
        <button onclick="weatherCtrl.useLocation()">Current</button>
      </div>
      <div class="weather-card main-weather" id="weatherMain">
        <div class="weather-loading">Enter a location to see weather forecast</div>
      </div>
      <div class="weather-forecast" id="weatherForecast"></div>
    </div>
  `;
}

function buildSettingsUI() {
  return `
    <div class="settings">
      <div class="settings-sidebar">
        <div class="settings-category active" onclick="settingsCtrl.showTab('appearance')">Appearance</div>
        <div class="settings-category" onclick="settingsCtrl.showTab('system')">System</div>
        <div class="settings-category" onclick="settingsCtrl.showTab('about')">About</div>
      </div>
      <div class="settings-content">
        <div class="settings-tab active" id="appearance-tab">
          <h3>Appearance Settings</h3>
          <div class="setting-group">
            <label>Wallpaper</label>
            <div class="wallpaper-thumbs">
              <div class="wallpaper-thumb" onclick="applyWallpaper('default')">Default</div>
              <div class="wallpaper-thumb" onclick="applyWallpaper('gradient1')">Ocean</div>
              <div class="wallpaper-thumb" onclick="applyWallpaper('gradient2')">Sunset</div>
              <div class="wallpaper-thumb" onclick="applyWallpaper('gradient3')">Forest</div>
            </div>
          </div>
        </div>
        <div class="settings-tab" id="system-tab">
          <h3>System Settings</h3>
          <div class="setting-group">
            <label>System Information</label>
            <div class="system-info">
              <div>CHANAKYA OS v1.0</div>
              <div>Built with HTML, CSS, JS</div>
              <div>Professional Interface</div>
            </div>
          </div>
        </div>
        <div class="settings-tab" id="about-tab">
          <h3>About CHANAKYA OS</h3>
          <div class="about-content">
            <p>CHANAKYA OS is a professional web-based operating system interface.</p>
            <p>Features include window management, app launching, wallpaper customization, and more.</p>
          </div>
        </div>
      </div>
    </div>
  `;
}

function closeWin(windowId) {
  const winEl = document.getElementById(windowId);
  if (winEl) winEl.remove();

  OSState.windowList = OSState.windowList.filter(w => w.id !== windowId);
  removeTaskbarItem(windowId);

  if (OSState.focusedWindow === windowId) {
    OSState.focusedWindow = null;
  }
}

function minimizeWin(windowId) {
  const win = document.getElementById(windowId);
  if (win) win.style.display = 'none';
}

function maximizeWin(windowId) {
  const win = document.getElementById(windowId);
  if (!win) return;

  if (win.classList.contains('maximized')) {
    win.classList.remove('maximized');
    win.style.cssText = '';
  } else {
    win.classList.add('maximized');
    win.style.left = '0';
    win.style.top = '0';
    win.style.width = '100%';
    win.style.height = 'calc(100vh - 60px)';
  }
}

function bringToFront(windowId) {
  const win = document.getElementById(windowId);
  if (win) {
    win.style.zIndex = '101';
    win.classList.add('active');
    OSState.focusedWindow = windowId;
    updateTaskbarState(windowId);
  }
}

function attachTaskbarItem(windowId, appName) {
  const taskbarContainer = document.getElementById('taskbarApps');
  const button = document.createElement('div');
  button.className = 'taskbar-app';
  button.id = `taskbar-${windowId}`;
  button.onclick = () => bringToFront(windowId);
  button.innerHTML = getAppEmoji(appName);
  taskbarContainer.appendChild(button);
}

function removeTaskbarItem(windowId) {
  const item = document.getElementById(`taskbar-${windowId}`);
  if (item) item.remove();
}

function updateTaskbarState(windowId) {
  document.querySelectorAll('.taskbar-app').forEach(app => {
    app.classList.remove('active');
  });
  
  const active = document.getElementById(`taskbar-${windowId}`);
  if (active) active.classList.add('active');
}

function getAppEmoji(appName) {
  const emojiMap = {
    fileManager: '📁',
    browser: '🌐',
    terminal: '💻',
    calculator: '🧮',
    notes: '📝',
    weather: '☁️',
    settings: '⚙️'
  };
  return emojiMap[appName] || '📱';
}

function toggleStartMenu() {
  const menu = document.getElementById('startMenu');
  OSState.menuStates.startMenu = !OSState.menuStates.startMenu;
  
  menu.classList.toggle('active', OSState.menuStates.startMenu);
}

function applyWallpaper(theme) {
  const bgEl = document.getElementById('desktopBg');
  if (!bgEl) return;

  bgEl.className = 'desktop-bg';
  
  if (theme === 'default') {
    bgEl.classList.add('default-bg');
  } else {
    bgEl.classList.add(theme);
  }

  localStorage.setItem('os_wallpaper', theme);

  if (OSState.menuStates.wallpaperMenu) {
    toggleWallpaperMenu();
  }
}

function restoreWallpaperPreference() {
  const saved = localStorage.getItem('os_wallpaper');
  applyWallpaper(saved || 'cyberpunk');
}

function toggleWallpaperMenu() {
  const menu = document.getElementById('wallpaperMenu');
  OSState.menuStates.wallpaperMenu = !OSState.menuStates.wallpaperMenu;
  
  menu.classList.toggle('active', OSState.menuStates.wallpaperMenu);
}

function toggleNotifications() {
  const panel = document.getElementById('notificationsPanel');
  OSState.menuStates.notifications = !OSState.menuStates.notifications;
  
  panel.classList.toggle('active', OSState.menuStates.notifications);
}

function displayNotification(title, message, type = 'info') {
  const list = document.getElementById('notificationsList');
  const notif = document.createElement('div');
  notif.className = 'notification-item';

  const icons = {
    error: '❌',
    success: '✅',
    info: 'ℹ️'
  };

  notif.innerHTML = `
    <div class="notification-icon">${icons[type] || icons.info}</div>
    <div class="notification-content">
      <div class="notification-title">${title}</div>
      <div class="notification-message">${message}</div>
      <div class="notification-time">Just now</div>
    </div>
  `;

  list.insertBefore(notif, list.firstChild);

  setTimeout(() => {
    if (notif.parentNode) {
      notif.remove();
    }
  }, 5000);
}

function clearAllNotifications() {
  const list = document.getElementById('notificationsList');
  list.innerHTML = '';
}

let dragState = {
  isDragging: false,
  offsetX: 0,
  offsetY: 0,
  element: null
};

function initDrag(event, windowId) {
  if (event.target.closest('.window-controls')) return;

  dragState.isDragging = true;
  dragState.element = document.getElementById(windowId);

  const rect = dragState.element.getBoundingClientRect();
  dragState.offsetX = event.clientX - rect.left;
  dragState.offsetY = event.clientY - rect.top;

  document.addEventListener('mousemove', performDrag);
  document.addEventListener('mouseup', endDrag);
}

function performDrag(event) {
  if (!dragState.isDragging || !dragState.element) return;

  const x = event.clientX - dragState.offsetX;
  const y = event.clientY - dragState.offsetY;

  dragState.element.style.left = x + 'px';
  dragState.element.style.top = y + 'px';
}

function endDrag() {
  dragState.isDragging = false;
  dragState.element = null;
  document.removeEventListener('mousemove', performDrag);
  document.removeEventListener('mouseup', endDrag);
}

function systemShutdown() {
  displayNotification('Shutting Down', 'CHANAKYA OS is shutting down...');
  setTimeout(() => {
    changeScreen('bootScreen');
    OSState.windowList = [];
    document.getElementById('windowsContainer').innerHTML = '';
    document.getElementById('taskbarApps').innerHTML = '';
  }, 2000);
}

function systemRestart() {
  displayNotification('Restarting', 'CHANAKYA OS is restarting...');
  setTimeout(() => {
    location.reload();
  }, 2000);
}

function systemSleep() {
  displayNotification('Sleep Mode', 'CHANAKYA OS is entering sleep mode...');
}


const calcCtrl = {
  expr: '',
  
  input(value) {
    const display = document.querySelector('#calcDisplay');
    if (!display) return;

    if (value === 'C') {
      this.expr = '';
      display.textContent = '0';
    } else if (value === '⌫') {
      this.expr = this.expr.slice(0, -1);
      display.textContent = this.expr || '0';
    } else if (value === '=') {
      try {
        const result = eval(this.expr);
        display.textContent = result;
        this.expr = result.toString();
      } catch (e) {
        display.textContent = 'Error';
        this.expr = '';
      }
    } else {
      this.expr += value;
      display.textContent = this.expr;
    }
  }
};

const notesCtrl = {
  list: [
    {
      title: 'Welcome Note',
      content: 'Welcome to CHANAKYA Notes!\n\nThis is a simple note-taking app.\n\nFeatures:\n- Create and save notes\n- Organize thoughts\n- Access anywhere\n\nEnjoy!'
    }
  ],
  activeIndex: 0,

  save() {
    const editor = document.getElementById('noteEditor');
    if (editor) {
      this.list[this.activeIndex].content = editor.value;
      displayNotification('Note Saved', 'Your note has been saved.');
    }
  },

  newNote() {
    this.list.push({
      title: 'New Note',
      content: ''
    });
    this.activeIndex = this.list.length - 1;
    this.refresh();
    this.load(this.activeIndex);
  },

  delete() {
    if (this.list.length === 0) return;

    this.list.splice(this.activeIndex, 1);
    displayNotification('Note Deleted', 'The note has been removed.', 'success');

    if (this.list.length === 0) {
      this.list.push({ title: 'New Note', content: '' });
      this.activeIndex = 0;
    } else {
      this.activeIndex = Math.min(this.activeIndex, this.list.length - 1);
    }

    this.refresh();
    this.load(this.activeIndex);
  },

  load(idx) {
    this.activeIndex = idx;
    const editor = document.getElementById('noteEditor');
    if (editor) {
      editor.value = this.list[idx].content;
    }
  },

  refresh() {
    const container = document.getElementById('notesList');
    if (!container) return;

    container.innerHTML = this.list.map((note, i) => `
      <div class="note-item" onclick="notesCtrl.load(${i})">
        <div class="note-title">${note.title}</div>
        <div class="note-preview">${note.content.substring(0, 50)}...</div>
      </div>
    `).join('');
  }
};
const fileNav = {
  fs: {
    'Documents': [],
    'Pictures': [],
    'Downloads': []
  },
  path: '/',
  current: null,

  open(folder) {
    this.path = folder;
    this.current = folder;
    this.render();
  },

  back() {
    if (this.path !== '/') {
      this.path = '/';
      this.current = null;
      this.render();
    }
  },

  render() {
    const win = document.querySelector('.window.active');
    if (!win) return;

    const list = win.querySelector('[id^="fileList-"]');
    if (!list) return;

    let items = [];

    if (this.path === '/') {
      items = [
        { name: 'Documents', icon: '📁', type: 'folder' },
        { name: 'Pictures', icon: '📁', type: 'folder' },
        { name: 'Downloads', icon: '📁', type: 'folder' }
      ];
    } else {
      items.push({ name: '⬅ Back', icon: '⬅', type: 'back' });
      if (this.fs[this.current]) {
        items.push(...this.fs[this.current]);
      }
    }

    list.innerHTML = items.map(item => {
      const onClick = item.type === 'back' 
        ? 'fileNav.back()'
        : item.type === 'folder'
        ? `fileNav.open('${item.name}')`
        : '';

      return `
        <div class="file-item" ondblclick="${onClick}" style="cursor:${item.type === 'folder' || item.type === 'back' ? 'pointer' : 'default'};">
          <div class="file-icon">${item.icon}</div>
          <div class="file-name">${item.name}</div>
        </div>
      `;
    }).join('');
  },

  createFile() {
    const name = prompt('File name:', 'file.txt');
    if (!name) return;

    if (this.path === '/') {
      displayNotification('File Manager', 'Open a folder first.', 'error');
      return;
    }

    this.fs[this.current].push({
      name: name,
      icon: '📄',
      type: 'file'
    });

    this.render();
    displayNotification('File Created', `"${name}" created.`, 'success');
  },

  createFolder() {
    const name = prompt('Folder name:', 'New Folder');
    if (!name) return;

    if (this.path !== '/') {
      displayNotification('File Manager', 'Can only create in root.', 'error');
      return;
    }

    if (this.fs[name]) {
      displayNotification('File Manager', 'Folder exists.', 'error');
      return;
    }

    this.fs[name] = [];
    this.render();
    displayNotification('Folder Created', `"${name}" created.`, 'success');
  }
};



const browserCtrl = {
  normalizeURL(input) {
    let url = input.trim();
    if (!url) return '';

    if (!/^https?:\/\//i.test(url)) {
      if (/^(google|www\.google|google\.com|www\.google\.com)$/i.test(url)) {
        return 'https://www.google.com/webhp?igu=1';
      }
      if (url.includes(' ') || !url.includes('.')) {
        return `https://www.google.com/search?q=${encodeURIComponent(url)}`;
      }
      return 'https://' + url;
    }

    return url;
  },

  navigate() {
    const urlBar = document.getElementById('urlBar');
    const frame = document.getElementById('browserFrame');

    if (!urlBar || !frame) return;

    const url = this.normalizeURL(urlBar.value);
    if (!url) return;

    frame.src = url;
    urlBar.value = url;
  },

  goBack() {
    const frame = document.getElementById('browserFrame');
    if (frame?.contentWindow) {
      frame.contentWindow.history.back();
    }
  },

  goForward() {
    const frame = document.getElementById('browserFrame');
    if (frame?.contentWindow) {
      frame.contentWindow.history.forward();
    }
  },

  refresh() {
    const frame = document.getElementById('browserFrame');
    if (frame) {
      frame.src = frame.src;
    }
  }
};



const terminalCtrl = {
  handleInput(event) {
    if (event.key === 'Enter') {
      const input = document.getElementById('terminalInput');
      const output = document.getElementById('terminalOutput');

      if (input && output) {
        const cmd = input.value.trim();
        this.execute(cmd, output);
        input.value = '';
      }
    }
  },

  execute(cmd, output) {
    const response = this.process(cmd);
    output.innerHTML += `<div class="terminal-line">$ ${cmd}</div>`;
    output.innerHTML += `<div class="terminal-line">${response}</div>`;
    output.innerHTML += `<div class="terminal-line">$ <span class="cursor">_</span></div>`;
    output.scrollTop = output.scrollHeight;
  },

  process(cmd) {
    const commands = {
      'help': 'Commands: help, clear, ls, pwd, date, whoami, echo [text]',
      'clear': '',
      'ls': 'Documents/  Pictures/  Downloads/  Desktop/',
      'pwd': '/home/admin',
      'date': new Date().toString(),
      'whoami': 'administrator',
      'echo': (args) => args.join(' ') || ''
    };

    const parts = cmd.split(' ');
    const command = parts[0].toLowerCase();
    const args = parts.slice(1);

    if (commands[command]) {
      if (typeof commands[command] === 'function') {
        return commands[command](args);
      }
      return commands[command];
    }

    return `Unknown: ${command}. Type 'help'.`;
  }
};



const weatherCtrl = {
  async fetch() {
    const input = document.getElementById('weatherLocation');
    if (!input) return;

    const location = input.value.trim();
    if (!location) {
      displayNotification('Weather', 'Enter a location.', 'error');
      return;
    }

    try {
      const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(location)}&count=1`);
      const data = await res.json();

      if (!data.results?.length) {
        displayNotification('Weather', 'Location not found.', 'error');
        return;
      }

      const place = data.results[0];
      this.loadData(place.latitude, place.longitude, `${place.name}, ${place.country}`);
    } catch (e) {
      displayNotification('Weather', 'Failed to fetch location.', 'error');
    }
  },

  async loadData(lat, lon, label = 'Location') {
    const main = document.getElementById('weatherMain');
    const forecast = document.getElementById('weatherForecast');

    if (!main || !forecast) return;

    main.innerHTML = '<div class="weather-loading">Loading...</div>';
    forecast.innerHTML = '';

    try {
      const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&daily=temperature_2m_max,temperature_2m_min,weathercode&timezone=auto`);
      const data = await res.json();

      if (!data.current_weather || !data.daily) {
        throw new Error('Invalid data');
      }

      const curr = data.current_weather;
      const icon = this.getIcon(curr.weathercode);
      const desc = this.getDesc(curr.weathercode);

      main.innerHTML = `
        <div class="weather-title">${label}</div>
        <div class="weather-temp">${Math.round(curr.temperature)}°C</div>
        <div class="weather-desc">${desc}</div>
        <div class="weather-info-grid">
          <div class="weather-info"><strong>Wind</strong>${Math.round(curr.windspeed)} km/h</div>
          <div class="weather-info"><strong>Condition</strong>${icon}</div>
          <div class="weather-info"><strong>Time</strong>${new Date(curr.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
        </div>
      `;

      const days = data.daily.time.slice(0, 5).map((date, i) => {
        const max = Math.round(data.daily.temperature_2m_max[i]);
        const min = Math.round(data.daily.temperature_2m_min[i]);
        const dayIcon = this.getIcon(data.daily.weathercode[i]);
        const dayName = new Date(date).toLocaleDateString([], { weekday: 'short' });
        return `
          <div class="weather-day">
            <div>
              <div class="day-text">${dayName}</div>
              <div>${date}</div>
            </div>
            <div class="day-info">
              <div class="day-icon">${dayIcon}</div>
              <div>${max}° / ${min}°</div>
            </div>
          </div>
        `;
      }).join('');

      forecast.innerHTML = `<div class="weather-info-grid">${days}</div>`;
    } catch (e) {
      main.innerHTML = '<div class="weather-loading">Error loading weather</div>';
      displayNotification('Weather', 'Failed to load data.', 'error');
    }
  },

  getIcon(code) {
    const map = {
      0: '☀️', 1: '🌤️', 2: '⛅', 3: '☁️', 45: '🌫️', 48: '🌫️',
      51: '🌦️', 53: '🌦️', 55: '🌧️', 56: '🌧️', 57: '🌧️',
      61: '🌧️', 63: '🌧️', 65: '🌧️', 66: '🌧️', 67: '🌧️',
      71: '❄️', 73: '❄️', 75: '❄️', 77: '❄️', 80: '🌦️',
      81: '🌧️', 82: '🌧️', 85: '❄️', 86: '❄️', 95: '⛈️',
      96: '⛈️', 99: '⛈️'
    };
    return map[code] || '🌤️';
  },

  getDesc(code) {
    const map = {
      0: 'Clear sky', 1: 'Mainly clear', 2: 'Partly cloudy', 3: 'Overcast',
      45: 'Fog', 48: 'Rime fog', 51: 'Light drizzle', 53: 'Moderate drizzle',
      55: 'Dense drizzle', 56: 'Freezing drizzle', 57: 'Dense freezing drizzle',
      61: 'Slight rain', 63: 'Moderate rain', 65: 'Heavy rain',
      66: 'Freezing rain', 67: 'Heavy freezing rain', 71: 'Slight snow',
      73: 'Moderate snow', 75: 'Heavy snow', 77: 'Snow grains',
      80: 'Rain showers', 81: 'Heavy showers', 82: 'Violent showers',
      85: 'Snow showers', 86: 'Heavy snow showers', 95: 'Thunderstorm',
      96: 'Thunderstorm with hail', 99: 'Thunderstorm with hail'
    };
    return map[code] || 'Unknown';
  },

  useLocation() {
    if (!navigator.geolocation) {
      displayNotification('Weather', 'Geolocation not supported.', 'error');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => this.loadData(pos.coords.latitude, pos.coords.longitude, 'Current Location'),
      () => displayNotification('Weather', 'Location access denied.', 'error')
    );
  }
};


const settingsCtrl = {
  showTab(tabName) {
    document.querySelectorAll('.settings-tab').forEach(tab => {
      tab.classList.remove('active');
    });

    document.querySelectorAll('.settings-category').forEach(cat => {
      cat.classList.remove('active');
    });

    const tab = document.getElementById(`${tabName}-tab`);
    if (tab) tab.classList.add('active');

    const cat = document.querySelector(`[onclick="settingsCtrl.showTab('${tabName}')"]`);
    if (cat) cat.classList.add('active');
  }
};


document.addEventListener('click', (event) => {
  if (!event.target.closest('.start-menu-btn') && !event.target.closest('.start-menu')) {
    if (OSState.menuStates.startMenu) toggleStartMenu();
  }

  if (!event.target.closest('.tray-icon') && !event.target.closest('.wallpaper-menu')) {
    if (OSState.menuStates.wallpaperMenu) toggleWallpaperMenu();
  }

  if (!event.target.closest('.tray-icon') && !event.target.closest('.notifications-panel')) {
    if (OSState.menuStates.notifications) toggleNotifications();
  }
});