  // ---------- início do painel ----------
  // Link de briefing (?briefing=...) ou de aprovação (?vitrine=...): o cliente vê só a página dele, nada do painel.
  if(briefingPublicoNaUrl()||vitrinePublicaNaUrl())return;
  buildNav();renderPipe();renderKpis();renderOverviewContent();renderClients();renderContentList();renderApprovals();renderCal();renderPerf();renderKB();renderAgents();
  buildClientSelect();initTheme();
  I("#clientview").addEventListener('click',function(){toggleClientView(!state.clientView)});
  I("#newClientBtn").addEventListener('click',openNewClientModal);
  I("#ncHeroBtn").addEventListener('click',openNewClientModal);
  go("overview");
  initCapabilities();
})();
