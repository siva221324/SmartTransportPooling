const XLSX = require('./node_modules/xlsx');

const wb = XLSX.utils.book_new();

// ─────────────────────────────────────────────
// HELPER – apply column widths
// ─────────────────────────────────────────────
function setColWidths(ws, widths) {
  ws['!cols'] = widths.map(w => ({ wch: w }));
}

// ─────────────────────────────────────────────
// SHEET 1 – COVER / PROJECT INFO
// ─────────────────────────────────────────────
const coverData = [
  ['RAJ TRAVELS – HOTEL BOOKING MODULE'],
  ['Functional Test Artifacts'],
  [''],
  ['Project', 'Raj Travels Website – Hotel Booking'],
  ['Prepared By', 'QA Tester'],
  ['Date', '29-May-2026'],
  ['Version', '1.0'],
  [''],
  ['Deliverables', 'Description'],
  ['Deliverable 1', 'Test Scenarios (Sheet: Test Scenarios)'],
  ['Deliverable 2', 'Test Cases (Sheet: Test Cases)'],
  ['Deliverable 3', 'Defect Log (Sheet: Defect Log)'],
];
const wsCover = XLSX.utils.aoa_to_sheet(coverData);
setColWidths(wsCover, [30, 60]);
XLSX.utils.book_append_sheet(wb, wsCover, 'Cover');

// ─────────────────────────────────────────────
// SHEET 2 – TEST SCENARIOS
// ─────────────────────────────────────────────
const scenarioHeaders = [
  'Scenario ID', 'Test Scenario Description', 'Module / Feature', 'Priority'
];
const scenarioRows = [
  ['TS_001',
   'Verify the behaviour of Location Radio Button (India / International) and the corresponding visibility and activation state of the Country and City List Boxes.',
   'Location – Radio Button, Country & City List Boxes',
   'High'],
  ['TS_002',
   'Verify that Check-In and Check-Out date fields accept only DDMONYYYY format and enforce the rule that Check-Out date must be >= Check-In date.',
   'Check-In / Check-Out Date Validation',
   'High'],
  ['TS_003',
   'Verify that the City List Box is dynamically populated based on the selected Country, and that the Search button returns hotel results matching the selected city.',
   'City List Box – Dynamic Population & Search Results',
   'Critical'],
  ['TS_004',
   'Verify that the number of Room rows displayed dynamically matches the Rooms selection (1–6) and each row shows mandatory Adults (1–2) and optional Children (0–4) List Boxes.',
   'Rooms / Adults / Children – Dynamic Rows',
   'High'],
];
const wsScenarios = XLSX.utils.aoa_to_sheet([scenarioHeaders, ...scenarioRows]);
setColWidths(wsScenarios, [14, 80, 45, 12]);
XLSX.utils.book_append_sheet(wb, wsScenarios, 'Test Scenarios');

// ─────────────────────────────────────────────
// SHEET 3 – TEST CASES
// ─────────────────────────────────────────────
const tcHeaders = [
  'TC ID', 'Test Case Title', 'Module', 'Pre-Conditions',
  'Test Steps', 'Test Data', 'Expected Result', 'Technique', 'Status'
];

