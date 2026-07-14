// Dark mode toggle persisted to localStorage
(function(){
  const toggle = document.getElementById('darkToggle');
  const body = document.body;
  function apply(mode){
    if(mode==='dark') body.classList.add('dark'); else body.classList.remove('dark');
  }
  const saved = localStorage.getItem('sdnc-theme') || (window.matchMedia && window.matchMedia('(prefers-color-scheme:dark)').matches ? 'dark' : 'light');
  apply(saved);
  if(toggle){
    toggle.addEventListener('click', ()=>{
      const mode = body.classList.contains('dark') ? 'light' : 'dark';
      apply(mode);
      localStorage.setItem('sdnc-theme', mode);
    });
  }
})();
