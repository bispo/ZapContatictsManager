const connectBtn = document.getElementById('connect-btn');
const disconnectBtn = document.getElementById('disconnect-btn');
const sessionStatus = document.getElementById('session-status');
const qrWrapper = document.getElementById('qr-wrapper');
const qrImage = document.getElementById('qr-image');
const groupsCard = document.getElementById('groups-card');
const exportCard = document.getElementById('export-card');
const importCard = document.getElementById('import-card');
const messageCard = document.getElementById('message-card');
const groupsList = document.getElementById('groups-list');
const selectAllBtn = document.getElementById('select-all-btn');
const clearSelectionBtn = document.getElementById('clear-selection-btn');
const exportBtn = document.getElementById('export-btn');
const exportStatus = document.getElementById('export-status');

const csvFileInput = document.getElementById('csv-file-input');
const importBtn = document.getElementById('import-btn');
const verifyBtn = document.getElementById('verify-btn');
const importStatus = document.getElementById('import-status');
const importSummary = document.getElementById('import-summary');
const summaryTotal = document.getElementById('summary-total');
const summaryValid = document.getElementById('summary-valid');
const summaryInvalid = document.getElementById('summary-invalid');
const summaryDuplicate = document.getElementById('summary-duplicate');
const verificationSummary = document.getElementById('verification-summary');
const importTableWrapper = document.getElementById('import-table-wrapper');
const importResultsBody = document.getElementById('import-results-body');
const downloadActions = document.getElementById('download-actions');
const downloadJsonBtn = document.getElementById('download-json-btn');
const downloadCsvBtn = document.getElementById('download-csv-btn');

const campaignContactsInput = document.getElementById('campaign-contacts-input');
const campaignVariablesInput = document.getElementById('campaign-variables-input');
const messageTemplateInput = document.getElementById('message-template-input');
const previewMessageBtn = document.getElementById('preview-message-btn');
const sendMessageBtn = document.getElementById('send-message-btn');
const downloadReportBtn = document.getElementById('download-report-btn');
const messageStatus = document.getElementById('message-status');
const campaignPreviewBox = document.getElementById('campaign-preview-box');
const campaignSummary = document.getElementById('campaign-summary');
const campaignTotalContacts = document.getElementById('campaign-total-contacts');
const campaignTotalVariables = document.getElementById('campaign-total-variables');
const campaignTemplateVars = document.getElementById('campaign-template-vars');
const campaignSampleCount = document.getElementById('campaign-sample-count');
const detectedVariables = document.getElementById('detected-variables');
const sampleMessages = document.getElementById('sample-messages');
const campaignResultSummary = document.getElementById('campaign-result-summary');

let ws = null;
let groups = [];
let selectedGroups = new Set();
let importedContacts = [];
let preparedTransmission = null;
let campaignPreview = null;
let campaignReport = null;
let campaignInputs = null;

const setText = (el, text, isError = false) => {
  el.textContent = text;
  el.classList.toggle('error', isError);
};

const selectedGroupJids = () => Array.from(selectedGroups);

const escapeHtml = (value) =>
  String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');

const downloadTextFile = (content, fileName, type) => {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
};

const downloadBlobResponse = async (response, fileName) => {
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
};

const renderStatusChip = (status, label) =>
  `<span class="status-chip status-${escapeHtml(status)}">${escapeHtml(label)}</span>`;

const importStatusLabel = (status) => {
  const labels = {
    valid: 'Valido',
    invalid: 'Invalido',
    duplicate: 'Duplicado',
    unknown: 'Desconhecido'
  };

  return labels[status] || status;
};

const whatsappStatusLabel = (status) => {
  const labels = {
    pending: 'Pendente',
    valid: 'Existe',
    not_found: 'Nao encontrado',
    error: 'Erro',
    unsupported: 'Nao suportado'
  };

  return labels[status] || status;
};

