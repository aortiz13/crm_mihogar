
const XLSX = require('xlsx');

// Mock Excel data with duplicate headers
// We have to create a workbook manually to simulate the file content
const wb = XLSX.utils.book_new();
const ws_data = [
  ["Unit", "Convenio De Pago", "Convenio De Pago", "Convenio De Pago"], // Headers
  ["101", 100, 200, 300], // Data
];
const ws = XLSX.utils.aoa_to_sheet(ws_data);
XLSX.utils.book_append_sheet(wb, ws, "Sheet1");

const jsonData = XLSX.utils.sheet_to_json(ws);

console.log("JSON Data with duplicate headers:");
console.log(JSON.stringify(jsonData, null, 2));

// Simulate what the current code does
const mapping = {
    unitCol: "Unit",
    conceptCols: ["Convenio De Pago"]
};

console.log("\nCurrent Logic Simulation:");
for (const row of jsonData) {
    const unit = row[mapping.unitCol];
    console.log(`Unit: ${unit}`);
    
    for (const concept of mapping.conceptCols) {
        const val = row[concept];
        console.log(`  Looked up '${concept}': ${val}`);
        // Current code would only find this once and likely the first column's value (or last, depending on parsing)
    }
}
