// Main interactive behaviors: loading, scroll-progress, smooth scroll, lightbox, active menu
document.addEventListener('DOMContentLoaded', function(){
  // Loading screen
  const loader = document.getElementById('loading-screen');
  setTimeout(()=>{loader.classList.add('hide'); setTimeout(()=>loader.remove(),300)},2000);

  // Scroll progress
  const progressBar = document.getElementById('progress-bar');
  window.addEventListener('scroll', ()=>{
    const h = document.documentElement.scrollHeight - window.innerHeight;
    const sc = (window.scrollY/h)*100 || 0; progressBar.style.width = sc + '%';
  });

  // Navbar shrink on scroll
  const nav = document.getElementById('mainNav');
  window.addEventListener('scroll', ()=>{
    if(window.scrollY>50) nav.classList.add('nav-scrolled'); else nav.classList.remove('nav-scrolled');
  });

  // Smooth scroll for anchor links
  document.querySelectorAll('a[href^="#"]').forEach(a=>{
    a.addEventListener('click', function(e){
      const target = document.querySelector(this.getAttribute('href'));
      if(target){ e.preventDefault(); target.scrollIntoView({behavior:'smooth',block:'start'});
      }
    });
  });

  // Active menu on scroll
  const sections = document.querySelectorAll('main section[id]');
  function setActive(){
    let idx = sections.length;
    while(--idx && window.scrollY + 100 < sections[idx].offsetTop){}
    document.querySelectorAll('.navbar .nav-link').forEach(link=>link.classList.remove('active'));
    const id = sections[idx] && sections[idx].id;
    const activeLink = document.querySelector('.navbar .nav-link[href="#'+id+'"]'); if(activeLink) activeLink.classList.add('active');
  }
  setActive(); window.addEventListener('scroll', setActive);

  // Scroll to top
  const toTop = document.getElementById('toTop');
  window.addEventListener('scroll', ()=>{ toTop.style.display = window.scrollY>400 ? 'block' : 'none'; });
  toTop.addEventListener('click', ()=>window.scrollTo({top:0,behavior:'smooth'}));

  // Lightbox for gallery
  document.querySelectorAll('.masonry-item').forEach(img=>{
    img.addEventListener('click', ()=>{
      const src = img.getAttribute('src');
      document.getElementById('lightboxImg').src = src;
      const modal = new bootstrap.Modal(document.getElementById('lightboxModal'));
      modal.show();
    });
  });

  // Simple contact form (no backend) - show success toast
  const form = document.getElementById('contactForm');
  if(form){form.addEventListener('submit', function(e){e.preventDefault(); alert('Terima kasih, pesan Anda telah dikirim (demo).'); form.reset();});}
});

/* =====================
   Site Editor & Gallery
   ===================== */
