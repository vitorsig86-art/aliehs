import type { ProjectConfig } from "./types";
import { microbasinColors, templateProject } from "./template";

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
// Declividade: legenda em imagem (public/legends), não desenhada no raster.
const declividade: Layer = {
  ...derivado("declividade", "Declividade (IBGE)", "slope", "decli", boundsNivel9, 9, 18),
  legendMode: "external",
  legend: {
    type: "image", title: "Declividade (IBGE)", imageUrl: "/legends/declividade-ibge.png",
    imageAlt: "Classes de declividade do IBGE: plano, suave ondulado, ondulado, forte ondulado, montanhoso e escarpado",
  },
};
const aspecto = derivado("aspecto", "Orientação de Vertentes", "aspect", "aspect", boundsNivel8, 8, 17);

// Vetores (CRS84, sem Z, id único). No array, ficam na ordem do zIndex (o Cesium
// desenha GeoJSON na ordem de entrada); a ordem do painel vem do panelOrder.
const GEOJSON = `${R2}/geojson`;
const areaPerimetroPopup = (titleProperty: string) => ({ titleProperty, fields: [
  { property: "area_ha", label: "Área", decimals: 2, suffix: " ha" },
  { property: "perimetro_km", label: "Perímetro", decimals: 2, suffix: " km" },
] });

const imoveis: Layer = {
  id: "imoveis", name: "Imóveis", description: "", kind: "property-boundary", defaultVisible: true, panelOrder: 1,
  source: { format: "geojson", url: `${GEOJSON}/peri_imoveis_1.geojson`, autoZoom: false,
    style: { stroke: "#FFD400", strokeWidth: 2.5, fillOpacity: 0, clampToGround: true, zIndex: 20 },
    popup: areaPerimetroPopup("nome") },
};

// Microbacias: preenchimento e contorno na cor do atributo "cor" (0 a 9).
const microbacias: Layer = {
  id: "microbacias", name: "Microbacias", description: "", kind: "vector", defaultVisible: false, panelOrder: 2, opacityControl: true,
  source: { format: "geojson", url: `${GEOJSON}/microbacias_1.geojson`, autoZoom: false,
    style: { stroke: "#FFFFFF", strokeWidth: 1.5, fillOpacity: 0.35, clampToGround: true, zIndex: 3,
      classification: { property: "cor", classes: Object.fromEntries(microbasinColors.map((color, index) => [String(index), { fill: color, stroke: color }])) },
      outline: { property: "cor", colors: microbasinColors, width: 1.5 } },
    popup: areaPerimetroPopup("nome") },
};

// Curvas: pretas, 1 px, uma por vez (mesmo exclusiveGroup).
const curvas = (id: string, name: string, file: string, panelOrder: number): Layer => ({
  id, name, description: "", kind: "contours", defaultVisible: false, exclusiveGroup: "curvas", panelOrder,
  source: { format: "geojson", url: `${GEOJSON}/${file}`, autoZoom: false,
    style: { stroke: "#000000", strokeWidth: 1, clampToGround: true, zIndex: 5 },
    popup: { title: "Curva de nível", fields: [{ property: "cota_m", label: "Cota", suffix: " m", format: "integer" }] } },
});
const curvas3 = curvas("curvas3", "Curvas de Nível (3 m)", "curvas_3m_1.geojson", 3);
const curvas5 = curvas("curvas5", "Curvas de Nível (5 m)", "curvas_5m.geojson", 4);

// Drenagem: classes por STRAHLER (1 a 3).
const drenagem: Layer = {
  id: "drenagem", name: "Drenagem", description: "", kind: "drainage", defaultVisible: false, panelOrder: 5,
  source: { format: "geojson", url: `${GEOJSON}/drenagem_1.geojson`, autoZoom: false,
    style: { stroke: "#00E5FF", strokeWidth: 1, clampToGround: true, zIndex: 10,
      classification: { property: "STRAHLER", classes: {
        1: { stroke: "#00E5FF", strokeWidth: 1, zIndex: 10 },
        2: { stroke: "#14B8F0", strokeWidth: 1.6, zIndex: 11 },
        3: { stroke: "#1E88E5", strokeWidth: 2.4, zIndex: 12 },
      } } },
    popup: { title: "Drenagem", fields: [
      { property: "STRAHLER", label: "Ordem de Strahler", format: "integer" },
      { property: "area_contribuicao_ha", label: "Área de contribuição", decimals: 2, suffix: " ha" },
    ] } },
};

// Modelo 3D do ion (Agisoft Metashape). VITE_CESIUM_3D_TOKEN é igual ao token
// do ion neste projeto, então reaproveita VITE_CESIUM_ION_TOKEN.
const modelo: Layer = {
  id: "modelo", name: "Modelo 3D", description: "", kind: "3d-tiles", defaultVisible: false,
  source: { format: "3d-tiles", source: "ion", assetId: 6134002, tokenEnv: "VITE_CESIUM_ION_TOKEN",
    // Recorte desenhado com cropAuthoring: mostra só o modelo dentro do polígono.
    clipping: {
      enabled: true,
      inverse: true,
      positions: [
        [-45.3469941, -22.4967522],
        [-45.3457648, -22.4954001],
        [-45.3460620, -22.4883465],
        [-45.3468323, -22.4872244],
        [-45.3536702, -22.4876350],
        [-45.3543018, -22.4893082],
        [-45.3542410, -22.4917976],
        [-45.3542787, -22.4938942],
        [-45.3528764, -22.4964583],
      ],
    },
    // 0: modelo assenta no World Terrain sem offset; referencial vertical do asset a confirmar no ion.
    heightOffsetMeters: 0,
    terrainCutout: false },
};

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
  layers: [basemap, orto, mds, mdt, declividade, aspecto, microbacias, curvas3, curvas5, drenagem, imoveis, modelo],
  scenes: [],
  diagnostic: { steps: [] },
  // Ferramentas só aparecem em npm run dev; desligadas, o dev fica igual ao site publicado.
  developmentTools: { modelAlignment: false, cropAuthoring: false, cameraCapture: false },
};
