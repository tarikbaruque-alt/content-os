/**
 * Marcadores do bloco de entradas legível por máquina no prompt.
 * Um LLM real lê o texto natural do prompt; o provider mock lê este bloco
 * para simular a extração de forma determinística. Ambos recebem a mesma info.
 */
export const RAW_INPUTS_BEGIN = "<<CONTENT_OS_RAW_INPUTS>>";
export const RAW_INPUTS_END = "<<END_RAW_INPUTS>>";
