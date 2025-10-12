// Function to get the default size configured by the user
export const getUserDefaultSize = (typeName, settings, database, dbToTypes) => {
  const dbSettings = settings?.defaultTypeSizes?.[database] || {};
  const userSize = dbSettings[typeName];
  if (typeof userSize === 'number') {
    return userSize;
  }
  return dbToTypes[database][typeName]?.defaultSize || '';
};

// Function to get the combined size for types with precision and scale
export const getUserDefaultPrecisionScale = (typeName, settings, database) => {
  const dbSettings = settings?.defaultTypeSizes?.[database] || {};
  const userSettings = dbSettings[typeName];
  if (typeof userSettings === 'object') {
    const precision = userSettings?.precision || 10;
    const scale = userSettings?.scale;
    // If it has a defined scale, combine as "precision,scale"
    if (scale !== undefined && scale !== null) {
      return `${precision},${scale}`;
    }
    // If it only has precision, return just the precision
    return precision.toString();
  }
  // Default value for types with precision
  return "10";
};
