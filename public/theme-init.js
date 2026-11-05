// Set the theme before first paint, so there is no flash. The synced setting wins afterwards.
(function () {
  try {
    var p = localStorage.getItem('ev:theme') || 'paper'
    var t = p === 'system' ? (matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark') : p === 'paper-night' ? 'paper' : p
    var r = document.documentElement
    if (localStorage.getItem('ev:still') === '1') r.setAttribute('data-still', '')
    if (localStorage.getItem('ev:readfocus') === '0') r.setAttribute('data-readfocus', 'off')
    r.setAttribute('data-theme', t)
    r.setAttribute('data-theme-pref', p)
    if (p === 'paper-night') {
      r.setAttribute('data-tone', 'night')
      document.querySelector('meta[name="theme-color"]').setAttribute('content', '#14120E')
    }
  } catch (e) {}
})()