(function(){
  const modalEl = document.getElementById('editorModal');
  if(!modalEl) return;
  const modal = new bootstrap.Modal(modalEl);
  const adminModal = new bootstrap.Modal(document.getElementById('adminModal'));
  const adminForm = document.getElementById('adminForm');
  const adminPassword = document.getElementById('adminPassword');

  // Admin state persisted in sessionStorage
  function isAdmin(){ return sessionStorage.getItem('sdnc-admin')==='1'; }
  function setAdmin(v){ if(v) sessionStorage.setItem('sdnc-admin','1'); else sessionStorage.removeItem('sdnc-admin'); updateAdminUI(); }

  function getAdminButtons(){
    return {
      adminBtn: document.getElementById('adminBtn'),
      adminLogoutBtn: document.getElementById('adminLogout')
    };
  }

  const passwordSection = document.getElementById('passwordSection');
  const currPass = document.getElementById('currPass');
  const newPass = document.getElementById('newPass');
  const confirmPass = document.getElementById('confirmPass');
  const changePassBtn = document.getElementById('changePassBtn');
  const adminPassControls = document.getElementById('adminPassControls');
  const toggleShowPass = document.getElementById('toggleShowPass');
  const resetDefaultPass = document.getElementById('resetDefaultPass');
  const clearStoredPass = document.getElementById('clearStoredPass');
  const currentPassDisplay = document.getElementById('currentPassDisplay');
  const currentPassText = document.getElementById('currentPassText');

  function updateAdminUI(){
    const {adminBtn, adminLogoutBtn} = getAdminButtons();
    const updates = document.querySelectorAll('.admin-update');
    if(!adminBtn || !adminLogoutBtn){ return; }
    if(isAdmin()){ adminBtn.classList.add('btn-success'); adminBtn.innerText='Admin (On)'; adminLogoutBtn.classList.remove('d-none'); updates.forEach(b=>b.classList.remove('d-none')); }
    else { adminBtn.classList.remove('btn-success'); adminBtn.innerText='Admin'; adminLogoutBtn.classList.add('d-none'); updates.forEach(b=>b.classList.add('d-none')); }
  }

  function initAdminButtons(){
    const {adminBtn, adminLogoutBtn} = getAdminButtons();
    if(!adminBtn || !adminLogoutBtn){
      setTimeout(initAdminButtons, 50);
      return;
    }

    updateAdminUI();
    adminBtn.addEventListener('click', ()=>{
      if(isAdmin()){ modal.show(); loadEditor(); return; }
      adminModal.show();
    });

    adminLogoutBtn.addEventListener('click', ()=>{ if(confirm('Logout admin?')) setAdmin(false); });
  }
  initAdminButtons();

  // Default password if none set in localStorage
  const DEFAULT_PASS = 'admin123';
  function checkPassword(p){
    const saved = localStorage.getItem('sdnc-pass');
    return p.trim() === (saved ? saved : DEFAULT_PASS);
  }

  let pendingSectionOpen = null;

  adminForm.addEventListener('submit', function(e){
    e.preventDefault();
    const p = adminPassword.value.trim();
    if(checkPassword(p)){
      setAdmin(true);
      adminModal.hide();
      adminPassword.value='';
      alert('Login admin sukses');
      if(pendingSectionOpen){
        openSectionEditor(pendingSectionOpen);
        pendingSectionOpen = null;
      } else {
        loadEditor();
      }
    } else {
      alert('Password salah');
    }
  });
  // Open editor via keyboard shortcut (Ctrl+E) - require admin
  document.addEventListener('keydown', (e)=>{ if(e.ctrlKey && e.key==='e'){ e.preventDefault(); if(isAdmin()){ modal.show(); loadEditor(); } else { adminModal.show(); } } });

  const editTitle = document.getElementById('editTitle');
  const editSubtitle = document.getElementById('editSubtitle');
  const editNpsn = document.getElementById('editNpsn');
  const editKec = document.getElementById('editKec');
  const editKab = document.getElementById('editKab');
  const editAddress = document.getElementById('editAddress');
  const galleryUpload = document.getElementById('galleryUpload');
  const uploadPreview = document.getElementById('uploadPreview') || document.getElementById('sectionUploadPreview');
  const exportBtn = document.getElementById('exportBtn');
  const importBtn = document.getElementById('importBtn');
  const importFile = document.getElementById('importFile');
  const resetBtn = document.getElementById('resetBtn');
  const toggleInlineEdit = document.getElementById('toggleInlineEdit');
  const logoUpload = document.getElementById('logoUpload');
  const aboutImageUpload = document.getElementById('aboutImageUpload');
  const sectionUpdateForm = document.getElementById('sectionUpdateForm');
  const genericEditorFields = document.getElementById('genericEditorFields');
  const sectionUpdateTitle = document.getElementById('sectionUpdateTitle');
  const sectionPanels = document.querySelectorAll('.section-panel');
  const sectionGalleryUpload = document.getElementById('sectionGalleryUpload');
  const sectionUploadPreview = document.getElementById('sectionUploadPreview');
  const sectionVisiTitle = document.getElementById('sectionVisiTitle');
  const sectionVisiText = document.getElementById('sectionVisiText');
  const sectionMisi1 = document.getElementById('sectionMisi1');
  const sectionMisi2 = document.getElementById('sectionMisi2');
  const sectionMisi3 = document.getElementById('sectionMisi3');
  const sectionMisi4 = document.getElementById('sectionMisi4');
  const sectionMisi5 = document.getElementById('sectionMisi5');
  const sectionMisi6 = document.getElementById('sectionMisi6');
  const sectionTujuanTitle = document.getElementById('sectionTujuanTitle');
  const sectionTujuanShortTitle = document.getElementById('sectionTujuanShortTitle');
  const sectionTujuanMidTitle = document.getElementById('sectionTujuanMidTitle');
  const sectionTujuanLongTitle = document.getElementById('sectionTujuanLongTitle');
  const sectionTujuanShortText = document.getElementById('sectionTujuanShortText');
  const sectionTujuanMidText = document.getElementById('sectionTujuanMidText');
  const sectionTujuanLongText = document.getElementById('sectionTujuanLongText');
  const sectionGuruKepala = document.getElementById('sectionGuruKepala');
  const sectionGuruKelas = document.getElementById('sectionGuruKelas');
  const sectionGuruPai = document.getElementById('sectionGuruPai');
  const sectionGuruPjok = document.getElementById('sectionGuruPjok');
  const sectionGuruOperator = document.getElementById('sectionGuruOperator');
  const sectionGuruPenjaga = document.getElementById('sectionGuruPenjaga');
  const sectionPesertaIL = document.getElementById('sectionPesertaIL');
  const sectionPesertaIP = document.getElementById('sectionPesertaIP');
  const sectionPesertaIJumlah = document.getElementById('sectionPesertaIJumlah');
  const sectionPesertaIIL = document.getElementById('sectionPesertaIIL');
  const sectionPesertaIIP = document.getElementById('sectionPesertaIIP');
  const sectionPesertaIIJumlah = document.getElementById('sectionPesertaIIJumlah');
  const sectionPesertaIIIL = document.getElementById('sectionPesertaIIIL');
  const sectionPesertaIIIP = document.getElementById('sectionPesertaIIIP');
  const sectionPesertaIIIJumlah = document.getElementById('sectionPesertaIIIJumlah');
  const sectionPesertaIVL = document.getElementById('sectionPesertaIVL');
  const sectionPesertaIVP = document.getElementById('sectionPesertaIVP');
  const sectionPesertaIVJumlah = document.getElementById('sectionPesertaIVJumlah');
  const sectionPesertaVL = document.getElementById('sectionPesertaVL');
  const sectionPesertaVP = document.getElementById('sectionPesertaVP');
  const sectionPesertaVJumlah = document.getElementById('sectionPesertaVJumlah');
  const sectionPesertaVIL = document.getElementById('sectionPesertaVIL');
  const sectionPesertaVIP = document.getElementById('sectionPesertaVIP');
  const sectionPesertaVIJumlah = document.getElementById('sectionPesertaVIJumlah');
  const sectionPesertaTotalL = document.getElementById('sectionPesertaTotalL');
  const sectionPesertaTotalP = document.getElementById('sectionPesertaTotalP');
  const sectionPesertaTotalJumlah = document.getElementById('sectionPesertaTotalJumlah');
  const sectionProgram1 = document.getElementById('sectionProgram1');
  const sectionProgram2 = document.getElementById('sectionProgram2');
  const sectionProgram3 = document.getElementById('sectionProgram3');
  const sectionProgram4 = document.getElementById('sectionProgram4');
  const sectionProgram5 = document.getElementById('sectionProgram5');
  const sectionProgram6 = document.getElementById('sectionProgram6');
  const sectionProgram7 = document.getElementById('sectionProgram7');
  const sectionProgram8 = document.getElementById('sectionProgram8');
  const sectionExtra1 = document.getElementById('sectionExtra1');
  const sectionExtra2 = document.getElementById('sectionExtra2');
  const sectionExtra3 = document.getElementById('sectionExtra3');
  const sectionExtra4 = document.getElementById('sectionExtra4');
  const sectionExtra5 = document.getElementById('sectionExtra5');
  const sectionExtra1Schedule = document.getElementById('sectionExtra1Schedule');
  const sectionExtra2Schedule = document.getElementById('sectionExtra2Schedule');
  const sectionExtra3Schedule = document.getElementById('sectionExtra3Schedule');
  const sectionExtra4Schedule = document.getElementById('sectionExtra4Schedule');
  const sectionExtra1Desc = document.getElementById('sectionExtra1Desc');
  const sectionExtra2Desc = document.getElementById('sectionExtra2Desc');
  const sectionExtra3Desc = document.getElementById('sectionExtra3Desc');
  const sectionExtra4Desc = document.getElementById('sectionExtra4Desc');
  const sectionAnnouncementTitle = document.getElementById('sectionAnnouncementTitle');
  const sectionAnnouncementDate = document.getElementById('sectionAnnouncementDate');
  const sectionAnnouncementText = document.getElementById('sectionAnnouncementText');
  const sectionAnnouncementImageUpload = document.getElementById('sectionAnnouncementImageUpload');
  const sectionAnnouncementImagePreview = document.getElementById('sectionAnnouncementImagePreview');
  const sectionAboutTitle = document.getElementById('sectionAboutTitle');
  const sectionAboutProfile = document.getElementById('sectionAboutProfile');

  function safeSetLogo(logo){
    const fallbackLogo = 'assets/logo.svg';
    const value = (typeof logo === 'string' && logo.trim()) ? logo : fallbackLogo;
    document.querySelectorAll('[data-key="site.logo"]').forEach((img)=>{
      img.src = value;
      img.onerror = () => {
        if (img.getAttribute('src') !== fallbackLogo) {
          img.src = fallbackLogo;
        }
      };
    });
  }
  const sectionContactTitle = document.getElementById('sectionContactTitle');
  const sectionContactPhone = document.getElementById('sectionContactPhone');
  const sectionContactEmail = document.getElementById('sectionContactEmail');
  const sectionContactWebsite = document.getElementById('sectionContactWebsite');

  function saveState(state){ localStorage.setItem('sdnc-site', JSON.stringify(state)); }
  function loadState(){ try{return JSON.parse(localStorage.getItem('sdnc-site'))||null;}catch(e){return null} }

  function loadEditor(){
    const state = loadState();
    if(state){
      editTitle.value = state.title || '';
      editSubtitle.value = state.subtitle || '';
      editNpsn.value = state.npsn || '';
      editKec.value = state.kecamatan || '';
      editKab.value = state.kabupaten || '';
      editAddress.value = state.address || '';
      renderGallery(state.gallery||[]);
      // apply editable content
      if(state.editable){
        Object.keys(state.editable).forEach(key=>{
          const el = document.querySelector('[data-key="'+key+'"]');
          if(el) el.innerHTML = state.editable[key];
        });
      }
      // apply images
      if(state.logo) safeSetLogo(state.logo);
      else safeSetLogo('assets/logo.svg');
      if(state.aboutImage) { const ai = document.getElementById('aboutImage'); if(ai) ai.src = state.aboutImage; }
     if(state.announcementImage){ const ai = document.getElementById('announcementImage'); if(ai){ ai.src = state.announcementImage; ai.classList.remove('d-none'); }}
    } else {
      // defaults from DOM
      editTitle.value = document.querySelector('.navbar-brand .fw-bold')?.innerText || '';
      editSubtitle.value = document.querySelector('#hero .lead')?.innerText || '';
      editNpsn.value = document.getElementById('idNpsn')?.innerText || '';
      editKec.value = document.getElementById('idKec')?.innerText || '';
      editKab.value = document.getElementById('idKab')?.innerText || '';
      editAddress.value = document.querySelector('#contact p')?.innerText || '';
      renderGallery([]);
    }
    clearSectionPanels();
  }

  function clearSectionPanels(){
    if(sectionPanels){ sectionPanels.forEach(panel=>panel.classList.add('d-none')); }
    if(sectionUpdateForm) sectionUpdateForm.classList.add('d-none');
    if(genericEditorFields) genericEditorFields.classList.remove('d-none');
    sectionEditing = null;
  }

  function getSectionLabel(prefix){
    switch(prefix){
      case 'visi': return 'Visi & Misi';
      case 'tujuan': return 'Tujuan Sekolah';
      case 'data': return 'Data Sekolah';
      case 'program': return 'Program & Ekstrakurikuler';
      case 'announcement': return 'Pengumuman Harian';
      case 'gallery': return 'Galeri';
      case 'about': return 'About';
      case 'contact': return 'Kontak';
      default: return 'Seksi';
    }
  }

  function openSectionEditor(prefix){
    loadEditor();
    clearSectionPanels();
    if(genericEditorFields) genericEditorFields.classList.add('d-none');
    if(sectionUpdateForm) sectionUpdateForm.classList.remove('d-none');
    if(sectionUpdateTitle) sectionUpdateTitle.innerText = 'Edit ' + getSectionLabel(prefix);
    const panel = document.getElementById('panel-'+prefix);
    if(panel) panel.classList.remove('d-none');
    fillSectionFields(prefix);
    sectionEditing = prefix;
    modal.show();
  }

  // Section editing state: when non-null, only save/update keys for active section
  let sectionEditing = null;
  let activeUpdateButtons = [];
  let cancelButton = null;

  const adminUpdateButtons = document.querySelectorAll('.admin-update');

  function clearSectionEdit(){
    document.querySelectorAll('[data-editable="true"]').forEach(el=>{
      el.contentEditable = 'false';
      el.classList.remove('editable-active');
    });
    clearSectionEditMessage();
    if(activeUpdateButtons.length){
      activeUpdateButtons.forEach(btn=>btn.innerText = 'Edit');
      activeUpdateButtons = [];
    }
    if(cancelButton){
      cancelButton.remove();
      cancelButton = null;
    }
    sectionEditing = null;
  }

  function clearSectionEditMessage(){
    document.querySelectorAll('.section-edit-note').forEach(el=>el.remove());
  }

  function setSectionEditable(prefix, enable){
    const selectors = [];
    if(prefix==='visi') selectors.push('[data-key="visi.title"]','[data-key="visi.text"]','[data-key="misi.1"]','[data-key="misi.2"]','[data-key="misi.3"]','[data-key="misi.4"]','[data-key="misi.5"]','[data-key="misi.6"]');
    if(prefix==='tujuan') selectors.push('[data-key="tujuan.title"]','[data-key="tujuan.short.title"]','[data-key="tujuan.mid.title"]','[data-key="tujuan.long.title"]','[data-key="tujuan.short.text"]','[data-key="tujuan.mid.text"]','[data-key="tujuan.long.text"]');
    if(prefix==='data') selectors.push(
      '[data-key="data.guru.kepala"]',
      '[data-key="data.guru.guruKelas"]',
      '[data-key="data.guru.pai"]',
      '[data-key="data.guru.pjok"]',
      '[data-key="data.guru.operator"]',
      '[data-key="data.guru.penjaga"]',
      '[data-key="data.peserta.i.l"]',
      '[data-key="data.peserta.i.p"]',
      '[data-key="data.peserta.i.jumlah"]',
      '[data-key="data.peserta.ii.l"]',
      '[data-key="data.peserta.ii.p"]',
      '[data-key="data.peserta.ii.jumlah"]',
      '[data-key="data.peserta.iii.l"]',
      '[data-key="data.peserta.iii.p"]',
      '[data-key="data.peserta.iii.jumlah"]',
      '[data-key="data.peserta.iv.l"]',
      '[data-key="data.peserta.iv.p"]',
      '[data-key="data.peserta.iv.jumlah"]',
      '[data-key="data.peserta.v.l"]',
      '[data-key="data.peserta.v.p"]',
      '[data-key="data.peserta.v.jumlah"]',
      '[data-key="data.peserta.vi.l"]',
      '[data-key="data.peserta.vi.p"]',
      '[data-key="data.peserta.vi.jumlah"]',
      '[data-key="data.peserta.total.l"]',
      '[data-key="data.peserta.total.p"]',
      '[data-key="data.peserta.total.jumlah"]'
    );
    if(prefix==='about') selectors.push('[data-key="about.title"]','[data-key="about.profile"]','[data-key="identity.name"]','[data-key="identity.npsn"]','[data-key="identity.kecamatan"]','[data-key="identity.kabupaten"]','[data-key="identity.provinsi"]');
    if(prefix==='contact') selectors.push('[data-key="contact.title"]','[data-key="contact.address"]','[data-key="contact.phone"]','[data-key="contact.email"]','[data-key="contact.website"]');
    if(prefix==='program') selectors.push('[data-key="program.1"]','[data-key="program.2"]','[data-key="program.3"]','[data-key="program.4"]','[data-key="program.5"]','[data-key="program.6"]','[data-key="program.7"]','[data-key="program.8"]','[data-key="ekstra.1"]','[data-key="ekstra.2"]','[data-key="ekstra.3"]','[data-key="ekstra.4"]','[data-key="ekstra.5"]','[data-key="ekstra.1.schedule"]','[data-key="ekstra.2.schedule"]','[data-key="ekstra.3.schedule"]','[data-key="ekstra.4.schedule"]','[data-key="ekstra.1.desc"]','[data-key="ekstra.2.desc"]','[data-key="ekstra.3.desc"]','[data-key="ekstra.4.desc"]');
    if(prefix==='announcement') selectors.push('[data-key="announcement.title"]','[data-key="announcement.date"]','[data-key="announcement.text"]');
    if(prefix==='gallery') selectors.push('[data-key="gallery.title"]');
    selectors.forEach(sel=>{
      const el = document.querySelector(sel);
      if(el){
        el.contentEditable = enable ? 'true' : 'false';
        if(enable) el.classList.add('editable-active'); else el.classList.remove('editable-active');
      }
    });
  }

  function toggleSectionEdit(prefix, button){
    if(sectionEditing && sectionEditing === prefix){
      saveSection(prefix);
      return;
    }
    if(sectionEditing){
      clearSectionEdit();
    }
    sectionEditing = prefix;
    activeUpdateButtons = Array.from(document.querySelectorAll('.admin-update[data-section="'+prefix+'"]'));
    activeUpdateButtons.forEach(btn=>btn.innerText = 'Simpan');
    const firstBtn = activeUpdateButtons[0];
    if(firstBtn){
      cancelButton = document.createElement('button');
      cancelButton.type = 'button';
      cancelButton.className = 'btn btn-sm btn-outline-danger ms-2 admin-cancel';
      cancelButton.innerText = 'Batal';
      cancelButton.addEventListener('click', ()=>{ cancelSectionEdit(); });
      firstBtn.after(cancelButton);
    }
    setSectionEditable(prefix, true);
    showSectionEditMessage(prefix);
    const target = document.querySelector('.admin-update[data-section="'+prefix+'"]');
    if(target) target.scrollIntoView({behavior:'smooth', block:'center'});
  }

  function showSectionEditMessage(prefix){
    clearSectionEditMessage();
    const button = document.querySelector('.admin-update[data-section="'+prefix+'"]');
    if(!button) return;
    const note = document.createElement('div');
    note.className = 'section-edit-note alert alert-info py-2 px-3 mt-3';
    note.innerText = 'Silakan klik langsung pada teks di bagian ini untuk mengeditnya. Setelah selesai, klik tombol Simpan atau Batal.';
    button.parentElement?.appendChild(note);
  }

  function cancelSectionEdit(){
    const state = loadState() || {};
    if(state.editable){
      Object.keys(state.editable).forEach(key=>{
        const el = document.querySelector('[data-key="'+key+'"]');
        if(el) el.innerHTML = state.editable[key];
      });
    }
    setSectionEditable(sectionEditing, false);
    clearSectionEdit();
  }

  function saveSection(prefix){
    const state = loadState() || {};
    state.editable = state.editable || {};
    const keys = [];
    if(prefix==='visi') keys.push('visi.title','visi.text','misi.1','misi.2','misi.3','misi.4','misi.5','misi.6');
    if(prefix==='tujuan') keys.push('tujuan.title','tujuan.short.title','tujuan.mid.title','tujuan.long.title','tujuan.short.text','tujuan.mid.text','tujuan.long.text');
    if(prefix==='data') keys.push(
      'data.guru.kepala',
      'data.guru.guruKelas',
      'data.guru.pai',
      'data.guru.pjok',
      'data.guru.operator',
      'data.guru.penjaga',
      'data.peserta.i.l',
      'data.peserta.i.p',
      'data.peserta.i.jumlah',
      'data.peserta.ii.l',
      'data.peserta.ii.p',
      'data.peserta.ii.jumlah',
      'data.peserta.iii.l',
      'data.peserta.iii.p',
      'data.peserta.iii.jumlah',
      'data.peserta.iv.l',
      'data.peserta.iv.p',
      'data.peserta.iv.jumlah',
      'data.peserta.v.l',
      'data.peserta.v.p',
      'data.peserta.v.jumlah',
      'data.peserta.vi.l',
      'data.peserta.vi.p',
      'data.peserta.vi.jumlah',
      'data.peserta.total.l',
      'data.peserta.total.p',
      'data.peserta.total.jumlah'
    );
    if(prefix==='about') keys.push('about.title','about.profile','identity.name','identity.npsn','identity.kecamatan','identity.kabupaten','identity.provinsi');
    if(prefix==='contact') keys.push('contact.title','contact.address','contact.phone','contact.email','contact.website');
    if(prefix==='program') keys.push('program.1','program.2','program.3','program.4','program.5','program.6','program.7','program.8','ekstra.1','ekstra.2','ekstra.3','ekstra.4','ekstra.5');
    if(prefix==='announcement') keys.push('announcement.title','announcement.date','announcement.text');
    if(prefix==='gallery') keys.push('gallery.title');
    keys.forEach(key=>{
      const el = document.querySelector('[data-key="'+key+'"]'); if(el) state.editable[key] = el.innerHTML;
    });
    saveState(state);
    applyStateToDOM(state);
    setSectionEditable(prefix, false);
    clearSectionEdit();
    alert('Perubahan pada seksi '+prefix+' tersimpan.');
  }

  function fillSectionFields(prefix){
    const state = loadState() || {};
    const editable = state.editable || {};
    if(prefix==='visi'){
      sectionVisiTitle.value = editable['visi.title'] || document.querySelector('[data-key="visi.title"]')?.innerText || '';
      sectionVisiText.value = editable['visi.text'] || document.querySelector('[data-key="visi.text"]')?.innerText || '';
      sectionMisi1.value = editable['misi.1'] || document.querySelector('[data-key="misi.1"]')?.innerText || '';
      sectionMisi2.value = editable['misi.2'] || document.querySelector('[data-key="misi.2"]')?.innerText || '';
      sectionMisi3.value = editable['misi.3'] || document.querySelector('[data-key="misi.3"]')?.innerText || '';
      sectionMisi4.value = editable['misi.4'] || document.querySelector('[data-key="misi.4"]')?.innerText || '';
      sectionMisi5.value = editable['misi.5'] || document.querySelector('[data-key="misi.5"]')?.innerText || '';
      sectionMisi6.value = editable['misi.6'] || document.querySelector('[data-key="misi.6"]')?.innerText || '';
    }
    if(prefix==='tujuan'){
      sectionTujuanTitle.value = editable['tujuan.title'] || document.querySelector('[data-key="tujuan.title"]')?.innerText || '';
      sectionTujuanShortTitle.value = editable['tujuan.short.title'] || document.querySelector('[data-key="tujuan.short.title"]')?.innerText || '';
      sectionTujuanMidTitle.value = editable['tujuan.mid.title'] || document.querySelector('[data-key="tujuan.mid.title"]')?.innerText || '';
      sectionTujuanLongTitle.value = editable['tujuan.long.title'] || document.querySelector('[data-key="tujuan.long.title"]')?.innerText || '';
      sectionTujuanShortText.value = editable['tujuan.short.text'] || document.querySelector('[data-key="tujuan.short.text"]')?.innerText || '';
      sectionTujuanMidText.value = editable['tujuan.mid.text'] || document.querySelector('[data-key="tujuan.mid.text"]')?.innerText || '';
      sectionTujuanLongText.value = editable['tujuan.long.text'] || document.querySelector('[data-key="tujuan.long.text"]')?.innerText || '';
    }
    if(prefix==='data'){
      sectionGuruKepala.value = editable['data.guru.kepala'] || document.querySelector('[data-key="data.guru.kepala"]')?.innerText || '';
      sectionGuruKelas.value = editable['data.guru.guruKelas'] || document.querySelector('[data-key="data.guru.guruKelas"]')?.innerText || '';
      sectionGuruPai.value = editable['data.guru.pai'] || document.querySelector('[data-key="data.guru.pai"]')?.innerText || '';
      sectionGuruPjok.value = editable['data.guru.pjok'] || document.querySelector('[data-key="data.guru.pjok"]')?.innerText || '';
      sectionGuruOperator.value = editable['data.guru.operator'] || document.querySelector('[data-key="data.guru.operator"]')?.innerText || '';
      sectionGuruPenjaga.value = editable['data.guru.penjaga'] || document.querySelector('[data-key="data.guru.penjaga"]')?.innerText || '';
      sectionPesertaIL.value = editable['data.peserta.i.l'] || document.querySelector('[data-key="data.peserta.i.l"]')?.innerText || '';
      sectionPesertaIP.value = editable['data.peserta.i.p'] || document.querySelector('[data-key="data.peserta.i.p"]')?.innerText || '';
      sectionPesertaIJumlah.value = editable['data.peserta.i.jumlah'] || document.querySelector('[data-key="data.peserta.i.jumlah"]')?.innerText || '';
      sectionPesertaIIL.value = editable['data.peserta.ii.l'] || document.querySelector('[data-key="data.peserta.ii.l"]')?.innerText || '';
      sectionPesertaIIP.value = editable['data.peserta.ii.p'] || document.querySelector('[data-key="data.peserta.ii.p"]')?.innerText || '';
      sectionPesertaIIJumlah.value = editable['data.peserta.ii.jumlah'] || document.querySelector('[data-key="data.peserta.ii.jumlah"]')?.innerText || '';
      sectionPesertaIIIL.value = editable['data.peserta.iii.l'] || document.querySelector('[data-key="data.peserta.iii.l"]')?.innerText || '';
      sectionPesertaIIIP.value = editable['data.peserta.iii.p'] || document.querySelector('[data-key="data.peserta.iii.p"]')?.innerText || '';
      sectionPesertaIIIJumlah.value = editable['data.peserta.iii.jumlah'] || document.querySelector('[data-key="data.peserta.iii.jumlah"]')?.innerText || '';
      sectionPesertaIVL.value = editable['data.peserta.iv.l'] || document.querySelector('[data-key="data.peserta.iv.l"]')?.innerText || '';
      sectionPesertaIVP.value = editable['data.peserta.iv.p'] || document.querySelector('[data-key="data.peserta.iv.p"]')?.innerText || '';
      sectionPesertaIVJumlah.value = editable['data.peserta.iv.jumlah'] || document.querySelector('[data-key="data.peserta.iv.jumlah"]')?.innerText || '';
      sectionPesertaVL.value = editable['data.peserta.v.l'] || document.querySelector('[data-key="data.peserta.v.l"]')?.innerText || '';
      sectionPesertaVP.value = editable['data.peserta.v.p'] || document.querySelector('[data-key="data.peserta.v.p"]')?.innerText || '';
      sectionPesertaVJumlah.value = editable['data.peserta.v.jumlah'] || document.querySelector('[data-key="data.peserta.v.jumlah"]')?.innerText || '';
      sectionPesertaVIL.value = editable['data.peserta.vi.l'] || document.querySelector('[data-key="data.peserta.vi.l"]')?.innerText || '';
      sectionPesertaVIP.value = editable['data.peserta.vi.p'] || document.querySelector('[data-key="data.peserta.vi.p"]')?.innerText || '';
      sectionPesertaVIJumlah.value = editable['data.peserta.vi.jumlah'] || document.querySelector('[data-key="data.peserta.vi.jumlah"]')?.innerText || '';
      sectionPesertaTotalL.value = editable['data.peserta.total.l'] || document.querySelector('[data-key="data.peserta.total.l"]')?.innerText || '';
      sectionPesertaTotalP.value = editable['data.peserta.total.p'] || document.querySelector('[data-key="data.peserta.total.p"]')?.innerText || '';
      sectionPesertaTotalJumlah.value = editable['data.peserta.total.jumlah'] || document.querySelector('[data-key="data.peserta.total.jumlah"]')?.innerText || '';
    }
    if(prefix==='program'){
      sectionProgram1.value = editable['program.1'] || document.querySelector('[data-key="program.1"]')?.innerText || '';
      sectionProgram2.value = editable['program.2'] || document.querySelector('[data-key="program.2"]')?.innerText || '';
      sectionProgram3.value = editable['program.3'] || document.querySelector('[data-key="program.3"]')?.innerText || '';
      sectionProgram4.value = editable['program.4'] || document.querySelector('[data-key="program.4"]')?.innerText || '';
      sectionProgram5.value = editable['program.5'] || document.querySelector('[data-key="program.5"]')?.innerText || '';
      sectionProgram6.value = editable['program.6'] || document.querySelector('[data-key="program.6"]')?.innerText || '';
      sectionProgram7.value = editable['program.7'] || document.querySelector('[data-key="program.7"]')?.innerText || '';
      sectionProgram8.value = editable['program.8'] || document.querySelector('[data-key="program.8"]')?.innerText || '';
      sectionExtra1.value = editable['ekstra.1'] || document.querySelector('[data-key="ekstra.1"]')?.innerText || '';
      sectionExtra2.value = editable['ekstra.2'] || document.querySelector('[data-key="ekstra.2"]')?.innerText || '';
      sectionExtra3.value = editable['ekstra.3'] || document.querySelector('[data-key="ekstra.3"]')?.innerText || '';
      sectionExtra4.value = editable['ekstra.4'] || document.querySelector('[data-key="ekstra.4"]')?.innerText || '';
      sectionExtra5.value = editable['ekstra.5'] || document.querySelector('[data-key="ekstra.5"]')?.innerText || '';
      sectionExtra1Schedule.value = editable['ekstra.1.schedule'] || document.querySelector('[data-key="ekstra.1.schedule"]')?.innerText || '';
      sectionExtra2Schedule.value = editable['ekstra.2.schedule'] || document.querySelector('[data-key="ekstra.2.schedule"]')?.innerText || '';
      sectionExtra3Schedule.value = editable['ekstra.3.schedule'] || document.querySelector('[data-key="ekstra.3.schedule"]')?.innerText || '';
      sectionExtra4Schedule.value = editable['ekstra.4.schedule'] || document.querySelector('[data-key="ekstra.4.schedule"]')?.innerText || '';
      sectionExtra1Desc.value = editable['ekstra.1.desc'] || document.querySelector('[data-key="ekstra.1.desc"]')?.innerText || '';
      sectionExtra2Desc.value = editable['ekstra.2.desc'] || document.querySelector('[data-key="ekstra.2.desc"]')?.innerText || '';
      sectionExtra3Desc.value = editable['ekstra.3.desc'] || document.querySelector('[data-key="ekstra.3.desc"]')?.innerText || '';
      sectionExtra4Desc.value = editable['ekstra.4.desc'] || document.querySelector('[data-key="ekstra.4.desc"]')?.innerText || '';
    }
    if(prefix==='announcement'){
      sectionAnnouncementTitle.value = editable['announcement.title'] || document.querySelector('[data-key="announcement.title"]')?.innerText || '';
      sectionAnnouncementDate.value = editable['announcement.date'] || document.querySelector('[data-key="announcement.date"]')?.innerText || '';
      sectionAnnouncementText.value = editable['announcement.text'] || document.querySelector('[data-key="announcement.text"]')?.innerText || '';
      if(sectionAnnouncementImagePreview){
        sectionAnnouncementImagePreview.innerHTML = '';
        const imgSrc = state.announcementImage || '';
        if(imgSrc){
          const img = document.createElement('img');
          img.src = imgSrc;
          img.className = 'img-fluid rounded';
          img.alt = 'Preview Foto Pengumuman';
          sectionAnnouncementImagePreview.appendChild(img);
        }
      }
      if(sectionAnnouncementImageUpload) sectionAnnouncementImageUpload.value = '';
    }
    if(prefix==='gallery'){
      if(sectionUploadPreview) sectionUploadPreview.innerHTML = '';
      if(sectionGalleryUpload) sectionGalleryUpload.value = '';
    }
  }

  function renderGallery(list){
    const container = document.querySelector('.masonry');
    if(!container) return;
    container.innerHTML = '';
    if(uploadPreview) uploadPreview.innerHTML = '';
    (list||[]).slice(0,12).forEach(src=>{
      const img = document.createElement('img'); img.src = src; img.className='masonry-item rounded'; img.loading='lazy'; img.alt='galeri';
      container.appendChild(img);
      const p = document.createElement('img'); p.src=src; p.width=80; p.className='rounded'; if(uploadPreview) uploadPreview.appendChild(p);
      img.addEventListener('click', ()=>{ document.getElementById('lightboxImg').src = src; new bootstrap.Modal(document.getElementById('lightboxModal')).show(); });
    });
  }

  // Handle upload
  if(galleryUpload){
    galleryUpload.addEventListener('change', async function(){
      const files = Array.from(this.files).slice(0,8);
      const read = files.map(f=> new Promise((res)=>{ const r=new FileReader(); r.onload=()=>res(r.result); r.readAsDataURL(f); }));
      const imgs = await Promise.all(read);
      const state = loadState() || {};
      state.gallery = (state.gallery||[]).concat(imgs).slice(0,12);
      saveState(state);
      renderGallery(state.gallery);
    });
  }

  // Save editor
  document.getElementById('siteEditor').addEventListener('submit', function(e){
    e.preventDefault();
    const state = loadState() || {};
    state.title = editTitle.value;
    state.subtitle = editSubtitle.value;
    state.npsn = editNpsn.value;
    state.kecamatan = editKec.value;
    state.kabupaten = editKab.value;
    state.address = editAddress.value;
     state.editable = state.editable || {};
     if(sectionEditing){
       if(sectionEditing === 'visi'){
         state.editable['visi.title'] = sectionVisiTitle.value;
         state.editable['visi.text'] = sectionVisiText.value;
         state.editable['misi.1'] = sectionMisi1.value;
         state.editable['misi.2'] = sectionMisi2.value;
         state.editable['misi.3'] = sectionMisi3.value;
         state.editable['misi.4'] = sectionMisi4.value;
         state.editable['misi.5'] = sectionMisi5.value;
         state.editable['misi.6'] = sectionMisi6.value;
       }
       if(sectionEditing === 'tujuan'){
         state.editable['tujuan.title'] = sectionTujuanTitle.value;
         state.editable['tujuan.short.title'] = sectionTujuanShortTitle.value;
         state.editable['tujuan.mid.title'] = sectionTujuanMidTitle.value;
         state.editable['tujuan.long.title'] = sectionTujuanLongTitle.value;
         state.editable['tujuan.short.text'] = sectionTujuanShortText.value;
         state.editable['tujuan.mid.text'] = sectionTujuanMidText.value;
         state.editable['tujuan.long.text'] = sectionTujuanLongText.value;
       }
       if(sectionEditing === 'data'){
         state.editable['data.guru.kepala'] = sectionGuruKepala.value;
         state.editable['data.guru.guruKelas'] = sectionGuruKelas.value;
         state.editable['data.guru.pai'] = sectionGuruPai.value;
         state.editable['data.guru.pjok'] = sectionGuruPjok.value;
         state.editable['data.guru.operator'] = sectionGuruOperator.value;
         state.editable['data.guru.penjaga'] = sectionGuruPenjaga.value;
         state.editable['data.peserta.i.l'] = sectionPesertaIL.value;
         state.editable['data.peserta.i.p'] = sectionPesertaIP.value;
         state.editable['data.peserta.i.jumlah'] = sectionPesertaIJumlah.value;
         state.editable['data.peserta.ii.l'] = sectionPesertaIIL.value;
         state.editable['data.peserta.ii.p'] = sectionPesertaIIP.value;
         state.editable['data.peserta.ii.jumlah'] = sectionPesertaIIJumlah.value;
         state.editable['data.peserta.iii.l'] = sectionPesertaIIIL.value;
         state.editable['data.peserta.iii.p'] = sectionPesertaIIIP.value;
         state.editable['data.peserta.iii.jumlah'] = sectionPesertaIIIJumlah.value;
         state.editable['data.peserta.iv.l'] = sectionPesertaIVL.value;
         state.editable['data.peserta.iv.p'] = sectionPesertaIVP.value;
         state.editable['data.peserta.iv.jumlah'] = sectionPesertaIVJumlah.value;
         state.editable['data.peserta.v.l'] = sectionPesertaVL.value;
         state.editable['data.peserta.v.p'] = sectionPesertaVP.value;
         state.editable['data.peserta.v.jumlah'] = sectionPesertaVJumlah.value;
         state.editable['data.peserta.vi.l'] = sectionPesertaVIL.value;
         state.editable['data.peserta.vi.p'] = sectionPesertaVIP.value;
         state.editable['data.peserta.vi.jumlah'] = sectionPesertaVIJumlah.value;
         state.editable['data.peserta.total.l'] = sectionPesertaTotalL.value;
         state.editable['data.peserta.total.p'] = sectionPesertaTotalP.value;
         state.editable['data.peserta.total.jumlah'] = sectionPesertaTotalJumlah.value;
       }
       if(sectionEditing === 'about'){
         state.editable['about.title'] = sectionAboutTitle.value;
         state.editable['about.profile'] = sectionAboutProfile.value;
       }
       if(sectionEditing === 'contact'){
         state.editable['contact.title'] = sectionContactTitle.value;
         state.editable['contact.phone'] = sectionContactPhone.value;
         state.editable['contact.email'] = sectionContactEmail.value;
         state.editable['contact.website'] = sectionContactWebsite.value;
       }
       if(sectionEditing === 'program'){
         state.editable['program.1'] = sectionProgram1.value;
         state.editable['program.2'] = sectionProgram2.value;
         state.editable['program.3'] = sectionProgram3.value;
         state.editable['program.4'] = sectionProgram4.value;
         state.editable['program.5'] = sectionProgram5.value;
         state.editable['program.6'] = sectionProgram6.value;
         state.editable['program.7'] = sectionProgram7.value;
         state.editable['program.8'] = sectionProgram8.value;
         state.editable['ekstra.1'] = sectionExtra1.value;
         state.editable['ekstra.2'] = sectionExtra2.value;
         state.editable['ekstra.3'] = sectionExtra3.value;
         state.editable['ekstra.4'] = sectionExtra4.value;
         state.editable['ekstra.5'] = sectionExtra5.value;
         state.editable['ekstra.1.schedule'] = sectionExtra1Schedule.value;
         state.editable['ekstra.2.schedule'] = sectionExtra2Schedule.value;
         state.editable['ekstra.3.schedule'] = sectionExtra3Schedule.value;
         state.editable['ekstra.4.schedule'] = sectionExtra4Schedule.value;
         state.editable['ekstra.1.desc'] = sectionExtra1Desc.value;
         state.editable['ekstra.2.desc'] = sectionExtra2Desc.value;
         state.editable['ekstra.3.desc'] = sectionExtra3Desc.value;
         state.editable['ekstra.4.desc'] = sectionExtra4Desc.value;
       }
       if(sectionEditing === 'announcement'){
         state.editable['announcement.title'] = sectionAnnouncementTitle.value;
         state.editable['announcement.date'] = sectionAnnouncementDate.value;
         state.editable['announcement.text'] = sectionAnnouncementText.value;
         if(sectionAnnouncementImageUpload && sectionAnnouncementImageUpload.files.length){
           const files = Array.from(sectionAnnouncementImageUpload.files).slice(0,1);
           const read = files.map(f=> new Promise((res)=>{ const r = new FileReader(); r.onload = ()=>res(r.result); r.readAsDataURL(f); }));
           Promise.all(read).then(imgs=>{
             state.announcementImage = imgs[0];
             saveState(state);
             applyStateToDOM(state);
             sectionEditing = null;
             modal.hide();
             alert('Perubahan pengumuman tersimpan.');
           }).catch(()=>alert('Gagal memuat foto pengumuman.'));
           return;
         }
       }
       if(sectionEditing === 'gallery' && sectionGalleryUpload.files.length){
         const files = Array.from(sectionGalleryUpload.files).slice(0,8);
         const read = files.map(f=> new Promise((res)=>{ const r=new FileReader(); r.onload=()=>res(r.result); r.readAsDataURL(f); }));
         Promise.all(read).then(imgs=>{
           state.gallery = (state.gallery||[]).concat(imgs).slice(0,12);
           saveState(state);
           renderGallery(state.gallery);
           applyStateToDOM(state);
           sectionEditing = null;
           modal.hide();
           alert('Perubahan bidang galeri tersimpan.');
         }).catch(()=>alert('Gagal memproses gambar galeri.'));
         return;
       }
     } else {
       const editableEls = document.querySelectorAll('[data-editable="true"]');
       editableEls.forEach(el=>{
         const key = el.getAttribute('data-key'); if(!key) return; state.editable[key] = el.innerHTML;
       });
     }
     saveState(state);
     applyStateToDOM(state);
     sectionEditing = null;
     modal.hide();
     alert('Perubahan tersimpan di browser (localStorage).');
   });
  if(changePassBtn){
    changePassBtn.addEventListener('click', ()=>{
      const curr = currPass.value || '';
      const np = newPass.value || '';
      const cp = confirmPass.value || '';
      if(!curr || !np || !cp){ alert('Lengkapi semua field password'); return; }
      if(np.length < 6){ alert('Password baru minimal 6 karakter'); return; }
      if(np !== cp){ alert('Konfirmasi password tidak cocok'); return; }
      if(!checkPassword(curr)){ alert('Password saat ini salah'); return; }
      localStorage.setItem('sdnc-pass', np);
      currPass.value=''; newPass.value=''; confirmPass.value='';
      alert('Password admin berhasil diubah');
    });
  }

  // Admin pass controls (view/reset/hide)
  function getStoredPass(){ return localStorage.getItem('sdnc-pass') || DEFAULT_PASS; }
  if(toggleShowPass){
    toggleShowPass.addEventListener('click', ()=>{
      if(currentPassDisplay.classList.contains('d-none')){
        currentPassText.value = getStoredPass(); currentPassDisplay.classList.remove('d-none'); toggleShowPass.innerText='Sembunyikan Password';
      } else { currentPassDisplay.classList.add('d-none'); toggleShowPass.innerText='Lihat Password'; }
    });
  }
  if(resetDefaultPass){
    resetDefaultPass.addEventListener('click', ()=>{
      if(!confirm('Reset password admin ke nilai default (admin123)?')) return; localStorage.setItem('sdnc-pass', DEFAULT_PASS); currentPassText.value = DEFAULT_PASS; alert('Password direset ke default');
    });
  }
  if(clearStoredPass){
    clearStoredPass.addEventListener('click', ()=>{
      if(!confirm('Hapus password tersimpan sehingga password default akan digunakan?')) return; localStorage.removeItem('sdnc-pass'); currentPassText.value = DEFAULT_PASS; alert('Password tersimpan dihapus (kembali ke default)');
    });
  }

  function toggleAdminPassControls(){ if(adminPassControls){ if(isAdmin()) adminPassControls.classList.remove('d-none'); else adminPassControls.classList.add('d-none'); } }
  toggleAdminPassControls();
  // wrap setAdmin to update controls
  const prevSetAdmin = setAdmin;
  setAdmin = function(v){ prevSetAdmin(v); toggleAdminPassControls(); };

  // Export
  exportBtn.addEventListener('click', ()=>{
    const state = loadState() || {};
    const blob = new Blob([JSON.stringify(state, null, 2)], {type:'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href=url; a.download='sdnc-site.json'; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
  });

  // Toggle inline edit mode
  function setInlineEditing(enable){
    document.querySelectorAll('[data-editable="true"]').forEach(el=>{
      el.contentEditable = enable ? 'true' : 'false';
      if(enable) el.classList.add('editable-active'); else el.classList.remove('editable-active');
    });
  }
  if(toggleInlineEdit){
    let inlineOn = false;
    toggleInlineEdit.innerText = 'Edit Semua';
    toggleInlineEdit.addEventListener('click', ()=>{ inlineOn = !inlineOn; setInlineEditing(inlineOn); toggleInlineEdit.innerText = inlineOn ? 'Nonaktifkan Edit Semua' : 'Edit Semua'; });
  }

  // Logo upload handler
  if(logoUpload){ logoUpload.addEventListener('change', async function(){ const f = this.files[0]; if(!f) return; const r=new FileReader(); r.onload=()=>{ const data=r.result; safeSetLogo(data); const state=loadState()||{}; state.logo=data; saveState(state); alert('Logo diperbarui'); }; r.readAsDataURL(f); }); }

  // About image upload
  if(aboutImageUpload){ aboutImageUpload.addEventListener('change', async function(){ const f=this.files[0]; if(!f) return; const r=new FileReader(); r.onload=()=>{ const data=r.result; const ai=document.getElementById('aboutImage'); if(ai) ai.src=data; const state=loadState()||{}; state.aboutImage=data; saveState(state); alert('Gambar About diperbarui'); }; r.readAsDataURL(f); }); }

  // Import
  importBtn.addEventListener('click', ()=>importFile.click());
  importFile.addEventListener('change', function(){
    const f = this.files[0]; if(!f) return; const r=new FileReader(); r.onload=()=>{ try{ const state=JSON.parse(r.result); saveState(state); loadEditor(); alert('Impor berhasil'); }catch(e){alert('File JSON tidak valid')} }; r.readAsText(f);
  });

  // Reset
  resetBtn.addEventListener('click', ()=>{
    if(!confirm('Reset data lokal?')) return; localStorage.removeItem('sdnc-site'); loadEditor(); alert('Data lokal direset');
  });

  // Wire admin-update buttons using event delegation so section editing opens popup reliably
  document.addEventListener('click', function(e){
    const button = e.target.closest('.admin-update');
    if(!button) return;
    e.preventDefault();
    e.stopPropagation();
    const sec = button.getAttribute('data-section');
    if(!sec) return;
    if(!isAdmin()){
      pendingSectionOpen = sec;
      adminModal.show();
      return;
    }
    openSectionEditor(sec);
  });

  // Expose helper for debugging in browser console
  window.openSectionEditor = openSectionEditor;

  function applyStateToDOM(state){
     const brand = document.querySelector('.navbar-brand .fw-bold'); if(brand && state.title) brand.innerText = state.title;
     const lead = document.querySelector('#hero .lead'); if(lead && state.subtitle) lead.innerText = state.subtitle;
     const addr = document.querySelector('#contact p'); if(addr && state.address) addr.innerText = state.address;
     const elNpsn = document.getElementById('idNpsn'); if(elNpsn && state.npsn) elNpsn.innerText = state.npsn;
     const elKec = document.getElementById('idKec'); if(elKec && state.kecamatan) elKec.innerText = state.kecamatan;
     const elKab = document.getElementById('idKab'); if(elKab && state.kabupaten) elKab.innerText = state.kabupaten;
     renderGallery(state.gallery||[]);
     if(state.editable){ Object.keys(state.editable).forEach(key=>{ const el=document.querySelector('[data-key="'+key+'"]'); if(el) el.innerHTML = state.editable[key]; }); }
     if(state.logo) document.querySelectorAll('[data-key="site.logo"]').forEach(i=>i.src = state.logo);
     if(state.aboutImage) { const ai = document.getElementById('aboutImage'); if(ai) ai.src = state.aboutImage; }
     if(window.updateStudentChart) window.updateStudentChart();
   }

   // apply state on page load
   window.addEventListener('load', ()=>{
     const state = loadState(); if(state){ applyStateToDOM(state); }
     if(window.updateStudentChart) window.updateStudentChart();
  });

  if(sectionAnnouncementImageUpload){
    sectionAnnouncementImageUpload.addEventListener('change', function(){
      const file = this.files[0];
      if(!file) return;
      const reader = new FileReader();
      reader.onload = function(){
        if(sectionAnnouncementImagePreview){
          sectionAnnouncementImagePreview.innerHTML = '';
          const img = document.createElement('img');
          img.src = reader.result;
          img.className = 'img-fluid rounded';
          img.alt = 'Preview Foto Pengumuman';
          sectionAnnouncementImagePreview.appendChild(img);
        }
      };
      reader.readAsDataURL(file);
    });
  }

})();
