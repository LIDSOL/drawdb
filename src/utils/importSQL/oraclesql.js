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
    console.log("Parsing statement:", e);
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
        console.log("Processing table constraint:", d);
        console.log("Constraint type:", d.constraint_type);
        console.log("Full constraint object:", JSON.stringify(d, null, 2));
        if (d.constraint_type === "primary key") {
          console.log("Found PRIMARY KEY constraint:", d.definition);
          if (d.definition && Array.isArray(d.definition)) {
            d.definition.forEach(colRef => {
              const columnName = colRef.column;
              console.log("Setting primary key for column:", columnName);
              const field = table.fields.find(f => f.name === columnName);
              if (field) {
                field.primary = true;
                console.log("Successfully set primary key for field:", field.name);
              } else {
                console.warn("Could not find field for primary key:", columnName);
              }
            });
          }
        }
        if (d.constraint_type === "FOREIGN KEY" || d.constraint_type === "foreign key") {
          // Handle foreign key constraints
          console.log("Found FOREIGN KEY constraint:", d);
          console.log("Definition:", d.definition);
          console.log("Reference definition:", d.reference_definition);
          // Extract foreign key information
          const sourceColumn = d.definition[0]?.column;
          const targetTable = d.reference_definition?.table[0]?.table;
          const targetColumn = d.reference_definition?.definition[0]?.column;
          console.log(`Creating foreign key: ${sourceColumn} -> ${targetTable}.${targetColumn}`);
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
    console.log("Processing constraint:", d);
    console.log("Constraint details:", d.constraint);
    // Handle PRIMARY KEY constraints
    if (d.constraint.primary_key) {
      console.log("Found PRIMARY KEY constraint:", d.constraint);
      if (d.constraint.columns && Array.isArray(d.constraint.columns)) {
        d.constraint.columns.forEach(columnName => {
          console.log("Setting primary key for column:", columnName);
          const field = table.fields.find(f => f.name === columnName);
          if (field) {
            field.primary = true;
            console.log("Successfully set primary key for field:", field.name);
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
  console.log("Processing stored foreign keys...");
  tables.forEach((table, tableIndex) => {
    console.log(`Checking table ${table.name} (index ${tableIndex}) for foreign keys...`);
    if (table.foreignKeys && table.foreignKeys.length > 0) {
      console.log(`Found ${table.foreignKeys.length} foreign keys in table ${table.name}`);
      table.foreignKeys.forEach((fk, fkIndex) => {
        console.log(`Processing foreign key ${fkIndex + 1}:`, JSON.stringify(fk, null, 2));
        const relationship = {};
        const startField = fk.sourceColumn;
        const endTable = fk.targetTable;
        const endField = fk.targetColumn;
        console.log(`Creating relationship: ${table.name}.${startField} -> ${endTable}.${endField}`);
        const endTableId = tables.findIndex((t) => t.name === endTable);
        if (endTableId === -1) {
          console.warn("Could not find referenced table:", endTable);
          return;
        }

        const endFieldId = tables[endTableId].fields.findIndex(
          (f) => f.name === endField,
        );
        if (endFieldId === -1) {
          console.warn("Could not find referenced field:", endField);
          return;
        }

        const startFieldId = table.fields.findIndex(
          (f) => f.name === startField,
        );
        if (startFieldId === -1) {
          console.warn("Could not find source field:", startField);
          return;
        }

        relationship.id = relationships.length;
        relationship.startTableId = table.id;
        relationship.startFieldId = startFieldId;
        relationship.endTableId = endTableId;
        relationship.endFieldId = endFieldId;
        relationship.updateConstraint = Constraint.NONE;
        relationship.name = fk.constraintName ||
          "fk_" + table.name + "_" + startField + "_" + endTable;
        relationship.deleteConstraint = Constraint.NONE;

        console.log("Created relationship:", relationship);
        relationships.push(relationship);
      });
    } else {
      console.log(`No foreign keys found in table ${table.name}`);
    }
  });

  relationships.forEach((r, i) => (r.id = i));

  return { tables, relationships, enums };
}