const resetCampaignState = () => {
  campaignPreview = null;
  campaignReport = null;
  campaignInputs = null;
  sendMessageBtn.disabled = true;
  downloadReportBtn.disabled = true;
  campaignPreviewBox.classList.add('hidden');
  campaignSummary.classList.add('hidden');
  detectedVariables.innerHTML = '';
  sampleMessages.innerHTML = '';
  campaignResultSummary.classList.add('hidden');
  campaignResultSummary.textContent = '';
  setText(messageStatus, '');
};

const resetImportState = () => {
  importedContacts = [];
  preparedTransmission = null;
  verifyBtn.disabled = true;
  importSummary.classList.add('hidden');
  verificationSummary.classList.add('hidden');
  verificationSummary.textContent = '';
  importTableWrapper.classList.add('hidden');
  importResultsBody.innerHTML = '';
  downloadActions.classList.add('hidden');
  setText(importStatus, '');
};

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
      <strong>${escapeHtml(group.name)}</strong>
      <span class="group-meta">${escapeHtml(String(group.size))} participantes</span>
    `;

    row.append(checkbox, label);
    groupsList.appendChild(row);
  }
};

const renderImportPreview = (contacts) => {
  importResultsBody.innerHTML = '';

  if (contacts.length === 0) {
    importTableWrapper.classList.add('hidden');
    return;
  }

  for (const contact of contacts) {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${escapeHtml(String(contact.rowNumber))}</td>
      <td>${escapeHtml(contact.name)}</td>
      <td>${escapeHtml(contact.originalNumber)}</td>
      <td>${escapeHtml(contact.normalizedNumber || '-')}</td>
      <td>${renderStatusChip(contact.status, importStatusLabel(contact.status))}</td>
      <td>${renderStatusChip(contact.whatsappStatus, whatsappStatusLabel(contact.whatsappStatus))}</td>
      <td>${escapeHtml(contact.reason || '-')}</td>
    `;
    importResultsBody.appendChild(row);
  }

  importTableWrapper.classList.remove('hidden');
};

const renderImportSummary = (summary) => {
  summaryTotal.textContent = String(summary.totalRows);
  summaryValid.textContent = String(summary.validRows);
  summaryInvalid.textContent = String(summary.invalidRows);
  summaryDuplicate.textContent = String(summary.duplicateRows);
  importSummary.classList.remove('hidden');
};

const renderVerificationSummary = (payload) => {
  verificationSummary.textContent =
    `Verificados: ${payload.summary.verifiedContacts}. ` +
    `Validos no WhatsApp: ${payload.summary.whatsappValidContacts}. ` +
    `Nao encontrados: ${payload.summary.whatsappInvalidContacts}. ` +
    `Erros: ${payload.summary.whatsappErrorContacts}. ` +
    `Nao suportados: ${payload.summary.unsupportedContacts}.`;
  verificationSummary.classList.remove('hidden');
};

const renderCampaignPreview = (payload) => {
  campaignTotalContacts.textContent = String(payload.summary.totalContacts);
  campaignTotalVariables.textContent = String(payload.summary.totalVariables);
  campaignTemplateVars.textContent = String(payload.summary.detectedTemplateVariables);
  campaignSampleCount.textContent = String(payload.summary.sampleCount);
  campaignSummary.classList.remove('hidden');

  detectedVariables.innerHTML = '';
  payload.templateVariables.forEach((variable) => {
    const tag = document.createElement('span');
    tag.className = 'tag';
    tag.textContent = `$${variable}`;
    detectedVariables.appendChild(tag);
  });

  sampleMessages.innerHTML = '';
  payload.sampleMessages.forEach((message, index) => {
    const item = document.createElement('article');
    item.className = 'sample-item';
    item.innerHTML = `
      <strong>Amostra ${index + 1}</strong>
      <pre>${escapeHtml(message.renderedText)}</pre>
    `;
    sampleMessages.appendChild(item);
  });

  campaignPreviewBox.classList.remove('hidden');
  sendMessageBtn.disabled = false;
};

