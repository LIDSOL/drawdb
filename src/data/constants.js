export const tableThemes = [
  "#f03c3c",
  "#ff4f81",
  "#bc49c4",
  "#a751e8",
  "#7c4af0",
  "#6360f7",
  "#7d9dff",
  "#32c9b0",
  "#3cde7d",
  "#89e667",
  "#ffe159",
  "#ff9159",
];

export const noteThemes = [
  "#ffdfd9",
  "#fcf7ac",
  "#cffcb1",
  "#c7d2ff",
  "#e7c7ff",
];

export const defaultBlue = "#175e7a";
export const defaultNoteTheme = "#fcf7ac";
export const darkBgTheme = "#16161A";
export const tableHeaderHeight = 50;
export const tableWidth = 220;
export const tableFieldHeight = 36;
export const tableColorStripHeight = 7;

export const RelationshipType = {
  ONE_TO_ONE: "one_to_one",
  ONE_TO_MANY: "one_to_many",
  SUBTYPE: "subtype",
};

export const RelationshipCardinalities = {
  [RelationshipType.ONE_TO_ONE]: [
    {value: "0,1", label: "(0,1)"},
    {value: "1,1", label: "(1,1)"},
  ],
  [RelationshipType.ONE_TO_MANY]: [
    {value: "0,*", label: "(0,*)"},
    {value: "1,*", label: "(1,*)"},
    {value: "custom", label: "Custom..."},
  ],
};

export const ParentCardinality = {
  DEFAULT: {value: "1,1", label: "(1,1)"},
  NULLEABLE: {value: "0,1", label: "(0,1)"},
};

export const Notation = {
  DEFAULT: "default",
  CROWS_FOOT: "crows_foot",
  IDEF1X: "idef1x",
};
export const Constraint = {
  NONE: "No action",
  RESTRICT: "Restrict",
  CASCADE: "Cascade",
  SET_NULL: "Set null",
  SET_DEFAULT: "Set default",
};

export const SubtypeRestriction = {
  DISJOINT_TOTAL: "disjoint_total",
  DISJOINT_PARTIAL: "disjoint_partial",
  OVERLAPPING_TOTAL: "overlapping_total",
  OVERLAPPING_PARTIAL: "overlapping_partial",
};

export const Tab = {
  TABLES: "1",
  RELATIONSHIPS: "2",
  AREAS: "3",
  NOTES: "4",
  TYPES: "5",
  ENUMS: "6",
};

export const ObjectType = {
  NONE: 0,
  TABLE: 1,
  AREA: 2,
  NOTE: 3,
  RELATIONSHIP: 4,
  TYPE: 5,
  ENUM: 6,
};

export const Action = {
  ADD: 0,
  MOVE: 1,
  DELETE: 2,
  EDIT: 3,
  PAN: 4,
};

export const State = {
  NONE: 0,
  SAVING: 1,
  SAVED: 2,
  LOADING: 3,
  ERROR: 4,
  FAILED_TO_LOAD: 5,
};

export const MODAL = {
  NONE: 0,
  IMG: 1,
  CODE: 2,
  IMPORT: 3,
  RENAME: 4,
  OPEN: 5,
  SAVEAS: 6,
  NEW: 7,
  IMPORT_SRC: 8,
  TABLE_WIDTH: 9,
  LANGUAGE: 10,
  SHARE: 11,
  DEFAULTS: 12,
};

export const STATUS = {
  NONE: 0,
  WARNING: 1,
  ERROR: 2,
  OK: 3,
};

export const SIDESHEET = {
  NONE: 0,
  TODO: 1,
  TIMELINE: 2,
};

export const DB = {
  MYSQL: "mysql",
  POSTGRES: "postgresql",
  MSSQL: "transactsql",
  SQLITE: "sqlite",
  MARIADB: "mariadb",
  ORACLE: "oracledb",
  GENERIC: "generic",
};

export const IMPORT_FROM = {
  JSON: 0,
  DBML: 1,
};