const tcRows = [
  // ── MODULE 1 – Location / Country / City ──────────────────────────────
  ['TC_001','Verify Country List Box is INACTIVE when "India" is selected',
   'Location – Radio Button',
   'Raj Travels site open; Book Hotel page loaded',
   '1. Click "India" radio button.\n2. Observe Country List Box state.\n3. Observe City List Box state.',
   'Location = India',
   'Country List Box is inactive/greyed out. City List Box is active with values: Delhi, Mumbai, Calcutta, Chennai.',
   'Decision Table Testing','Not Executed'],

  ['TC_002','Verify Country and City List Boxes are ACTIVE when "International" is selected',
   'Location – Radio Button',
   'Raj Travels site open; Book Hotel page loaded',
   '1. Click "International" radio button.\n2. Observe Country List Box state.\n3. Observe City List Box state.',
   'Location = International',
   'Country List Box is active with values: India, USA, UK. City List Box is active.',
   'Decision Table Testing','Not Executed'],

  ['TC_003','Verify switching from "International" to "India" deactivates Country List Box',
   'Location – Radio Button',
   '"International" already selected',
   '1. Click "India" radio button.\n2. Observe Country List Box state.',
   'Switch: International → India',
   'Country List Box becomes inactive. City List Box shows Indian cities only.',
   'Decision Table Testing','Not Executed'],

  ['TC_004','Verify City List Box shows correct cities when Country = USA',
   'Country / City List Boxes',
   '"International" selected',
   '1. Select Country = "USA".\n2. Observe City List Box values.',
   'Country = USA',
   'City List Box shows: New York, San Jose, New Jersey, Niagara.',
   'Decision Table Testing','Not Executed'],

  ['TC_005','Verify City List Box shows correct cities when Country = UK',
   'Country / City List Boxes',
   '"International" selected',
   '1. Select Country = "UK".\n2. Observe City List Box values.',
   'Country = UK',
   'City List Box shows: England, Scotland, Leeds, Glasgow.',
   'Decision Table Testing','Not Executed'],

  ['TC_006','Verify City List Box shows correct cities when Country = India (International)',
   'Country / City List Boxes',
   '"International" selected',
   '1. Select Country = "India".\n2. Observe City List Box values.',
   'Country = India',
   'City List Box shows: Delhi, Mumbai, Calcutta, Chennai.',
   'Decision Table Testing','Not Executed'],

  ['TC_007','Verify error message when no Location is selected and Search is clicked',
   'Location – Mandatory Field',
   'Raj Travels site open; no field selected',
   '1. Leave Location unselected.\n2. Click "Search" button.',
   'Location = (empty)',
   'Error message displayed: "Location is mandatory".',
   'Error Guessing','Not Executed'],

  // ── MODULE 2 – Date Validation ─────────────────────────────────────────
  ['TC_008','Verify Check-In date accepts valid format DDMONYYYY',
   'Check-In Date',
   'Location and City selected',
   '1. Enter Check-In = 01JUN2026.\n2. Fill other mandatory fields.\n3. Click Search.',
   'Check-In = 01JUN2026',
   'Check-In date accepted; no format error displayed.',
   'Equivalence Partitioning (Valid)','Not Executed'],

  ['TC_009','Verify Check-In date rejects invalid format DD/MM/YYYY',
   'Check-In Date',
   'Location and City selected',
   '1. Enter Check-In = 01/06/2026.\n2. Click Search.',
   'Check-In = 01/06/2026',
   'Error message: "Invalid date format. Use DDMONYYYY".',
   'Equivalence Partitioning (Invalid)','Not Executed'],

  ['TC_010','Verify Check-In date rejects invalid format MM-DD-YYYY',
   'Check-In Date',
   'Location and City selected',
   '1. Enter Check-In = 06-01-2026.\n2. Click Search.',
   'Check-In = 06-01-2026',
   'Error message: "Invalid date format. Use DDMONYYYY".',
   'Equivalence Partitioning (Invalid)','Not Executed'],

  ['TC_011','Verify Check-Out = Check-In is accepted (BVA – Boundary)',
   'Check-In / Check-Out Dates',
   'Valid Check-In entered',
   '1. Enter Check-In = 10JUN2026.\n2. Enter Check-Out = 10JUN2026.\n3. Fill other mandatory fields.\n4. Click Search.',
   'Check-In = 10JUN2026, Check-Out = 10JUN2026',
   'Search executes successfully. Hotel results displayed.',
   'BVA (Boundary)','Not Executed'],

  ['TC_012','Verify Check-Out > Check-In is accepted (BVA – Above Boundary)',
   'Check-In / Check-Out Dates',
   'Valid Check-In entered',
   '1. Enter Check-In = 10JUN2026.\n2. Enter Check-Out = 11JUN2026.\n3. Fill other mandatory fields.\n4. Click Search.',
   'Check-In = 10JUN2026, Check-Out = 11JUN2026',
   'Search executes successfully. Hotel results displayed.',
   'BVA (Above Boundary)','Not Executed'],

  ['TC_013','Verify Check-Out < Check-In shows error (BVA – Below Boundary)',
   'Check-In / Check-Out Dates',
   'Valid Check-In entered',
   '1. Enter Check-In = 10JUN2026.\n2. Enter Check-Out = 09JUN2026.\n3. Fill other mandatory fields.\n4. Click Search.',
   'Check-In = 10JUN2026, Check-Out = 09JUN2026',
   'Error message: "Check-Out date must be >= Check-In date". No results displayed.',
   'BVA (Below Boundary) / EP (Invalid)','Not Executed'],

  ['TC_014','Verify error when Check-In is not entered (mandatory)',
   'Check-In Date – Mandatory',
   'Raj Travels site open',
   '1. Fill all fields except Check-In.\n2. Click Search.',
   'Check-In = (empty)',
   'Error message: "Check-In date is mandatory".',
   'Error Guessing','Not Executed'],

  ['TC_015','Verify error when Check-Out is not entered (mandatory)',
   'Check-Out Date – Mandatory',
   'Valid Check-In entered',
   '1. Fill all fields except Check-Out.\n2. Click Search.',
   'Check-Out = (empty)',
   'Error message: "Check-Out date is mandatory".',
   'Error Guessing','Not Executed'],

  // ── MODULE 3 – Rooms / Adults / Children ──────────────────────────────
  ['TC_016','Verify Rooms = 1 shows 1 row (BVA – Min)',
   'Rooms – Dynamic Rows',
   'Location and City selected',
   '1. Select Rooms = 1.\n2. Observe the number of rows and labels.',
   'Rooms = 1',
   'Room#1 row displayed with Adults and Children List Boxes.',
   'BVA (Min)','Not Executed'],

  ['TC_017','Verify Rooms = 2 shows 2 rows (specification example)',
   'Rooms – Dynamic Rows',
   'Location and City selected',
   '1. Select Rooms = 2.\n2. Observe rows displayed.',
   'Rooms = 2',
   'Two rows displayed: Room#1 and Room#2, each with Adults and Children List Boxes.',
   'BVA','Not Executed'],

  ['TC_018','Verify Rooms = 6 shows 6 rows (BVA – Max)',
   'Rooms – Dynamic Rows',
   'Location and City selected',
   '1. Select Rooms = 6.\n2. Observe rows.',
   'Rooms = 6',
   'Six rows displayed: Room#1 through Room#6, each with Adults and Children.',
   'BVA (Max)','Not Executed'],

  ['TC_019','Verify Rooms = 0 is not selectable (BVA – Min-1)',
   'Rooms List Box',
   'Location and City selected',
   '1. Check if 0 is selectable in Rooms List Box.',
   'Rooms = 0',
   'Value 0 is not available. Valid range starts at 1.',
   'BVA (Min-1)','Not Executed'],

  ['TC_020','Verify Rooms = 7 is not selectable (BVA – Max+1)',
   'Rooms List Box',
   'Location and City selected',
   '1. Check if 7 is selectable in Rooms List Box.',
   'Rooms = 7',
   'Value 7 is not available. Valid range ends at 6.',
   'BVA (Max+1)','Not Executed'],

  ['TC_021','Verify Adults minimum = 1 per room (BVA – Min)',
   'Adults List Box',
   'Rooms = 1 row displayed',
   '1. Set Adults = 1 for Room#1.\n2. Click Search (fill other mandatory fields).',
   'Adults = 1',
   'Accepted; search proceeds.',
   'BVA (Min)','Not Executed'],

  ['TC_022','Verify Adults maximum = 2 per room (BVA – Max)',
   'Adults List Box',
   'Rooms = 1 row displayed',
   '1. Set Adults = 2 for Room#1.\n2. Click Search (fill other mandatory fields).',
   'Adults = 2',
   'Accepted; search proceeds.',
   'BVA (Max)','Not Executed'],

  ['TC_023','Verify Adults = 0 is not selectable (BVA – Min-1)',
   'Adults List Box',
   'Rooms = 1 row displayed',
   '1. Check if Adults = 0 is available.',
   'Adults = 0',
   'Value 0 is not available; minimum is 1.',
   'BVA (Min-1)','Not Executed'],

  ['TC_024','Verify Adults = 3 is not selectable (BVA – Max+1)',
   'Adults List Box',
   'Rooms = 1 row displayed',
   '1. Check if Adults = 3 is available.',
   'Adults = 3',
   'Value 3 is not available; maximum is 2.',
   'BVA (Max+1)','Not Executed'],

  ['TC_025','Verify Children minimum = 0 per room (BVA – Min)',
   'Children List Box',
   'Rooms = 1 row displayed',
   '1. Set Children = 0 for Room#1.\n2. Click Search (fill other mandatory fields).',
   'Children = 0',
   'Accepted; search proceeds (0 is valid).',
   'BVA (Min)','Not Executed'],

  ['TC_026','Verify Children maximum = 4 per room (BVA – Max)',
   'Children List Box',
   'Rooms = 1 row displayed',
   '1. Set Children = 4 for Room#1.\n2. Click Search (fill other mandatory fields).',
   'Children = 4',
   'Accepted; search proceeds.',
   'BVA (Max)','Not Executed'],

  ['TC_027','Verify Children = 5 is not selectable (BVA – Max+1)',
   'Children List Box',
   'Rooms = 1 row displayed',
   '1. Check if Children = 5 is available.',
   'Children = 5',
   'Value 5 is not available; maximum is 4.',
   'BVA (Max+1)','Not Executed'],

  ['TC_028','Verify error when Adults not selected (mandatory)',
   'Adults – Mandatory Field',
   'Rooms = 1 row displayed',
   '1. Leave Adults unselected for Room#1.\n2. Fill other mandatory fields.\n3. Click Search.',
   'Adults = (empty)',
   'Error message: "Adults is mandatory for each room".',
   'Error Guessing','Not Executed'],

  // ── MODULE 4 – Search End-to-End ──────────────────────────────────────
  ['TC_029','Verify successful hotel search with all valid fields (India)',
   'Search – End-to-End',
   'Raj Travels site open',
   '1. Select Location = India.\n2. Select City = Delhi.\n3. Enter Check-In = 01JUN2026, Check-Out = 05JUN2026.\n4. Select Rooms = 1, Adults = 1.\n5. Click Search.',
   'All valid; India + Delhi',
   'Application displays hotel details for Delhi.',
   'Equivalence Partitioning (Valid)','Not Executed'],

  ['TC_030','Verify successful hotel search with all valid fields (International)',
   'Search – End-to-End',
   'Raj Travels site open',
   '1. Select Location = International.\n2. Select Country = USA.\n3. Select City = New York.\n4. Enter Check-In = 10JUN2026, Check-Out = 15JUN2026.\n5. Select Rooms = 2, Adults = 2 each.\n6. Click Search.',
   'All valid; USA + New York',
   'Application displays hotel details for New York, USA.',
   'Equivalence Partitioning (Valid)','Not Executed'],

  ['TC_031','Verify error when mandatory City field is not selected',
   'City – Mandatory Field',
   'Location = India selected',
   '1. Select Location = India.\n2. Leave City unselected.\n3. Fill other fields.\n4. Click Search.',
   'City = (empty)',
   'Error message: "City is mandatory".',
   'Equivalence Partitioning (Invalid)','Not Executed'],

  ['TC_032','Verify Nationality List Box contains "Indian" and "Others"',
   'Nationality List Box',
   'Raj Travels site open',
   '1. Click on Nationality List Box.\n2. Observe available values.',
   '—',
   'Nationality shows exactly: Indian, Others.',
   'Equivalence Partitioning (Valid)','Not Executed'],
];