const renderCampaignReportSummary = (payload) => {
  campaignResultSummary.textContent =
    `Envio concluido. ${payload.summary.sentCount} enviados, ` +
    `${payload.summary.failedCount} falhas, ` +
    `${payload.summary.skippedCount} ignorados.`;
  campaignResultSummary.classList.remove('hidden');
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
  importCard.classList.add('hidden');
  messageCard.classList.add('hidden');
  resetImportState();
  resetCampaignState();
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
  importCard.classList.remove('hidden');
  messageCard.classList.remove('hidden');
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

    const response = await fetch('/session/start', { method: 'POST' });

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

    await downloadBlobResponse(response, 'contacts-export.json');
    setText(exportStatus, 'Exportacao concluida. Download iniciado.');
  } catch (error) {
    setText(exportStatus, error.message || 'Erro desconhecido.', true);
  } finally {
    exportBtn.disabled = false;
  }
};

const importContacts = async () => {
  const file = csvFileInput.files?.[0];

  if (!file) {
    setText(importStatus, 'Selecione um arquivo CSV antes de importar.', true);
    return;
  }

  importBtn.disabled = true;
  verifyBtn.disabled = true;
  downloadActions.classList.add('hidden');
  verificationSummary.classList.add('hidden');
  setText(importStatus, 'Importando e validando CSV...');

  try {
    const csv = await file.text();
    const response = await fetch('/import/contacts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        fileName: file.name,
        csv
      })
    });

    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(payload.message || 'Falha ao importar arquivo.');
    }

    importedContacts = payload.contacts || [];
    preparedTransmission = null;
    renderImportSummary(payload.summary);
    renderImportPreview(importedContacts);

    const validContacts = importedContacts.filter((contact) => contact.status === 'valid');
    verifyBtn.disabled = validContacts.length === 0;

    setText(
      importStatus,
      `Importacao concluida. ${payload.summary.validRows} contatos validos prontos para verificacao.`
    );
  } catch (error) {
    resetImportState();
    setText(importStatus, error.message || 'Falha ao importar CSV.', true);
  } finally {
    importBtn.disabled = false;
  }
};

const verifyImportedContacts = async () => {
  const validContacts = importedContacts.filter((contact) => contact.status === 'valid');

  if (validContacts.length === 0) {
    setText(importStatus, 'Nao ha contatos validos para verificar.', true);
    return;
  }

  verifyBtn.disabled = true;
  setText(importStatus, 'Verificando contatos no WhatsApp...');

  try {
    const response = await fetch('/transmission/prepare', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contacts: validContacts.map((contact) => ({
          rowNumber: contact.rowNumber,
          originalNumber: contact.originalNumber,
          normalizedNumber: contact.normalizedNumber,
          name: contact.name,
          originalName: contact.originalName,
          hasFallbackName: contact.hasFallbackName
        }))
      })
    });

    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(payload.message || 'Falha ao verificar contatos.');
    }

    preparedTransmission = payload;
    const verificationMap = new Map(payload.contacts.map((contact) => [contact.rowNumber, contact]));
    importedContacts = importedContacts.map((contact) => verificationMap.get(contact.rowNumber) || contact);

    renderImportPreview(importedContacts);
    renderVerificationSummary(payload);
    downloadActions.classList.toggle('hidden', payload.summary.whatsappValidContacts === 0);
    setText(importStatus, payload.message, payload.summary.whatsappValidContacts === 0);
  } catch (error) {
    setText(importStatus, error.message || 'Falha ao verificar contatos.', true);
    verifyBtn.disabled = false;
  }
};

