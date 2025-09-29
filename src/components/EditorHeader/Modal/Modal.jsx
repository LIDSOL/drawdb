import {
  Spin,
  Input,
  Image,
  Toast,
  Modal as SemiUIModal,
} from "@douyinfe/semi-ui";
import { DB, MODAL, STATUS } from "../../../data/constants";
import { useState } from "react";
import { db } from "../../../data/db";
import {
  useAreas,
  useEnums,
  useNotes,
  useDiagram,
  useTransform,
  useTypes,
  useUndoRedo,
  useTasks,
} from "../../../hooks";
import { saveAs } from "file-saver";
import { Parser } from "node-sql-parser";
import { Parser as OracleParser } from "oracle-sql-parser";
import {
  getModalTitle,
  getModalWidth,
  getOkText,
} from "../../../utils/modalData";
import Rename from "./Rename";
import Open from "./Open";
import New from "./New";
import ImportDiagram from "./ImportDiagram";
import ImportSource from "./ImportSource";
import SetTableWidth from "./SetTableWidth";
import Language from "./Language";
import Share from "./Share";
import Code from "./Code";
import Defaults from "./Defaults";
import { useTranslation } from "react-i18next";
import { importSQL } from "../../../utils/importSQL";
import { databases } from "../../../data/databases";
import { isRtl } from "../../../i18n/utils/rtl";

