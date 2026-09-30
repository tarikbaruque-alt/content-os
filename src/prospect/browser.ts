import * as Engine from "./index.js";
// Exposto no navegador como window.MesaEngine (o app é um único HTML).
(globalThis as unknown as { MesaEngine: typeof Engine }).MesaEngine = Engine;
