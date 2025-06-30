export default defineBackground(() => {
  console.info('[Hush] Background initialized', { id: browser.runtime.id });
});