export default function Modal({
  modal,
  setModal,
  title,
  setTitle,
  setDiagramId,
  exportData,
  setExportData,
  importDb,
  importFrom,
}) {
  const { t, i18n } = useTranslation();
  const { setTables, setRelationships, database, setDatabase } = useDiagram();
  const { setNotes } = useNotes();
  const { setAreas } = useAreas();
  const { setTypes } = useTypes();
  const { setEnums } = useEnums();
  const { setTasks } = useTasks();
  const { setTransform } = useTransform();
  // NOTE: Modal loads diagrams/templates and intentionally resets history
  // using `setUndoStack([])` / `setRedoStack([])`. This is a deliberate reset
  // of the history state — do not replace these resets with `pushUndo`.
  const { setUndoStack, setRedoStack } = useUndoRedo();
  const [uncontrolledTitle, setUncontrolledTitle] = useState(title);
  const [importSource, setImportSource] = useState({
    src: "",
    overwrite: true,
  });
  const [importData, setImportData] = useState(null);
  const [error, setError] = useState({
    type: STATUS.NONE,
    message: "",
  });
  const [selectedTemplateId, setSelectedTemplateId] = useState(-1);
  const [selectedDiagramId, setSelectedDiagramId] = useState(0);
  const [saveAsTitle, setSaveAsTitle] = useState(title);

  const overwriteDiagram = () => {
    setTables(importData.tables);
    setRelationships(importData.relationships);
    setAreas(importData.subjectAreas ?? []);
    setNotes(importData.notes ?? []);
    if (importData.title) {
      setTitle(importData.title);
    }
    if (databases[database].hasEnums && importData.enums) {
      setEnums(importData.enums);
    }
    if (databases[database].hasTypes && importData.types) {
      setTypes(importData.types);
    }
  };

  const loadDiagram = async (id) => {
    await db.diagrams
      .get(id)
      .then((diagram) => {
        if (diagram) {
          if (diagram.database) {
            setDatabase(diagram.database);
          } else {
            setDatabase(DB.GENERIC);
          }
          setDiagramId(diagram.id);
          setTitle(diagram.name);
          setTables(diagram.tables);
          setRelationships(diagram.references);
          setAreas(diagram.areas);
          setNotes(diagram.notes);
          setTasks(diagram.todos ?? []);
          setTransform({
            pan: diagram.pan,
            zoom: diagram.zoom,
          });
          setUndoStack([]);
          setRedoStack([]);
          if (databases[database].hasTypes) {
            setTypes(diagram.types ?? []);
          }
          if (databases[database].hasEnums) {
            setEnums(diagram.enums ?? []);
          }
          window.name = `d ${diagram.id}`;
        } else {
          window.name = "";
          Toast.error(t("didnt_find_diagram"));
        }
      })
      .catch((error) => {
        console.log(error);
        Toast.error(t("didnt_find_diagram"));
      });
  };

  const parseSQLAndLoadDiagram = () => {
    const targetDatabase = database === DB.GENERIC ? importDb : database;

    // Preprocess SQL for Oracle parser
    const preprocessOracleSQL = (sql) => {
      return sql
        // Remove comments that start with --@ which can cause parsing issues
        .replace(/--@[^\r\n]*/g, '')
        // Remove standalone comment lines that just contain --
        .replace(/^\s*--\s*$/gm, '')
        // Remove table comment blocks like -- TABLE: TABLENAME --
        .replace(/--\s*TABLE:\s*[^-]*--/g, '')
        // Clean up multiple empty lines
        .replace(/\n\s*\n\s*\n/g, '\n\n')
        // Ensure statements end with semicolons
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0 && !line.match(/^--\s*$/))
        .join('\n');
    };

    let ast = null;
    try {
      if (targetDatabase === DB.ORACLESQL) {
        // Try Oracle parser first
        try {
          const oracleParser = new OracleParser();
          const preprocessedSQL = preprocessOracleSQL(importSource.src);
          console.log("Preprocessed SQL:", preprocessedSQL);
          ast = oracleParser.parse(preprocessedSQL);
          console.log("Oracle parser AST:", ast);
        } catch (oracleError) {
          console.warn("Oracle parser failed, trying standard parser:", oracleError);
          // Fallback to standard parser with modified SQL
          try {
            const parser = new Parser();
            // Try to convert Oracle-specific syntax to MySQL-compatible
            const mysqlCompatibleSQL = importSource.src
              .replace(/NUMBER\s*\(\s*(\d+)\s*,\s*(\d+)\s*\)/gi, 'DECIMAL($1,$2)')
              .replace(/NUMBER\s*\(\s*(\d+)\s*\)/gi, 'INT($1)')
              .replace(/NUMBER(?!\s*\()/gi, 'INT')
              .replace(/VARCHAR2/gi, 'VARCHAR')
              .replace(/--@[^\r\n]*/g, '');
            
            ast = parser.astify(mysqlCompatibleSQL, {
              database: "mysql",
            });
            console.log("Standard parser AST with MySQL compatibility:", ast);
          } catch (standardError) {
            console.error("Both parsers failed:", standardError);
            throw new Error(`Failed to parse SQL. Oracle parser error: ${oracleError.message}. Standard parser error: ${standardError.message}`);
          }
        }
      } else {
        const parser = new Parser();

        ast = parser.astify(importSource.src, {
          database: targetDatabase,
        });
        console.log("Standard parser AST:", ast);
      }
    } catch (error) {
      const message = error.location
        ? `${error.name} [Ln ${error.location.start.line}, Col ${error.location.start.column}]: ${error.message}`
        : error.message;

      setError({ type: STATUS.ERROR, message });
      return;
    }

    try {
      console.log("About to import SQL with AST:", ast);
      console.log("Target database:", database === DB.GENERIC ? importDb : database);
      console.log("Current database:", database);
      if (!ast) {
        throw new Error("AST is null or undefined");
      }

      const diagramData = importSQL(
        ast,
        database === DB.GENERIC ? importDb : database,
        database,
      );

      if (importSource.overwrite) {
        setTables(diagramData.tables);
        setRelationships(diagramData.relationships);
        setTransform((prev) => ({ ...prev, pan: { x: 0, y: 0 } }));
        setNotes([]);
        setAreas([]);
        if (databases[database].hasTypes) setTypes(diagramData.types ?? []);
        if (databases[database].hasEnums) setEnums(diagramData.enums ?? []);
        setUndoStack([]);
        setRedoStack([]);
      } else {
        setTables((prev) =>
          [...prev, ...diagramData.tables].map((t, i) => ({ ...t, id: i })),
        );
        setRelationships((prev) =>
          [...prev, ...diagramData.relationships].map((r, i) => ({
            ...r,
            id: i,
          })),
        );
      }

      setModal(MODAL.NONE);
    } catch (importError) {
      console.error("Import error:", importError);
      setError({
        type: STATUS.ERROR,
        message: `Import failed: ${importError.message || "Please check for syntax errors or let us know about the error."}`,
      });
    }
  };

  const createNewDiagram = (id) => {
    const newWindow = window.open("/editor");
    newWindow.name = "lt " + id;
  };

  const getModalOnOk = async () => {
    switch (modal) {
      case MODAL.IMG:
        saveAs(
          exportData.data,
          `${exportData.filename}.${exportData.extension}`,
        );
        return;
      case MODAL.CODE: {
        const blob = new Blob([exportData.data], {
          type: "application/json",
        });
        saveAs(blob, `${exportData.filename}.${exportData.extension}`);
        return;
      }
      case MODAL.IMPORT:
        if (error.type !== STATUS.ERROR) {
          setTransform((prev) => ({ ...prev, pan: { x: 0, y: 0 } }));
          overwriteDiagram();
          setImportData(null);
          setModal(MODAL.NONE);
          setUndoStack([]);
          setRedoStack([]);
        }
        return;
      case MODAL.IMPORT_SRC:
        parseSQLAndLoadDiagram();
        return;
      case MODAL.OPEN:
        if (selectedDiagramId === 0) return;
        loadDiagram(selectedDiagramId);
        setModal(MODAL.NONE);
        return;
      case MODAL.RENAME:
        setTitle(uncontrolledTitle);
        setModal(MODAL.NONE);
        return;
      case MODAL.SAVEAS:
        setTitle(saveAsTitle);
        setModal(MODAL.NONE);
        return;
      case MODAL.NEW:
        setModal(MODAL.NONE);
        createNewDiagram(selectedTemplateId);
        return;
      default:
        setModal(MODAL.NONE);
        return;
    }
  };

  const getModalBody = () => {
    switch (modal) {
      case MODAL.IMPORT:
        return (
          <ImportDiagram
            setImportData={setImportData}
            error={error}
            setError={setError}
            importFrom={importFrom}
          />
        );
      case MODAL.IMPORT_SRC:
        return (
          <ImportSource
            importData={importSource}
            setImportData={setImportSource}
            error={error}
            setError={setError}
          />
        );
      case MODAL.NEW:
        return (
          <New
            selectedTemplateId={selectedTemplateId}
            setSelectedTemplateId={setSelectedTemplateId}
          />
        );
      case MODAL.RENAME:
        return (
          <Rename key={title} title={title} setTitle={setUncontrolledTitle} />
        );
      case MODAL.OPEN:
        return (
          <Open
            selectedDiagramId={selectedDiagramId}
            setSelectedDiagramId={setSelectedDiagramId}
          />
        );
      case MODAL.SAVEAS:
        return (
          <Input
            placeholder={t("name")}
            value={saveAsTitle}
            onChange={(v) => setSaveAsTitle(v)}
          />
        );
      case MODAL.CODE:
      case MODAL.IMG:
        if (exportData.data !== "" || exportData.data) {
          return (
            <>
              {modal === MODAL.IMG ? (
                <Image src={exportData.data} alt="Diagram" height={280} />
              ) : (
                <Code value={exportData.data} language={exportData.extension} />
              )}
              <div className="text-sm font-semibold mt-2">{t("filename")}:</div>
              <Input
                value={exportData.filename}
                placeholder={t("filename")}
                suffix={<div className="p-2">{`.${exportData.extension}`}</div>}
                onChange={(value) =>
                  setExportData((prev) => ({ ...prev, filename: value }))
                }
                field="filename"
              />
            </>
          );
        } else {
          return (
            <div className="text-center my-3 text-sky-600">
              <Spin tip={t("loading")} size="large" />
            </div>
          );
        }
      case MODAL.TABLE_WIDTH:
        return <SetTableWidth />;
      case MODAL.DEFAULTS:
        return <Defaults />
      case MODAL.LANGUAGE:
        return <Language />;
      case MODAL.SHARE:
        return <Share title={title} setModal={setModal} />;
      default:
        return <></>;
    }
  };

  return (
    <SemiUIModal
      style={isRtl(i18n.language) ? { direction: "rtl" } : {}}
      title={getModalTitle(modal)}
      visible={modal !== MODAL.NONE}
      onOk={getModalOnOk}
      afterClose={() => {
        setExportData(() => ({
          data: "",
          extension: "",
          filename: `${title}_${new Date().toISOString()}`,
        }));
        setError({
          type: STATUS.NONE,
          message: "",
        });
        setImportData(null);
        setImportSource({
          src: "",
          overwrite: true,
        });
      }}
      onCancel={() => {
        if (modal === MODAL.RENAME) setUncontrolledTitle(title);
        setModal(MODAL.NONE);
      }}
      centered
      closeOnEsc={true}
      okText={getOkText(modal)}
      okButtonProps={{
        disabled:
          (error && error?.type === STATUS.ERROR) ||
          (modal === MODAL.IMPORT &&
            (error.type === STATUS.ERROR || !importData)) ||
          (modal === MODAL.RENAME && title === "") ||
          ((modal === MODAL.IMG || modal === MODAL.CODE) && !exportData.data) ||
          (modal === MODAL.SAVEAS && saveAsTitle === "") ||
          (modal === MODAL.IMPORT_SRC && importSource.src === ""),
        hidden: modal === MODAL.SHARE,
      }}
      hasCancel={modal !== MODAL.SHARE}
      cancelText={t("cancel")}
      width={getModalWidth(modal)}
      bodyStyle={{
        maxHeight: window.innerHeight - 280,
        overflow:
          modal === MODAL.CODE || modal === MODAL.IMG ? "hidden" : "auto",
        direction: "ltr",
      }}
    >
      {getModalBody()}
    </SemiUIModal>
  );
}
