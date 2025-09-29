import { Constraint, DB } from "../../data/constants";
import { dbToTypes } from "../../data/datatypes";

const affinity = {
  [DB.ORACLESQL]: new Proxy(
    { INT: "INTEGER" },
    { NUMERIC: "NUMBER" },
    { DECIMAL: "NUMBER" },
    { CHARACTER: "CHAR" },
    { get: (target, prop) => (prop in target ? target[prop] : "BLOB") },
  ),
  [DB.GENERIC]: new Proxy(
    {
      INTEGER: "INT",
      MEDIUMINT: "INTEGER",
    },
    { get: (target, prop) => (prop in target ? target[prop] : "BLOB") },
  ),
};

export function fromOracleSQL(ast, diagramDb = DB.GENERIC) {
  const tables = [];
  const relationships = [];
  const enums = [];

  const parseSingleStatement = (e) => {
    // Handle Oracle parser format
    if (e.operation === "create" && e.object === "table") {
      const table = {};
      table.name = e.name?.name || e.name;
      table.comment = "";
      table.color = "#175e7a";
      table.fields = [];
      table.indices = [];
      table.id = tables.length;
      // Check if table structure exists
      if (!e.table) {
        console.error("Table structure missing in AST:", e);
        return;
      }
      // Check for different possible structures
      const columns = e.table.relational_properties || e.table.columns || e.columns;
      if (!columns) {
        console.error("No columns found in table structure:", e.table);
        return;
      }
      parseTableColumns(table, columns);
      tables.push(table);
    }
    // Handle standard parser format (fallback)
    else if (e.type === "create" && e.keyword === "table") {
      const table = {};
      table.name = e.table[0].table;
      table.comment = "";
      table.color = "#175e7a";
      table.fields = [];
      table.indices = [];
      table.id = tables.length;
      if (e.create_definitions) {
        parseStandardTableDefinitions(table, e.create_definitions);
      }
      tables.push(table);
    }
  };

  const parseTableColumns = (table, columns) => {
    columns.forEach((d) => {
      if (d.resource === "column" || d.type) {
        const field = {};
        field.name = d.name;

        // Handle different type structures
        let typeInfo = d.type || d;
        let type = typeInfo.type?.toUpperCase() || typeInfo.dataType?.toUpperCase() || "VARCHAR2";
        if (!dbToTypes[diagramDb][type]) {
          type = affinity[diagramDb][type] || type;
        }
        field.type = type;

        // Handle precision and scale
        if (typeInfo.scale && typeInfo.precision) {
          field.size = typeInfo.precision + "," + typeInfo.scale;
        } else if (typeInfo.size || typeInfo.precision) {
          field.size = typeInfo.size || typeInfo.precision;
        }

        field.comment = "";
        field.check = "";
        field.default = "";
        field.unique = false;
        field.increment = false;
        field.notNull = false;
        field.primary = false;

        // Handle constraints - check if they exist
        const constraints = d.constraints || [];
        for (const c of constraints) {
          if (c.constraint.primary_key === "primary key")
            field.primary = true;
          if (c.constraint.not_null === "not null") field.notNull = true;
          if (c.constraint.unique === "unique") field.unique = true;
        }

        if (d.identity) {
          field.increment = true;
        }

        // TODO: reconstruct default when implemented in parser
        if (d.default) {
          field.default = JSON.stringify(d.default.expr);
        }

        table.fields.push(field);
      } else if (d.resource === "constraint") {
        parseConstraint(table, d);
      }
    });
  };

  const parseStandardTableDefinitions = (table, definitions) => {
    definitions.forEach((d) => {
      if (d.resource === "column") {
        const field = {};
        field.name = d.column.column;

        let type = d.definition.dataType;
        if (!dbToTypes[diagramDb][type]) {
          type = affinity[diagramDb][type] || type;
        }
        field.type = type;

        field.comment = d.comment ? d.comment.value.value : "";
        field.check = "";
        field.default = d.default_val ? d.default_val.value.value : "";
        field.unique = false;
        field.increment = false;
        field.notNull = false;
        field.primary = false;

        // Handle size/precision
        if (d.definition.length) {
          if (Array.isArray(d.definition.length)) {
            // Handle precision and scale: [precision, scale]
            field.size = d.definition.length.join(",");
          } else {
            field.size = d.definition.length;
          }
        }

        // Handle NOT NULL constraint
        if (d.nullable && d.nullable.value === "not null") {
          field.notNull = true;
        }

        table.fields.push(field);
      } else if (d.resource === "constraint") {
        // Handle table-level constraints
        if (d.constraint_type === "primary key") {
          if (d.definition && Array.isArray(d.definition)) {
            d.definition.forEach(colRef => {
              const columnName = colRef.column;
              const field = table.fields.find(f => f.name === columnName);
              if (field) {
                field.primary = true;
              } else {
                console.warn("Could not find field for primary key:", columnName);
              }
            });
          }
        }
        if (d.constraint_type === "FOREIGN KEY" || d.constraint_type === "foreign key") {
          // Handle foreign key constraints
          // Extract foreign key information
          const sourceColumn = d.definition[0]?.column;
          const targetTable = d.reference_definition?.table[0]?.table;
          const targetColumn = d.reference_definition?.definition[0]?.column;
          // Store foreign key for later processing
          if (!table.foreignKeys) table.foreignKeys = [];
          table.foreignKeys.push({
            sourceColumn,
            targetTable,
            targetColumn,
            constraintName: d.constraint
          });
        }
      }
    });
    // Set field IDs
    table.fields.forEach((f, j) => {
      f.id = j;
    });
  };

  const parseConstraint = (table, d) => {
    // Handle PRIMARY KEY constraints
    if (d.constraint.primary_key) {
      if (d.constraint.columns && Array.isArray(d.constraint.columns)) {
        d.constraint.columns.forEach(columnName => {
          const field = table.fields.find(f => f.name === columnName);
          if (field) {
            field.primary = true;
          } else {
            console.warn("Could not find field for primary key:", columnName);
          }
        });
      }
    }
    // Check if this is a foreign key constraint
    if (d.constraint.reference) {
      const relationship = {};
      const startTableId = table.id;
      // Validate structure before accessing
      if (!d.constraint.columns || !d.constraint.reference.columns) {
        console.warn("Invalid constraint structure - missing columns:", d.constraint);
        return;
      }
      const startField = d.constraint.columns[0];
      const endField = d.constraint.reference.columns[0];
      const endTable = d.constraint.reference.object.name;

      const endTableId = tables.findIndex((t) => t.name === endTable);
      if (endTableId === -1) return;

      const endFieldId = tables[endTableId].fields.findIndex(
        (f) => f.name === endField,
      );
      if (endFieldId === -1) return;

      const startFieldId = table.fields.findIndex(
        (f) => f.name === startField,
      );
      if (startFieldId === -1) return;

      relationship.startTableId = startTableId;
      relationship.startFieldId = startFieldId;
      relationship.endTableId = endTableId;
      relationship.endFieldId = endFieldId;
      relationship.updateConstraint = Constraint.NONE;
      relationship.name =
        d.name && Boolean(d.name.trim())
          ? d.name
          : "fk_" + table.name + "_" + startField + "_" + endTable;
      relationship.deleteConstraint =
        d.constraint.reference.on_delete &&
        Boolean(d.constraint.reference.on_delete.trim())
          ? d.constraint.reference.on_delete[0].toUpperCase() +
            d.constraint.reference.on_delete.substring(1)
          : Constraint.NONE;

      relationships.push(relationship);
    }
  };

  ast.forEach((e) => parseSingleStatement(e));

  // Process stored foreign keys after all tables are created
  tables.forEach((table) => {
    if (table.foreignKeys && table.foreignKeys.length > 0) {
      table.foreignKeys.forEach((fk) => {
        const relationship = {};
        const foreignKeyField = fk.sourceColumn;
        const primaryKeyTable = fk.targetTable;
        const primaryKeyField = fk.targetColumn;        
        // The table that contains the Primary Key is the START
        const startTableId = tables.findIndex((t) => t.name === primaryKeyTable);
        if (startTableId === -1) {
          console.warn("Could not find referenced table:", primaryKeyTable);
          return;
        }

        const startFieldId = tables[startTableId].fields.findIndex(
          (f) => f.name === primaryKeyField,
        );
        if (startFieldId === -1) {
          console.warn("Could not find referenced field:", primaryKeyField);
          return;
        }

        // La tabla que contiene la Foreign Key es el END
        const endFieldId = table.fields.findIndex(
          (f) => f.name === foreignKeyField,
        );
        if (endFieldId === -1) {
          console.warn("Could not find source field:", foreignKeyField);
          return;
        }

        relationship.id = relationships.length;
        relationship.startTableId = startTableId;   // Table with PK
        relationship.startFieldId = startFieldId;   // PK field
        relationship.endTableId = table.id;         // Table with FK
        relationship.endFieldId = endFieldId;       // FK field
        relationship.updateConstraint = Constraint.NONE;
        relationship.name = fk.constraintName ||
          "fk_" + primaryKeyTable + "_" + primaryKeyField + "_" + table.name;
        relationship.deleteConstraint = Constraint.NONE;

        relationships.push(relationship);
      });
    }
  });

  relationships.forEach((r, i) => (r.id = i));

  return { tables, relationships, enums };
}
