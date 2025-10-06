/* eslint-env jest */
import { toOracleSQL } from "../src/utils/exportSQL/oraclesql.js";
import { DB } from "../src/data/constants.js";

describe("toOracleSQL", () => {
  test("test for check constraint in any field of a table", () => {
    const diagram = {
      database: DB.ORACLE,
      tables: [
        {
          name: "salon",
          fields: [
            {
              name: "salon_id",
              type: "NUMBER",
              size: "10,0",
              notNull: true,
              primary: true,
              default: "",
            },
            {
              name: "capacidad",
              type: "NUMBER",
              size: "10,0",
              notNull: true,
              default: "",
              check: "> 0",
            },
          ],
          indices: [],
        },
      ],
      references: [],
    };

    const expectedSQL = `CREATE TABLE salon (
\tsalon_id NUMBER(10,0) NOT NULL,
\tcapacidad NUMBER(10,0) NOT NULL,
\tCONSTRAINT salon_capacidad_chk CHECK(capacidad > 0),
\tCONSTRAINT salon_pk PRIMARY KEY(salon_id)
);`;

    const result = toOracleSQL(diagram);
    expect(result.trim()).toBe(expectedSQL.trim());
  });
});
