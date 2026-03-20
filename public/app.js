const connectBtn = document.getElementById('connect-btn');
const disconnectBtn = document.getElementById('disconnect-btn');
const sessionStatus = document.getElementById('session-status');
const qrWrapper = document.getElementById('qr-wrapper');
const qrImage = document.getElementById('qr-image');
const groupsCard = document.getElementById('groups-card');
const exportCard = document.getElementById('export-card');
const groupsList = document.getElementById('groups-list');
const selectAllBtn = document.getElementById('select-all-btn');
const clearSelectionBtn = document.getElementById('clear-selection-btn');
const exportBtn = document.getElementById('export-btn');
const exportStatus = document.getElementById('export-status');

let ws = null;
let groups = [];
let selectedGroups = new Set();

const setText = (el, text, isError = false) => {
  el.textContent = text;
  el.classList.toggle('error', isError);
};

const selectedGroupJids = () => Array.from(selectedGroups);

const renderGroups = () => {
  groupsList.innerHTML = '';

  if (groups.length === 0) {
    groupsList.innerHTML = '<div class="group-item">Nenhum grupo encontrado.</div>';
    return;
  }

  for (const group of groups) {
    const row = document.createElement('div');
    row.className = 'group-item';

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = selectedGroups.has(group.id);
    checkbox.addEventListener('change', () => {
      if (checkbox.checked) {
        selectedGroups.add(group.id);
      } else {
        selectedGroups.delete(group.id);
      }
    });

    const label = document.createElement('div');
    label.className = 'group-label';
    label.innerHTML = `
      <strong>${group.name}</strong>
      <span class="group-meta">${group.size} participantes</span>
    `;

    row.append(checkbox, label);
    groupsList.appendChild(row);
  }
};

const resetToDisconnected = () => {
  if (ws) {
    ws.close();
    ws = null;
  }
  qrImage.src = '';
  qrWrapper.classList.add('hidden');
  groups = [];
  selectedGroups.clear();
  renderGroups();
  groupsCard.classList.add('hidden');
  exportCard.classList.add('hidden');
  setText(exportStatus, '');
  connectBtn.disabled = false;
  disconnectBtn.disabled = false;
  setText(sessionStatus, 'Status: desconectado');
};

const fetchGroups = async () => {
  const response = await fetch('/groups');

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.message || 'Erro ao listar grupos.');
  }

  const data = await response.json();
  groups = data.groups || [];
  renderGroups();
  groupsCard.classList.remove('hidden');
  exportCard.classList.remove('hidden');
};

const openQrSocket = () => {
  if (ws) {
    ws.close();
  }

  const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
  ws = new WebSocket(`${protocol}://${window.location.host}/session/qr`);

  ws.onopen = () => {
    setText(sessionStatus, 'Status: aguardando QR...');
  };

  ws.onmessage = async (event) => {
    const payload = JSON.parse(event.data);

    if (payload.type === 'qr') {
      qrWrapper.classList.remove('hidden');
      qrImage.src = payload.dataUrl;
      setText(sessionStatus, 'Status: escaneie o QR Code');
      return;
    }

    if (payload.type === 'connected') {
      qrWrapper.classList.add('hidden');
      setText(sessionStatus, 'Status: conectado');
      await fetchGroups();
      ws.close();
      ws = null;
      return;
    }

    if (payload.type === 'waiting') {
      setText(sessionStatus, 'Status: aguardando novo QR...');
    }
  };

  ws.onerror = () => {
    setText(sessionStatus, 'Status: falha na conexao WebSocket', true);
  };
};

const startSession = async () => {
  connectBtn.disabled = true;

  try {
    openQrSocket();

    const response = await fetch('/session/start', {
      method: 'POST'
    });

    if (!response.ok) {
      throw new Error('Nao foi possivel iniciar a sessao.');
    }

    const statusResponse = await fetch('/session/status');
    const statusData = await statusResponse.json();

    if (statusData.state === 'connected') {
      qrWrapper.classList.add('hidden');
      setText(sessionStatus, 'Status: conectado');
      await fetchGroups();
    }
  } catch (error) {
    setText(sessionStatus, `Status: ${error.message}`, true);
  } finally {
    connectBtn.disabled = false;
  }
};

const exportContacts = async () => {
  const groupJids = selectedGroupJids();

  if (groupJids.length === 0) {
    setText(exportStatus, 'Selecione ao menos um grupo para exportar.', true);
    return;
  }

  exportBtn.disabled = true;
  setText(exportStatus, 'Exportando contatos...');

  try {
    const response = await fetch('/export', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ groupJids })
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      throw new Error(payload.message || 'Falha na exportacao.');
    }

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'contacts-export.json';
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);

    setText(exportStatus, 'Exportacao concluida. Download iniciado.');
  } catch (error) {
    setText(exportStatus, error.message || 'Erro desconhecido.', true);
  } finally {
    exportBtn.disabled = false;
  }
};

const disconnectSession = async () => {
  connectBtn.disabled = true;
  disconnectBtn.disabled = true;
  setText(sessionStatus, 'Status: desconectando...');

  try {
    const response = await fetch('/session/logout', { method: 'POST' });
    if (!response.ok) {
      throw new Error('Falha ao desvincular sessao.');
    }
    resetToDisconnected();
  } catch (error) {
    setText(sessionStatus, `Status: ${error.message}`, true);
    connectBtn.disabled = false;
    disconnectBtn.disabled = false;
    return;
  }
};

selectAllBtn.addEventListener('click', () => {
  selectedGroups = new Set(groups.map((group) => group.id));
  renderGroups();
});

clearSelectionBtn.addEventListener('click', () => {
  selectedGroups.clear();
  renderGroups();
});

connectBtn.addEventListener('click', startSession);
exportBtn.addEventListener('click', exportContacts);
disconnectBtn.addEventListener('click', disconnectSession);