const wsTCs = XLSX.utils.aoa_to_sheet([tcHeaders, ...tcRows]);
setColWidths(wsTCs, [10, 55, 28, 40, 60, 40, 60, 30, 15]);
XLSX.utils.book_append_sheet(wb, wsTCs, 'Test Cases');

// ─────────────────────────────────────────────
// SHEET 4 – DEFECT LOG
// ─────────────────────────────────────────────
const defectHeaders = [
  'Defect ID', 'Defect Title', 'Module', 'Reported By', 'Reported Date',
  'Build / Version', 'Environment', 'Severity', 'Priority', 'Status',
  'Related Requirement', 'Related TC', 'Pre-Conditions',
  'Steps to Reproduce', 'Expected Result', 'Actual Result', 'Impact', 'Attachments'
];

const defectRows = [
  [
    'BUG_001',
    'Country List Box not displayed when "International" Radio Button is selected',
    'Location – Country List Box',
    'QA Tester',
    '29-May-2026',
    '1.0',
    'Test Environment',
    'High',
    'High',
    'Open',
    '"If Radio Button is selected as International, then both list boxes Country and City should be Active."',
    'TC_002',
    'Raj Travels website is open. Book Hotel page is loaded.',
    '1. Navigate to the Book Hotel page.\n2. Observe the default state of the page.\n3. Click the "International" Radio Button under Location field.\n4. Observe the Country List Box.',
    'The "Country" List Box should become active and visible, displaying values: India, USA, UK. The "City" List Box should also be active.',
    'After clicking "International" Radio Button, the "Country" List Box is NOT displayed on screen. User cannot select any country.',
    'Critical business functionality broken. Users cannot book international hotels because the mandatory Country field cannot be selected.',
    'Screenshot showing Country List Box absent after clicking International'
  ],
  [
    'BUG_002',
    'Application displays hotel records instead of error when Check-In date is greater than Check-Out date',
    'Check-In / Check-Out Date Validation',
    'QA Tester',
    '29-May-2026',
    '1.0',
    'Test Environment',
    'High',
    'High',
    'Open',
    '"The Check-Out date should be >= to the Check-In date. If the data is invalid, the application displays appropriate error message in the next screen."',
    'TC_013',
    'Raj Travels website is open. Book Hotel page is loaded.',
    '1. Navigate to the Book Hotel page.\n2. Select Location = "India".\n3. Select City = "Mumbai".\n4. Enter Check-In = 15JUN2026.\n5. Enter Check-Out = 10JUN2026 (earlier than Check-In).\n6. Select Rooms = 1, Adults = 1, Children = 0.\n7. Click "Search" button.',
    'Application should validate the dates and display an error: "Check-Out date must be >= Check-In date." No hotel records should be shown.',
    'Application ignores the invalid date range and displays all hotel records as if the input were valid.',
    'Incorrect date validation allows logically invalid bookings to proceed. Data integrity failure that could result in invalid hotel reservations, causing business and customer impact.',
    'Screenshot showing hotel results returned for Check-In = 15JUN2026 and Check-Out = 10JUN2026'
  ],
  [
    'BUG_003',
    'Hotel details for "Calcutta" are displayed instead of "Delhi" when City = Delhi is selected',
    'City Selection – Search Results',
    'QA Tester',
    '29-May-2026',
    '1.0',
    'Test Environment',
    'Critical',
    'Critical',
    'Open',
    '"After filling all the mandatory details and on clicking Search button, if valid, the application displays the required details in the next screen." — City = Delhi must return Delhi hotel details.',
    'TC_029',
    'Raj Travels website is open. Book Hotel page is loaded.',
    '1. Navigate to the Book Hotel page.\n2. Select Location = "India".\n3. Select City = "Delhi".\n4. Enter Check-In = 01JUN2026.\n5. Enter Check-Out = 05JUN2026.\n6. Select Rooms = 1, Adults = 1, Children = 0.\n7. Click "Search" button.',
    'Search results page should display hotel details for "Delhi" only — names, addresses and details all pertaining to Delhi, India.',
    'Search results page displays hotel details for "Calcutta" instead of "Delhi". The city mapping in search results is incorrect.',
    'Critical defect — incorrect search results returned. Travelers searching for Delhi hotels are shown Calcutta hotels, directly misleading users and risking wrong bookings. All India city mappings must be verified.',
    'Screenshot showing Calcutta hotel listings returned when Delhi was selected'
  ]
];

const wsDefects = XLSX.utils.aoa_to_sheet([defectHeaders, ...defectRows]);
setColWidths(wsDefects, [12, 55, 28, 15, 16, 15, 18, 12, 12, 12, 60, 12, 40, 65, 65, 65, 65, 45]);
XLSX.utils.book_append_sheet(wb, wsDefects, 'Defect Log');

// ─────────────────────────────────────────────
// WRITE FILE
// ─────────────────────────────────────────────
const outputPath = 'c:\\Users\\2494455\\Downloads\\SmartTransportPooling-main\\SmartTransportPooling\\RajTravels_Test_Artifacts.xlsx';
XLSX.writeFile(wb, outputPath);
console.log('Excel file created successfully:', outputPath);
