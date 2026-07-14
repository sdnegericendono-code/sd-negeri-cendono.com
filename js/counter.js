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
  if(ctx){
    new Chart(ctx, {
      type: 'pie',
      data: {
        labels: ['Laki-laki','Perempuan'],
        datasets:[{data:[34,34],backgroundColor:[getComputedStyle(document.documentElement).getPropertyValue('--primary')||'#0D6EFD', getComputedStyle(document.documentElement).getPropertyValue('--secondary')||'#198754']}]
      },
      options:{responsive:true,plugins:{legend:{position:'bottom'}}}
    });
  }
});
