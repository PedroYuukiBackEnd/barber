(function () {
  const fullscreenButton = document.getElementById('fullscreen-toggle');
  if (!fullscreenButton) return;

  const STORAGE_KEY = 'sistema_barber_app_fullscreen';
  const canUseFullscreen = Boolean(document.documentElement.requestFullscreen && document.exitFullscreen);

  function isAppFullscreen() {
    return document.body.classList.contains('app-fullscreen');
  }

  function syncFullscreenButton() {
    const isFullscreen = isAppFullscreen();
    fullscreenButton.title = isFullscreen ? 'Sair da tela cheia' : 'Tela cheia';
    fullscreenButton.setAttribute(
      'aria-label',
      isFullscreen ? 'Sair da tela cheia' : 'Entrar em tela cheia'
    );
    fullscreenButton.innerHTML = isFullscreen
      ? '<i class="ph ph-corners-in"></i>'
      : '<i class="ph ph-corners-out"></i>';
  }

  function setAppFullscreen(enabled) {
    document.body.classList.toggle('app-fullscreen', enabled);
    localStorage.setItem(STORAGE_KEY, enabled ? 'true' : 'false');
    syncFullscreenButton();
  }

  fullscreenButton.addEventListener('click', async () => {
    const shouldEnable = !isAppFullscreen();
    setAppFullscreen(shouldEnable);

    try {
      if (!shouldEnable && document.fullscreenElement) {
        await document.exitFullscreen();
      } else if (shouldEnable && canUseFullscreen) {
        await document.documentElement.requestFullscreen();
      }
    } catch (error) {
      console.warn('Nao foi possivel alternar a tela cheia nativa:', error);
    }
  });

  document.addEventListener('fullscreenchange', syncFullscreenButton);
  setAppFullscreen(localStorage.getItem(STORAGE_KEY) === 'true');
})();
