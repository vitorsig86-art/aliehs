import type { ProjectConfig } from "./types";
import { templateProject } from "./template";

// Valores reais do projeto Aliehs (Delfim Moreira-MG). template.ts guarda só
// exemplos genéricos usados por npm run check: não coloque dados da propriedade nele.
// Passo a passo: docs/NOVO-PROJETO.md (exemplo real comentado: projeto Cyro).
const basemap = templateProject.layers[0];
const R2 = "https://pub-442cdd7cae2e48e8bfef67a1118f3ba9.r2.dev"; // r2.dev: sem o nome do bucket
type Layer = ProjectConfig["layers"][number];
type Bounds = [number, number, number, number];

// Ortomosaico único (sem série temporal). bounds = tiles inteiros do nível
// mínimo do XML: limitam as requisições, não são o contorno dos dados.
const orto: Layer = {
  id: "orto", name: "Ortomosaico", description: "", kind: "orthomosaic", defaultVisible: true,
  source: { format: "tms", url: `${R2}/orto/{z}/{x}/{reverseY}.png`, credit: "Cardeal Map",
    bounds: [-45.5273, -22.5937, -45.1758, -22.4313], minimumLevel: 11, maximumLevel: 20, tileWidth: 256, tileHeight: 256 },
};

// Derivados do relevo: legenda no próprio raster, um por vez (mesmo exclusiveGroup).
const derivado = (id: string, name: string, kind: Layer["kind"], folder: string, bounds: Bounds, minimumLevel: number, maximumLevel: number): Layer => ({
  id, name, description: "", kind, defaultVisible: false,
  legendMode: "embedded", exclusiveGroup: "derivados",
  source: { format: "tms", url: `${R2}/${folder}/{z}/{x}/{reverseY}.png`, credit: "Cardeal Map",
    bounds, minimumLevel, maximumLevel, tileWidth: 256, tileHeight: 256 },
});
const boundsNivel9: Bounds = [-45.7031, -22.5937, -45.0000, -21.9430];
const boundsNivel8: Bounds = [-46.4062, -23.2413, -45.0000, -21.9430];
const mds = derivado("mds", "Modelo Digital de Superfície", "dsm", "mds", boundsNivel9, 9, 18);
const mdt = derivado("mdt", "Modelo Digital de Terreno", "dtm", "mdt", boundsNivel8, 8, 17);
const declividade = derivado("declividade", "Declividade (IBGE)", "slope", "decli", boundsNivel9, 9, 18);
const aspecto = derivado("aspecto", "Orientação de Vertentes", "aspect", "aspect", boundsNivel8, 8, 17);

export const project: ProjectConfig = {
  ...templateProject,
  id: "aliehs",
  name: "Aliehs",
  location: "Delfim Moreira-MG",
  // Área do projeto [W, S, E, N] em graus; define o limite de navegação.
  // Ausente = sem limite. Capture com "Capturar bounds da vista" (npm run dev).
  // Desligado por enquanto: os bounds dos rasters são tiles inteiros, não a área.
  // bounds: [W, S, E, N],
  // Opcional: navigation: { marginRatio: 0.25, maximumZoomDistance: 5000 },
  // Capture a vista final (cameraCapture). Ângulos em graus; altura em metros sobre o elipsoide.
  initialCamera: { longitude: -45.3492082, latitude: -22.4824364, height: 1600.2, heading: 181.35, pitch: -27.48, roll: 0 },
  // Ordem = empilhamento: o último item fica por cima.
  // Sem análise temporal: um único ortomosaico, sem temporalCampaign nas camadas
  // e sem temporalComparison (régua, selo de período e "Comparar" ficam ocultos).
  layers: [basemap, orto, mds, mdt, declividade, aspecto],
  scenes: [],
  diagnostic: { steps: [] },
  // Ferramentas só aparecem em npm run dev. modelAlignment e cropAuthoring ligados
  // para o recorte do modelo 3D; desligue os dois ao finalizar (etapa 9).
  developmentTools: { modelAlignment: true, cropAuthoring: true, cameraCapture: false },
};