const exportValidContacts = async (format) => {
  if (!preparedTransmission?.contacts?.length) {
    setText(importStatus, 'Verifique os contatos antes de exportar os validos.', true);
    return;
  }

  const button = format === 'json' ? downloadJsonBtn : downloadCsvBtn;
  button.disabled = true;

  try {
    const response = await fetch('/transmission/export-valid', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contacts: preparedTransmission.contacts,
        format
      })
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      throw new Error(payload.message || 'Falha ao exportar contatos validos.');
    }

    await downloadBlobResponse(
      response,
      format === 'json' ? 'validated-contacts.json' : 'validated-contacts.csv'
    );

    setText(importStatus, 'Contatos validos exportados com sucesso.');
  } catch (error) {
    setText(importStatus, error.message || 'Falha ao exportar contatos validos.', true);
  } finally {
    button.disabled = false;
  }
};

const loadCampaignInputs = async () => {
  const contactsFile = campaignContactsInput.files?.[0];
  const variablesFile = campaignVariablesInput.files?.[0];
  const template = messageTemplateInput.value.trim();

  if (!contactsFile) {
    throw new Error('Selecione o arquivo de contatos validos.');
  }

  if (!variablesFile) {
    throw new Error('Selecione o arquivo CSV de variaveis.');
  }

  if (!template) {
    throw new Error('Preencha o template da mensagem.');
  }

  return {
    contactsCsv: await contactsFile.text(),
    variablesCsv: await variablesFile.text(),
    template
  };
};

const previewCampaign = async () => {
  previewMessageBtn.disabled = true;
  sendMessageBtn.disabled = true;
  downloadReportBtn.disabled = true;
  setText(messageStatus, 'Gerando previa da campanha...');
  campaignResultSummary.classList.add('hidden');

  try {
    campaignInputs = await loadCampaignInputs();
    const response = await fetch('/messages/preview', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(campaignInputs)
    });

    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(payload.message || 'Falha ao gerar previa da campanha.');
    }

    campaignPreview = payload;
    campaignReport = null;
    renderCampaignPreview(payload);
    setText(messageStatus, 'Previa gerada. Revise as amostras antes de enviar.');
  } catch (error) {
    resetCampaignState();
    setText(messageStatus, error.message || 'Falha ao gerar previa da campanha.', true);
  } finally {
    previewMessageBtn.disabled = false;
  }
};

const sendCampaign = async () => {
  if (!campaignInputs || !campaignPreview) {
    setText(messageStatus, 'Gere a previa da campanha antes de enviar.', true);
    return;
  }

  sendMessageBtn.disabled = true;
  previewMessageBtn.disabled = true;
  downloadReportBtn.disabled = true;
  setText(messageStatus, 'Enviando campanha. Aguarde a conclusao do lote...');

  try {
    const response = await fetch('/messages/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        ...campaignInputs,
        rateDelayMs: 1200
      })
    });

    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(payload.message || 'Falha ao enviar campanha.');
    }

    campaignReport = payload;
    renderCampaignReportSummary(payload);
    downloadReportBtn.disabled = false;
    setText(messageStatus, 'Campanha concluida. O relatorio esta pronto para download.');
  } catch (error) {
    setText(messageStatus, error.message || 'Falha ao enviar campanha.', true);
    sendMessageBtn.disabled = false;
  } finally {
    previewMessageBtn.disabled = false;
  }
};

const downloadCampaignReport = () => {
  if (!campaignReport?.reportJson) {
    setText(messageStatus, 'Envie a campanha antes de baixar o relatorio.', true);
    return;
  }

  downloadTextFile(campaignReport.reportJson, 'message-campaign-report.json', 'application/json;charset=utf-8');
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
importBtn.addEventListener('click', importContacts);
verifyBtn.addEventListener('click', verifyImportedContacts);
downloadJsonBtn.addEventListener('click', () => exportValidContacts('json'));
downloadCsvBtn.addEventListener('click', () => exportValidContacts('csv'));
previewMessageBtn.addEventListener('click', previewCampaign);
sendMessageBtn.addEventListener('click', sendCampaign);
downloadReportBtn.addEventListener('click', downloadCampaignReport);
