  // ---------- início do painel ----------
  buildNav();renderPipe();renderKpis();renderOverviewContent();renderClients();renderContentList();renderApprovals();renderCal();renderPerf();renderKB();renderAgents();
  buildClientSelect();initTheme();
  I("#clientview").addEventListener('click',function(){toggleClientView(!state.clientView)});
  I("#newClientBtn").addEventListener('click',openNewClientModal);
  I("#ncHeroBtn").addEventListener('click',openNewClientModal);
  go("overview");
  initCapabilities();
})();
