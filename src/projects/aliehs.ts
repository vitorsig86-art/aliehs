import type { ProjectConfig } from "./types";
import { templateProject } from "./template";

// Valores reais do projeto Aliehs (Delfim Moreira-MG). template.ts guarda só
// exemplos genéricos usados por npm run check: não coloque dados da propriedade nele.
// Passo a passo: docs/NOVO-PROJETO.md (exemplo real comentado: projeto Cyro).
const basemap = templateProject.layers[0];

export const project: ProjectConfig = {
  ...templateProject,
  id: "aliehs",
  name: "Aliehs",
  location: "Delfim Moreira-MG",
  // Área do projeto [W, S, E, N] em graus; define o limite de navegação.
  // Ausente = sem limite. Capture com "Capturar bounds da vista" (npm run dev).
  // bounds: [W, S, E, N],
  // Opcional: navigation: { marginRatio: 0.25, maximumZoomDistance: 5000 },
  // Capture a vista final (cameraCapture). Ângulos em graus; altura em metros sobre o elipsoide.
  initialCamera: { longitude: 0, latitude: 0, height: 20000000, heading: 0, pitch: -90, roll: 0 },
  // Ordem = empilhamento: o último item fica por cima.
  // Sem análise temporal: um único ortomosaico, sem temporalCampaign nas camadas
  // e sem temporalComparison (régua, selo de período e "Comparar" ficam ocultos).
  layers: [basemap],
  scenes: [],
  diagnostic: { steps: [] },
  // Ferramentas só aparecem em npm run dev; desligue cameraCapture ao finalizar.
  developmentTools: { modelAlignment: false, cropAuthoring: false, cameraCapture: true },
};
