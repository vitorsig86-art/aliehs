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

// Relevo regional: seção Análise Macro (primeiro item), fora dos grupos exclusivos.
// No mapa fica acima do ortomosaico e abaixo dos rasters do drone.
const demMacro: Layer = {
  id: "dem-macro", name: "Relevo Regional (DEM)", description: "", kind: "dtm", defaultVisible: false,
  group: "macro", panelOrder: 0, legendMode: "embedded", opacityControl: true,
  source: { format: "tms", url: `${R2}/dem_macro/{z}/{x}/{reverseY}.png`, credit: "Cardeal Map",
    bounds: [-67.5000, -40.9799, -45.0000, -21.9430], minimumLevel: 4, maximumLevel: 13, tileWidth: 256, tileHeight: 256 },
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
const microbaciasStyle = {
  stroke: "#FFFFFF", strokeWidth: 1.5, fillOpacity: 0.35, clampToGround: true, zIndex: 3,
  classification: { property: "cor", classes: Object.fromEntries(microbasinColors.map((color, index) => [String(index), { fill: color, stroke: color }])) },
  outline: { property: "cor", colors: microbasinColors, width: 1.5 },
};
const microbacias: Layer = {
  id: "microbacias", name: "Microbacias", description: "", kind: "vector", defaultVisible: false, panelOrder: 2, opacityControl: true,
  source: { format: "geojson", url: `${GEOJSON}/microbacias_1.geojson`, autoZoom: false,
    style: microbaciasStyle,
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

// Análise Macro: contexto regional (IBGE, ICMBio, ANA) e derivados da bacia.
// panelOrder ordena a seção; no array, a ordem segue o zIndex.
type GeoJsonSource = Extract<Layer["source"], { format: "geojson" }>;
type PopupField = NonNullable<GeoJsonSource["popup"]>["fields"][number];
const macro = (id: string, name: string, kind: Layer["kind"], file: string, panelOrder: number,
  style: NonNullable<GeoJsonSource["style"]>, popup: GeoJsonSource["popup"], extra: Partial<Layer> = {}): Layer => ({
  id, name, description: "", kind, defaultVisible: false, group: "macro", panelOrder, ...extra,
  source: { format: "geojson", url: `${GEOJSON}/${file}`, autoZoom: false, style: { ...style, clampToGround: true }, popup },
});
// Temas regionais: um por vez, contorno na cor do preenchimento.
const tema = (id: string, name: string, file: string, panelOrder: number, color: string, fillOpacity: number,
  fields: PopupField[], options: { strokeWidth?: number; classification?: NonNullable<GeoJsonSource["style"]>["classification"] } = {}): Layer =>
  macro(id, name, "vector", file, panelOrder,
    { stroke: color, strokeWidth: options.strokeWidth ?? 2, fill: color, fillOpacity, zIndex: 2, classification: options.classification },
    { titleProperty: "nome", fields }, { exclusiveGroup: "macro-tema", opacityControl: true });

const municipios = macro("municipios", "Limites Municipais", "vector", "municipios.geojson", 1,
  { stroke: "#FFFFFF", strokeWidth: 2, fillOpacity: 0, zIndex: 18 },
  { titleProperty: "nome", fields: [
    { property: "area_ha", label: "Área", format: "integer", suffix: " ha" },
    { property: "pop_total", label: "População", format: "integer" },
    { property: "pop_rural", label: "População rural", format: "integer" },
    { property: "tipologia", label: "Tipologia IBGE" },
  ] });
const ottobacia = macro("ottobacia", "Ottobacia (ANA)", "vector", "limite_microbacia_ana.geojson", 2,
  { stroke: "#00BCD4", strokeWidth: 2.5, fillOpacity: 0, zIndex: 17 },
  { titleProperty: "nome", fields: [{ property: "area_km2", label: "Área", decimals: 2, suffix: " km²" }] });
const ucfed = tema("ucfed", "Unidade de Conservação Federal", "ucfed.geojson", 3, "#2E7D32", 0.12, [
  { property: "categoria", label: "Categoria" },
  { property: "esfera", label: "Esfera" },
  { property: "criacao", label: "Ato de criação" },
  { property: "area_ha", label: "Área total", format: "integer", suffix: " ha" },
  { property: "gestao", label: "Gestão" },
], { strokeWidth: 3 });
const clima = tema("clima", "Clima (IBGE)", "clima_ibge.geojson", 4, "#7FB3D5", 0.3, [
  { property: "umidade", label: "Umidade" },
  { property: "meses_secos", label: "Período seco" },
  { property: "temperatura", label: "Temperatura" },
]);
const geologia = tema("geologia", "Geologia (IBGE)", "geologia_ibge.geojson", 5, "#C49A6C", 0.35, [
  { property: "simbolo", label: "Símbolo" },
  { property: "litologia", label: "Litologia" },
  { property: "idade", label: "Idade" },
  { property: "provincia", label: "Província" },
], { classification: { property: "cor", classes: {
  0: { fill: "#C49A6C", stroke: "#C49A6C" },
  1: { fill: "#D35400", stroke: "#D35400" },
} } });
const geomorfologia = tema("geomorfologia", "Geomorfologia (IBGE)", "geomorfologia_ibge.geojson", 6, "#A9746E", 0.3, [
  { property: "dominio", label: "Domínio" },
  { property: "regiao", label: "Região" },
  { property: "compartimento", label: "Compartimento" },
  { property: "modelado", label: "Modelado" },
]);
const pedologia = tema("pedologia", "Solos (IBGE)", "pedologia_ibge.geojson", 7, "#C8743A", 0.3, [
  { property: "textura", label: "Textura" },
  { property: "horizonte", label: "Horizonte A" },
  { property: "relevo", label: "Relevo" },
]);
const vegetacao = tema("vegetacao", "Vegetação (IBGE)", "vegetacao_ibge.geojson", 8, "#6AA84F", 0.3, [
  { property: "uso_dominante", label: "Uso dominante" },
  { property: "contato", label: "Vegetação original" },
  { property: "secundaria", label: "Formações secundárias" },
]);
const drenagemAna = macro("drenagem-ana", "Rios (ANA)", "drainage", "drenagem_ana.geojson", 9,
  { stroke: "#0B2A9E", strokeWidth: 3, zIndex: 14 },
  { title: "Curso d'água (ANA)", fields: [
    { property: "comprimento_km", label: "Comprimento do trecho", decimals: 2, suffix: " km" },
    { property: "area_bacia_km2", label: "Área da bacia", decimals: 2, suffix: " km²" },
  ] });
const reservatorio = macro("reservatorio", "Reservatório (ANA)", "vector", "reservatorio_ana.geojson", 10,
  { stroke: "#0B2A9E", strokeWidth: 1.5, fill: "#1E88E5", fillOpacity: 0.6, zIndex: 15 },
  { titleProperty: "nome", fields: [
    { property: "uso", label: "Uso" },
    { property: "empreendedor", label: "Empreendedor" },
    { property: "area_ha", label: "Área", decimals: 2, suffix: " ha" },
  ] });
const drenagemMacro = macro("drenagem-macro", "Drenagem Simulada (bacia)", "drainage", "simu_drenagem.geojson", 11,
  { stroke: "#00E5FF", strokeWidth: 1, zIndex: 10,
    classification: { property: "STRAHLER", classes: {
      1: { stroke: "#00E5FF", strokeWidth: 1, zIndex: 10 },
      2: { stroke: "#14B8F0", strokeWidth: 1.6, zIndex: 11 },
      3: { stroke: "#1E88E5", strokeWidth: 2.4, zIndex: 12 },
      4: { stroke: "#1546D8", strokeWidth: 3.4, zIndex: 13 },
      5: { stroke: "#0B2A9E", strokeWidth: 4.4, zIndex: 13 },
      6: { stroke: "#061A6B", strokeWidth: 5.4, zIndex: 13 },
    } } },
  { title: "Drenagem", fields: [
    { property: "STRAHLER", label: "Ordem de Strahler", format: "integer" },
    { property: "area_contribuicao_ha", label: "Área de contribuição", decimals: 2, suffix: " ha" },
  ] });
const microbaciasMacro = macro("microbacias-macro", "Microbacias Simuladas (bacia)", "vector", "simu_microbacias.geojson", 12,
  microbaciasStyle,
  areaPerimetroPopup("nome"), { opacityControl: true });
const curvas10 = macro("curvas10", "Curvas de Nível (10 m, bacia)", "contours", "curvas_10m.geojson", 13,
  { stroke: "#000000", strokeWidth: 1, zIndex: 5 },
  { title: "Curva de nível", fields: [{ property: "cota_m", label: "Cota", suffix: " m", format: "integer" }] });

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
  layers: [basemap, orto, demMacro, mds, mdt, declividade, aspecto,
    clima, geologia, geomorfologia, pedologia, vegetacao, ucfed, microbacias, microbaciasMacro, curvas3, curvas5, curvas10,
    drenagem, drenagemMacro, drenagemAna, reservatorio, ottobacia, municipios, imoveis, modelo],
  scenes: [],
  diagnostic: { steps: [] },
  // Ferramentas só aparecem em npm run dev; desligadas, o dev fica igual ao site publicado.
  developmentTools: { modelAlignment: false, cropAuthoring: false, cameraCapture: false },
};
