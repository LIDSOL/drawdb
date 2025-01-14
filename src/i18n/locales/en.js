const english = {
  name: "English",
  native_name: "English",
  code: "en",
};

const en = {
  translation: {
    report_bug: "Report a bug",
    import: "Import",
    file: "File",
    new: "New",
    new_window: "New window",
    open: "Open",
    save: "Save",
    save_as: "Save as",
    save_as_template: "Save as template",
    template_saved: "Template saved!",
    rename: "Rename",
    delete_diagram: "Delete diagram",
    are_you_sure_delete_diagram:
      "Are you sure you want to delete this diagram? This operation is irreversible.",
    oops_smth_went_wrong: "Oops! Something went wrong.",
    import_diagram: "Import diagram",
    import_from_source: "Import from SQL",
    export_as: "Export as",
    export_source: "Export SQL",
    models: "Models",
    exit: "Exit",
    edit: "Edit",
    undo: "Undo",
    redo: "Redo",
    clear: "Clear",
    are_you_sure_clear:
      "Are you sure you want to clear the diagram? This is irreversible.",
    cut: "Cut",
    copy: "Copy",
    paste: "Paste",
    duplicate: "Duplicate",
    delete: "Delete",
    copy_as_image: "Copy as image",
    view: "View",
    header: "Menubar",
    sidebar: "Sidebar",
    issues: "Issues",
    presentation_mode: "Presentation mode",
    strict_mode: "Strict mode",
    field_details: "Field details",
    reset_view: "Reset view",
    show_grid: "Show grid",
    show_cardinality: "Show cardinality",
    default_notation: "Default notation",
    crows_foot_notation: "Crow's foot notation",
    idef1x_notation: "IDEF1X notation",
    notation: "Notation",
    theme: "Theme",
    light: "Light",
    dark: "Dark",
    zoom_in: "Zoom in",
    zoom_out: "Zoom out",
    fullscreen: "Fullscreen",
    settings: "Settings",
    show_timeline: "Show timeline",
    autosave: "Autosave",
    panning: "Panning",
    show_debug_coordinates: "Show debug coordinates",
    transform: "Transform",
    viewbox: "View Box",
    cursor_coordinates: "Cursor Coordinates",
    coordinate_space: "Space",
    coordinate_space_screen: "Screen",
    coordinate_space_diagram: "Diagram",
    table_width: "Table width",
    language: "Language",
    flush_storage: "Flush storage",
    are_you_sure_flush_storage:
      "Are you sure you want to flush the storage? This will irreversibly delete all your diagrams and custom templates.",
    storage_flushed: "Storage flushed",
    help: "Help",
    shortcuts: "Shortcuts",
    ask_on_discord: "Ask us on Discord",
    feedback: "Feedback",
    no_changes: "No changes",
    loading: "Loading...",
    last_saved: "Last saved",
    saving: "Saving...",
    failed_to_save: "Failed to save",
    fit_window_reset: "Fit window / Reset",
    zoom: "Zoom",
    add_table: "Add table",
    add_area: "Add area",
    add_note: "Add note",
    add_type: "Add type",
    to_do: "To-do",
    tables: "Tables",
    relationships: "Relationships",
    subject_areas: "Subject areas",
    notes: "Notes",
    types: "Types",
    search: "Search...",
    no_tables: "No tables",
    no_tables_text: "Start building your diagram!",
    no_relationships: "No relationships",
    no_relationships_text: "Drag to connect fields and form relationships!",
    no_subject_areas: "No subject areas",
    no_subject_areas_text: "Add subject areas to group tables!",
    no_notes: "No notes",
    no_notes_text: "Use notes to record extra info",
    no_types: "No types",
    no_types_text: "Make your own custom data types",
    no_issues: "No issues were detected.",
    strict_mode_is_on_no_issues:
      "Strict mode is off so no issues will be displayed.",
    name: "Name",
    type: "Type",
    null: "Null",
    not_null: "Not null",
    primary: "Primary",
    unique: "Unique",
    autoincrement: "Autoincrement",
    default_value: "Default",
    check: "Check expression",
    this_will_appear_as_is: "*This will appear in the generated script as is.",
    comment: "Comment",
    add_field: "Add field",
    values: "Values",
    size: "Size",
    precision: "Precision",
    set_precision: "Set precision: 'size, digits'",
    use_for_batch_input: "Use , for batch input",
    indices: "Indices",
    add_index: "Add index",
    select_fields: "Select fields",
    title: "Title",
    not_set: "Not set",
    foreign: "Foreign",
    cardinality: "Cardinality",
    on_update: "On update",
    on_delete: "On delete",
    swap: "Swap",
    one_to_one: "One to one",
    one_to_many: "One to many",
    zero_to_many: "Zero to many",
    content: "Content",
    types_info:
      "This feature is meant for object-relational DBMSs like PostgreSQL.\nIf used for MySQL or MariaDB a JSON type will be generated with the corresponding json validation check.\nIf used for SQLite it will be translated to a BLOB.\nIf used for MSSQL a type alias to the first field will be generated.",
    table_deleted: "Table deleted",
    area_deleted: "Area deleted",
    note_deleted: "Note deleted",
    relationship_deleted: "Relationship deleted",
    type_deleted: "Type deleted",
    cannot_connect: "Cannot connect, the columns have different types",
    copied_to_clipboard: "Copied to clipboard",
    create_new_diagram: "Create new diagram",
    cancel: "Cancel",
    open_diagram: "Open diagram",
    rename_diagram: "Rename diagram",
    export: "Export",
    export_image: "Export image",
    create: "Create",
    confirm: "Confirm",
    last_modified: "Last modified",
    drag_and_drop_files: "Drag and drop the file here or click to upload.",
    support_json_and_ddb: "JSON and DDB files are supported",
    upload_sql_to_generate_diagrams:
      "Upload an sql file to autogenerate your tables and columns.",
    overwrite_existing_diagram: "Overwrite existing diagram",
    only_mysql_supported:
      "*For the time being loading only MySQL scripts is supported.",
    blank: "Blank",
    filename: "Filename",
    table_w_no_name: "Declared a table with no name",
    duplicate_table_by_name: "Duplicate table by the name '{{tableName}}'",
    empty_field_name: "Empty field `name` in table '{{tableName}}'",
    empty_field_type: "Empty field `type` in table '{{tableName}}'",
    no_values_for_field:
      "'{{fieldName}}' field of table '{{tableName}}' is of type `{{type}}` but no values have been specified",
    default_doesnt_match_type:
      "Default value for field '{{fieldName}}' in table '{{tableName}}' does not match its type",
    not_null_is_null:
      "'{{fieldName}}' field of table '{{tableName}}' is NOT NULL but has default NULL",
    duplicate_fields:
      "Duplicate table fields by name '{{fieldName}}' in table '{{tableName}}'",
    duplicate_index:
      "Duplicate index by name '{{indexName}}' in table '{{tableName}}'",
    empty_index: "Index in table '{{tableName}}' indexes no columns",
    no_primary_key: "Table '{{tableName}}' has no primary key",
    type_with_no_name: "Declared a type with no name",
    duplicate_types: "Duplicate types by the name '{{typeName}}'",
    type_w_no_fields: "Declared an empty type '{{typeName}}' with no fields",
    empty_type_field_name: "Empty field `name` in type '{{typeName}}'",
    empty_type_field_type: "Empty field `type` in type '{{typeName}}'",
    no_values_for_type_field:
      "'{{fieldName}}' field of type '{{typeName}}' is of type `{{type}}` but no values have been specified",
    duplicate_type_fields:
      "Duplicate type fields by name '{{fieldName}}' in type '{{typeName}}'",
    duplicate_reference: "Duplicate reference by the name '{{refName}}'",
    circular_dependency: "Circular dependency involving table '{{refName}}'",
    timeline: "Timeline",
    priority: "Priority",
    none: "None",
    low: "Low",
    medium: "Medium",
    high: "High",
    sort_by: "Sort by",
    my_order: "My order",
    completed: "Completed",
    alphabetically: "Alphabetically",
    add_task: "Add task",
    details: "Details",
    no_tasks: "You have no tasks yet.",
    no_activity: "You have no activity yet.",
    move_element: "Move {{name}} to {{coords}}",
    edit_area: "{{extra}} Edit area {{areaName}}",
    delete_area: "Delete area {{areaName}}",
    edit_note: "{{extra}} Edit note {{noteTitle}}",
    delete_note: "Delete note {{noteTitle}}",
    edit_table: "{{extra}} Edit table {{tableName}}",
    delete_table: "Delete table {{tableName}}",
    edit_type: "{{extra}} Edit type {{typeName}}",
    delete_type: "Delete type {{typeName}}",
    add_relationship: "Add relationship",
    edit_relationship: "{{extra}} Edit relationship {{refName}}",
    delete_relationship: "Delete relationship {{refName}}",
    not_found: "Not found",
    pick_db: "Choose a database",
    generic: "Generic",
    generic_description:
      "Generic diagrams can be exported to any SQL flavor but support few data types.",
    enums: "Enums",
    add_enum: "Add enum",
    edit_enum: "{{extra}} Edit enum {{enumName}}",
    delete_enum: "Delete enum",
    enum_w_no_name: "Found enum with no name",
    enum_w_no_values: "Found enum '{{enumName}}' with no values",
    duplicate_enums: "Duplicate enums with the name '{{enumName}}'",
    no_enums: "No enums",
    no_enums_text: "Define enums here",
    declare_array: "Declare array",
    empty_index_name: "Declared an index with no name in table '{{tableName}}'",
    didnt_find_diagram: "Oops! Didn't find the diagram.",
    unsigned: "Unsigned",
    share: "Share",
    copy_link: "Copy link",
    readme: "README",
    failed_to_load: "Failed to load. Make sure the link is correct.",
    share_info:
      "* Sharing this link will not create a live real-time collaboration session.",
  },
};

export { en, english };
