  // ---------- início do painel ----------
  // Link de briefing (?briefing=...): o cliente vê só o formulário, nada do painel.
  if(briefingPublicoNaUrl())return;
  buildNav();renderPipe();renderKpis();renderOverviewContent();renderClients();renderContentList();renderApprovals();renderCal();renderPerf();renderKB();renderAgents();
  buildClientSelect();initTheme();
  I("#clientview").addEventListener('click',function(){toggleClientView(!state.clientView)});
  I("#newClientBtn").addEventListener('click',openNewClientModal);
  I("#ncHeroBtn").addEventListener('click',openNewClientModal);
  go("overview");
  initCapabilities();
})();
