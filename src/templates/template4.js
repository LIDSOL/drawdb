export const template4 = {
  tables: [
    {
      id: 0,
      name: "books",
      x: 167,
      y: 88,
      fields: [
        {
          name: "id",
          type: "INT",
          default: "",
          check: "",
          primary: true,
          unique: true,
          notNull: true,
          increment: true,
          comment: "",
          id: 0,
        },
        {
          name: "title",
          type: "VARCHAR",
          default: "",
          check: "",
          primary: false,
          unique: false,
          notNull: false,
          increment: false,
          comment: "",
          id: 1,
          size: 255,
        },
        {
          name: "isbn",
          type: "VARCHAR",
          default: "",
          check: "",
          primary: false,
          unique: false,
          notNull: false,
          increment: false,
          comment: "",
          id: 2,
          size: 255,
        },
        {
          name: "author_id",
          type: "INT",
          default: "",
          check: "",
          primary: false,
          unique: false,
          notNull: false,
          increment: false,
          comment: "",
          id: 3,
        },
        {
          name: "genre_id",
          type: "INT",
          default: "",
          check: "",
          primary: false,
          unique: false,
          notNull: false,
          increment: false,
          comment: "",
          id: 4,
        },
      ],
      comment: "",
      indices: [],
      color: "#6360f7",
    },
    {
      id: 1,
      name: "genres",
      x: 78,
      y: 379,
      fields: [
        {
          name: "id",
          type: "INT",
          default: "",
          check: "",
          primary: true,
          unique: true,
          notNull: true,
          increment: true,
          comment: "",
          id: 0,
        },
        {
          name: "name",
          type: "VARCHAR",
          default: "",
          check: "",
          primary: false,
          unique: false,
          notNull: false,
          increment: false,
          comment: "",
          id: 1,
          size: 255,
        },
      ],
      comment: "",
      indices: [],
      color: "#bc49c4",
    },
    {
      id: 2,
      name: "authors",
      x: 475,
      y: 342,
      fields: [
        {
          name: "id",
          type: "INT",
          default: "",
          check: "",
          primary: true,
          unique: true,
          notNull: true,
          increment: true,
          comment: "",
          id: 0,
        },
        {
          name: "name",
          type: "VARCHAR",
          default: "",
          check: "",
          primary: false,
          unique: false,
          notNull: false,
          increment: false,
          comment: "",
          id: 1,
          size: 255,
        },
        {
          name: "birthday",
          type: "DATE",
          default: "",
          check: "",
          primary: false,
          unique: false,
          notNull: false,
          increment: false,
          comment: "",
          id: 2,
          size: "",
          values: [],
        },
        {
          name: "nationality",
          type: "VARCHAR",
          default: "",
          check: "",
          primary: false,
          unique: false,
          notNull: false,
          increment: false,
          comment: "",
          id: 3,
          size: 255,
        },
      ],
      comment: "",
      indices: [],
      color: "#ffe159",
    },
    {
      id: 3,
      name: "reservations",
      x: 501,
      y: 14,
      fields: [
        {
          name: "id",
          type: "INT",
          default: "",
          check: "",
          primary: true,
          unique: true,
          notNull: true,
          increment: true,
          comment: "",
          id: 0,
        },
        {
          name: "book_id",
          type: "INT",
          default: "",
          check: "",
          primary: false,
          unique: false,
          notNull: false,
          increment: false,
          comment: "",
          id: 1,
        },
        {
          name: "patron_id",
          type: "INT",
          default: "",
          check: "",
          primary: false,
          unique: false,
          notNull: false,
          increment: false,
          comment: "",
          id: 2,
        },
        {
          name: "date",
          type: "DATE",
          default: "",
          check: "",
          primary: false,
          unique: false,
          notNull: false,
          increment: false,
          comment: "",
          id: 3,
          size: "",
          values: [],
        },
        {
          name: "email",
          type: "VARCHAR",
          default: "",
          check: "",
          primary: false,
          unique: false,
          notNull: false,
          increment: false,
          comment: "",
          id: 4,
          size: 255,
        },
      ],
      comment: "",
      indices: [],
      color: "#89e667",
    },
    {
      id: 4,
      name: "patrons",
      x: 780,
      y: 220,
      fields: [
        {
          name: "id",
          type: "INT",
          default: "",
          check: "",
          primary: true,
          unique: true,
          notNull: true,
          increment: true,
          comment: "",
          id: 0,
        },
        {
          name: "name",
          type: "VARCHAR",
          default: "",
          check: "",
          primary: false,
          unique: false,
          notNull: false,
          increment: false,
          comment: "",
          id: 1,
          size: 255,
        },
        {
          name: "email",
          type: "VARCHAR",
          default: "",
          check: "",
          primary: false,
          unique: false,
          notNull: false,
          increment: false,
          comment: "",
          id: 2,
          size: 255,
        },
        {
          name: "phone",
          type: "VARCHAR",
          default: "",
          check: "",
          primary: false,
          unique: false,
          notNull: false,
          increment: false,
          comment: "",
          id: 3,
          size: 255,
        },
      ],
      comment: "",
      indices: [],
      color: "#ff9159",
    },
  ],
  relationships: [
    {
      startTableId: 0,
      startFieldId: 3,
      endTableId: 2,
      endFieldId: 0,
      name: "books_author_id_fk",
      cardinality: "Zero to many",
      updateConstraint: "No action",
      deleteConstraint: "No action",
      id: 0,
    },
    {
      startTableId: 3,
      startFieldId: 1,
      endTableId: 0,
      endFieldId: 0,
      name: "reservations_book_id_fk",
      cardinality: "One to one",
      updateConstraint: "No action",
      deleteConstraint: "No action",
      id: 1,
    },
    {
      startTableId: 3,
      startFieldId: 2,
      endTableId: 4,
      endFieldId: 0,
      name: "reservations_patron_id_fk",
      cardinality: "One to one",
      updateConstraint: "No action",
      deleteConstraint: "No action",
      id: 2,
    },
    {
      startTableId: 0,
      startFieldId: 4,
      endTableId: 1,
      endFieldId: 0,
      name: "books_genre_id_fk",
      cardinality: "Zero to many",
      updateConstraint: "No action",
      deleteConstraint: "No action",
      id: 3,
    },
  ],
  notes: [],
  subjectAreas: [],
  types: [],
  title: "Library schema",
  description:
    "A library schema designed to manage the books, genres, reservations, and other aspects of a library system",
  custom: 0,
};
