// Counter animation using counterup2
document.addEventListener('DOMContentLoaded', function(){
  const counters = document.querySelectorAll('.counter');
  counters.forEach(counter => {
    const target = +counter.getAttribute('data-target');
    counter.innerText = '0';
    const waypoint = new Waypoint({
      element: counter,
      handler: function() {
        counterUp(counter, {duration: 1500, delay: 16});
        this.destroy();
      },
      offset: '90%'
    });
  });

  // Chart.js Pie for students gender
  const ctx = document.getElementById('studentsChart');
  let studentsChartInstance = null;

  function getStudentCounts(){
    const sumByKey = selector => Array.from(document.querySelectorAll(selector)).reduce((sum, el) => sum + (parseInt(el.textContent.trim(), 10) || 0), 0);
    const maleRowCount = sumByKey('[data-key^="data.peserta."][data-key$=".l"]:not([data-key*=".total."])');
    const femaleRowCount = sumByKey('[data-key^="data.peserta."][data-key$=".p"]:not([data-key*=".total."])');
    const fallbackMale = document.querySelector('[data-key="data.peserta.total.l"]');
    const fallbackFemale = document.querySelector('[data-key="data.peserta.total.p"]');
    const maleCount = maleRowCount || (fallbackMale ? parseInt(fallbackMale.textContent.trim(), 10) || 0 : 0);
    const femaleCount = femaleRowCount || (fallbackFemale ? parseInt(fallbackFemale.textContent.trim(), 10) || 0 : 0);
    return { maleCount, femaleCount };
  }

  function renderStudentChart(){
    if(!ctx) return;
    const counts = getStudentCounts();
    if(studentsChartInstance){ studentsChartInstance.destroy(); }
    studentsChartInstance = new Chart(ctx, {
      type: 'pie',
      data: {
        labels: ['Laki-laki','Perempuan'],
        datasets:[{
          data:[counts.maleCount, counts.femaleCount],
          backgroundColor:[
            getComputedStyle(document.documentElement).getPropertyValue('--primary') || '#0D6EFD',
            getComputedStyle(document.documentElement).getPropertyValue('--secondary') || '#198754'
          ]
        }]
      },
      options:{responsive:true,plugins:{legend:{position:'bottom'}}}
    });
  }

  window.updateStudentChart = renderStudentChart;
  renderStudentChart();
});
