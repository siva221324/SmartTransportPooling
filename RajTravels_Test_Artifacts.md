# Raj Travels – Hotel Booking: Test Artifacts
**Project:** Raj Travels Website – Hotel Booking Module  
**Prepared By:** QA Tester  
**Date:** 29-May-2026  
**Document Version:** 1.0  

---

## REQUIREMENT SUMMARY

Raj Travels website allows users to book hotels in India and internationally.  
Key fields: Location (Radio Button – India / International), Country (List Box, inactive for India), City (List Box), Check-In (DDMONYYYY), Check-Out (DDMONYYYY, >= Check-In), Nationality, Rooms (1–6), Adults (1–2, mandatory per room), Children (0–4), and a Search button.

---

---

# DELIVERABLE 1 – TEST SCENARIOS

| Scenario ID | Test Scenario Description |
|-------------|--------------------------|
| TS_001 | Verify the behaviour of Location Radio Button (India / International) and the corresponding visibility and activation state of the Country and City List Boxes. |
| TS_002 | Verify that the Check-In and Check-Out date fields accept only valid format (DDMONYYYY) and enforce the rule that Check-Out date must be greater than or equal to Check-In date. |
| TS_003 | Verify that the City List Box is dynamically populated based on the selected Country, and that the Search button returns hotel results matching the selected city. |
| TS_004 | Verify that the number of Room rows displayed dynamically matches the value selected in the Rooms List Box, and each row correctly shows mandatory Adults (1–2) and optional Children (0–4) List Boxes. |

---

---

# DELIVERABLE 2 – TEST CASES

**Techniques Applied:**
- **Decision Table Testing (DTT)** – Radio Button + Country/City combinations  
- **Equivalence Partitioning (EP)** – Date validation, Nationality values  
- **Boundary Value Analysis (BVA)** – Rooms (1–6), Adults (1–2), Children (0–4), dates  
- **Error Guessing (EG)** – Mandatory field omission, invalid date formats  

---

## MODULE 1 – Location Radio Button & Country/City List Boxes
*(Technique: Decision Table Testing)*

| TC ID  | Test Case Title | Pre-Conditions | Test Steps | Test Data | Expected Result | Technique |
|--------|-----------------|---------------|------------|-----------|-----------------|-----------|
| TC_001 | Verify Country List Box is INACTIVE when "India" is selected | Raj Travels site open; Book Hotel page loaded | 1. Click "India" radio button under Location. 2. Observe Country List Box state. 3. Observe City List Box state. | Location = India | Country List Box is inactive/greyed out; City List Box is active and shows: Delhi, Mumbai, Calcutta, Chennai | DTT |
| TC_002 | Verify Country and City List Boxes are ACTIVE when "International" is selected | Raj Travels site open; Book Hotel page loaded | 1. Click "International" radio button under Location. 2. Observe Country List Box state. 3. Observe City List Box state. | Location = International | Country List Box is active with values: India, USA, UK; City List Box is active | DTT |
| TC_003 | Verify switching from "International" to "India" deactivates Country List Box | "International" already selected | 1. Click "India" radio button. 2. Observe Country List Box state. | Switch: International → India | Country List Box becomes inactive; City List Box shows Indian cities only | DTT |
| TC_004 | Verify City List Box shows correct cities when Country = USA (International) | "International" selected | 1. Select Country = "USA". 2. Observe City List Box values. | Country = USA | City List Box shows: New York, San Jose, New Jersey, Niagara | DTT |
| TC_005 | Verify City List Box shows correct cities when Country = UK (International) | "International" selected | 1. Select Country = "UK". 2. Observe City List Box values. | Country = UK | City List Box shows: England, Scotland, Leeds, Glasgow | DTT |
| TC_006 | Verify City List Box shows correct cities when Country = India (International) | "International" selected | 1. Select Country = "India". 2. Observe City List Box values. | Country = India | City List Box shows: Delhi, Mumbai, Calcutta, Chennai | DTT |
| TC_007 | Verify error message when no Location is selected and Search is clicked | Raj Travels site open; no field selected | 1. Leave Location unselected. 2. Click "Search" button. | Location = (empty) | Application displays appropriate error: "Location is mandatory" | EG |

---

## MODULE 2 – Check-In and Check-Out Date Validation
*(Technique: Equivalence Partitioning + Boundary Value Analysis)*

| TC ID  | Test Case Title | Pre-Conditions | Test Steps | Test Data | Expected Result | Technique |
|--------|-----------------|---------------|------------|-----------|-----------------|-----------|
| TC_008 | Verify Check-In date accepts valid format DDMONYYYY | Location, City selected | 1. Enter Check-In date in DDMONYYYY format. 2. Click Search (fill other mandatory fields). | Check-In = 01JUN2026 | Check-In date is accepted; no format error displayed | EP (Valid) |
| TC_009 | Verify Check-In date rejects invalid format DD/MM/YYYY | Location, City selected | 1. Enter Check-In date as 01/06/2026. 2. Click Search. | Check-In = 01/06/2026 | Error message: "Invalid date format. Use DDMONYYYY" | EP (Invalid) |
| TC_010 | Verify Check-In date rejects invalid format MM-DD-YYYY | Location, City selected | 1. Enter Check-In date as 06-01-2026. 2. Click Search. | Check-In = 06-01-2026 | Error message: "Invalid date format. Use DDMONYYYY" | EP (Invalid) |
| TC_011 | Verify Check-Out date equal to Check-In date is accepted (BVA – Boundary) | Valid Check-In entered | 1. Enter Check-In = 10JUN2026. 2. Enter Check-Out = 10JUN2026. 3. Fill other mandatory fields. 4. Click Search. | Check-In = 10JUN2026, Check-Out = 10JUN2026 | Search executes successfully; hotel results displayed (Check-Out = Check-In is valid) | BVA (Boundary) |
| TC_012 | Verify Check-Out date greater than Check-In date is accepted (BVA – above boundary) | Valid Check-In entered | 1. Enter Check-In = 10JUN2026. 2. Enter Check-Out = 11JUN2026. 3. Fill other mandatory fields. 4. Click Search. | Check-In = 10JUN2026, Check-Out = 11JUN2026 | Search executes successfully; hotel results displayed | BVA (Above Boundary) |
| TC_013 | Verify Check-Out date less than Check-In date shows error (BVA – below boundary) | Valid Check-In entered | 1. Enter Check-In = 10JUN2026. 2. Enter Check-Out = 09JUN2026. 3. Fill other mandatory fields. 4. Click Search. | Check-In = 10JUN2026, Check-Out = 09JUN2026 | Error message: "Check-Out date must be greater than or equal to Check-In date"; no results displayed | BVA (Below Boundary) / EP (Invalid) |
| TC_014 | Verify error when Check-In is not entered (mandatory field) | Raj Travels site open | 1. Fill all fields except Check-In. 2. Click Search. | Check-In = (empty) | Error message: "Check-In date is mandatory" | EG |
| TC_015 | Verify error when Check-Out is not entered (mandatory field) | Valid Check-In entered | 1. Fill all fields except Check-Out. 2. Click Search. | Check-Out = (empty) | Error message: "Check-Out date is mandatory" | EG |

---

## MODULE 3 – Rooms, Adults, and Children (Dynamic Rows)
*(Technique: Boundary Value Analysis)*

| TC ID  | Test Case Title | Pre-Conditions | Test Steps | Test Data | Expected Result | Technique |
|--------|-----------------|---------------|------------|-----------|-----------------|-----------|
| TC_016 | Verify Rooms minimum value = 1 shows 1 row with Adults and Children (BVA – Min) | Location and City selected | 1. Select Rooms = 1. 2. Observe the number of rows and labels. | Rooms = 1 | Room #1 row displayed with Adults and Children List Boxes. Label shows "Room#1". | BVA (Min) |
| TC_017 | Verify Rooms = 2 shows 2 rows (specification example) | Location and City selected | 1. Select Rooms = 2. 2. Observe rows displayed. | Rooms = 2 | Two rows displayed: Room#1 and Room#2, each with Adults and Children List Boxes. | BVA |
| TC_018 | Verify Rooms maximum value = 6 shows 6 rows (BVA – Max) | Location and City selected | 1. Select Rooms = 6. 2. Observe rows. | Rooms = 6 | Six rows displayed: Room#1 through Room#6, each with Adults and Children. | BVA (Max) |
| TC_019 | Verify Rooms = 0 is not selectable (BVA – Min-1) | Location and City selected | 1. Check if 0 is a selectable option in Rooms List Box. | Rooms = 0 | Value 0 is not available in Rooms List Box (valid range starts at 1) | BVA (Min-1) |
| TC_020 | Verify Rooms = 7 is not selectable (BVA – Max+1) | Location and City selected | 1. Check if 7 is a selectable option in Rooms List Box. | Rooms = 7 | Value 7 is not available in Rooms List Box (valid range ends at 6) | BVA (Max+1) |
| TC_021 | Verify Adults minimum value = 1 per room (BVA – Min) | Rooms = 1 row displayed | 1. Set Adults = 1 for Room#1. 2. Click Search (fill other mandatory fields). | Adults = 1 | Accepted; search proceeds | BVA (Min) |
| TC_022 | Verify Adults maximum value = 2 per room (BVA – Max) | Rooms = 1 row displayed | 1. Set Adults = 2 for Room#1. 2. Click Search (fill other mandatory fields). | Adults = 2 | Accepted; search proceeds | BVA (Max) |
| TC_023 | Verify Adults = 0 is not selectable (BVA – Min-1) | Rooms = 1 row displayed | 1. Check if Adults = 0 is available. | Adults = 0 | Value 0 is not available; minimum is 1 | BVA (Min-1) |
| TC_024 | Verify Adults = 3 is not selectable (BVA – Max+1) | Rooms = 1 row displayed | 1. Check if Adults = 3 is available. | Adults = 3 | Value 3 is not available; maximum is 2 | BVA (Max+1) |
| TC_025 | Verify Children minimum value = 0 per room (BVA – Min) | Rooms = 1 row displayed | 1. Set Children = 0 for Room#1. 2. Click Search (fill other mandatory fields). | Children = 0 | Accepted; search proceeds (0 is a valid value) | BVA (Min) |
| TC_026 | Verify Children maximum value = 4 per room (BVA – Max) | Rooms = 1 row displayed | 1. Set Children = 4 for Room#1. 2. Click Search (fill other mandatory fields). | Children = 4 | Accepted; search proceeds | BVA (Max) |
| TC_027 | Verify Children = 5 is not selectable (BVA – Max+1) | Rooms = 1 row displayed | 1. Check if Children = 5 is available. | Children = 5 | Value 5 is not available; maximum is 4 | BVA (Max+1) |
| TC_028 | Verify error when Adults not selected (mandatory) | Rooms = 1 row displayed | 1. Leave Adults unselected for Room#1. 2. Fill other mandatory fields. 3. Click Search. | Adults = (empty) | Error message: "Adults is mandatory for each room" | EG |

---

## MODULE 4 – Search Button End-to-End
*(Technique: Equivalence Partitioning)*

| TC ID  | Test Case Title | Pre-Conditions | Test Steps | Test Data | Expected Result | Technique |
|--------|-----------------|---------------|------------|-----------|-----------------|-----------|
| TC_029 | Verify successful hotel search with all valid mandatory fields (India) | Raj Travels site open | 1. Select Location = India. 2. Select City = Delhi. 3. Enter Check-In = 01JUN2026, Check-Out = 05JUN2026. 4. Select Rooms = 1, Adults = 1. 5. Click Search. | All valid, India + Delhi | Application navigates to results page and displays hotel details for Delhi | EP (Valid) |
| TC_030 | Verify successful hotel search with all valid mandatory fields (International) | Raj Travels site open | 1. Select Location = International. 2. Select Country = USA. 3. Select City = New York. 4. Enter Check-In = 10JUN2026, Check-Out = 15JUN2026. 5. Select Rooms = 2, Adults = 2 each. 6. Click Search. | All valid, USA + New York | Application displays hotel details for New York, USA | EP (Valid) |
| TC_031 | Verify error displayed when mandatory City field is not selected | Location = India selected | 1. Select Location = India. 2. Leave City unselected. 3. Fill other fields. 4. Click Search. | City = (empty) | Error message: "City is mandatory" | EP (Invalid) |
| TC_032 | Verify Nationality List Box contains "Indian" and "Others" | Raj Travels site open | 1. Click on Nationality List Box. 2. Observe available values. | — | Nationality shows exactly: Indian, Others | EP (Valid) |

---

---

# DELIVERABLE 3 – DEFECT LOG

---

## DEFECT 1

| Field | Details |
|-------|---------|
| **Defect ID** | BUG_001 |
| **Defect Title** | Country List Box not displayed when "International" Radio Button is selected |
| **Module** | Location – Radio Button / Country List Box |
| **Reported By** | QA Tester |
| **Reported Date** | 29-May-2026 |
| **Build/Version** | 1.0 |
| **Environment** | Test Environment |
| **Severity** | High |
| **Priority** | High |
| **Status** | Open |
| **Related Requirement** | "If Radio Button is selected as International, then both list boxes 'Country' and 'City' should be Active." |
| **Related Test Case** | TC_002 |
| **Pre-Conditions** | Raj Travels website is open. Book Hotel page is loaded. |
| **Steps to Reproduce** | 1. Navigate to the Book Hotel page on Raj Travels website. 2. Observe the default state of the page. 3. Click the "International" Radio Button under the "Book your hotel" Location field. 4. Observe the Country List Box. |
| **Expected Result** | The "Country" List Box should become active and visible, displaying values: India, USA, UK. The "City" List Box should also remain active. |
| **Actual Result** | After clicking "International" Radio Button, the "Country" List Box is NOT displayed on the screen. The user cannot select any country, making it impossible to search for international hotels. |
| **Impact** | Critical business functionality is broken. Users are completely unable to book hotels internationally because the mandatory Country field cannot be selected. |
| **Attachments** | Screenshot showing Country List Box absent after clicking International |

---

## DEFECT 2

| Field | Details |
|-------|---------|
| **Defect ID** | BUG_002 |
| **Defect Title** | Application displays hotel records instead of error when Check-In date is greater than Check-Out date |
| **Module** | Check-In / Check-Out Date Validation – Search Button |
| **Reported By** | QA Tester |
| **Reported Date** | 29-May-2026 |
| **Build/Version** | 1.0 |
| **Environment** | Test Environment |
| **Severity** | High |
| **Priority** | High |
| **Status** | Open |
| **Related Requirement** | "The Check-Out date should be >= to the Check-In date. If the data is invalid, the application displays appropriate error message in the next screen." |
| **Related Test Case** | TC_013 |
| **Pre-Conditions** | Raj Travels website is open. Book Hotel page is loaded. |
| **Steps to Reproduce** | 1. Navigate to the Book Hotel page. 2. Select Location = "India". 3. Select City = "Mumbai". 4. Enter Check-In date = 15JUN2026. 5. Enter Check-Out date = 10JUN2026 (earlier than Check-In). 6. Select Rooms = 1, Adults = 1, Children = 0. 7. Click the "Search" button. |
| **Expected Result** | The application should validate the dates and display an appropriate error message such as: "Check-Out date must be greater than or equal to Check-In date." No hotel records should be displayed. |
| **Actual Result** | The application ignores the invalid date range and displays all hotel records in the next screen as if the input were valid. |
| **Impact** | Incorrect date validation allows logically invalid bookings to proceed. This is a data integrity failure that could result in invalid hotel reservations being created, causing business and customer impact. |
| **Attachments** | Screenshot showing hotel results returned for Check-In = 15JUN2026 and Check-Out = 10JUN2026 |

---

## DEFECT 3

| Field | Details |
|-------|---------|
| **Defect ID** | BUG_003 |
| **Defect Title** | Hotel details for "Calcutta" are displayed instead of "Delhi" when City = Delhi is selected |
| **Module** | City Selection – Search Results |
| **Reported By** | QA Tester |
| **Reported Date** | 29-May-2026 |
| **Build/Version** | 1.0 |
| **Environment** | Test Environment |
| **Severity** | Critical |
| **Priority** | Critical |
| **Status** | Open |
| **Related Requirement** | "After filling all the mandatory details and on clicking 'Search' button, the application validates the data. If valid, the application displays the required details in the next screen." — City = Delhi must display hotel details for Delhi only. |
| **Related Test Case** | TC_029 |
| **Pre-Conditions** | Raj Travels website is open. Book Hotel page is loaded. |
| **Steps to Reproduce** | 1. Navigate to the Book Hotel page. 2. Select Location = "India". 3. From City List Box, select "Delhi". 4. Enter Check-In date = 01JUN2026. 5. Enter Check-Out date = 05JUN2026. 6. Select Rooms = 1, Adults = 1, Children = 0. 7. Click the "Search" button. |
| **Expected Result** | The search results page should display hotel details for "Delhi" only — hotel names, addresses, and details all pertaining to Delhi, India. |
| **Actual Result** | The search results page displays hotel details for "Calcutta" instead of "Delhi". The city mapping in the search results is incorrect. |
| **Impact** | Critical defect — incorrect search results are returned. Travelers searching for hotels in Delhi are shown hotels in Calcutta, which directly misleads users and could lead to wrong bookings. All city selections under India must be verified for similar incorrect mappings (Mumbai, Chennai, Calcutta). |
| **Attachments** | Screenshot showing Calcutta hotel listings returned when Delhi was selected |

---

---

## DEFECT SUMMARY TABLE

| Defect ID | Title | Severity | Priority | Status |
|-----------|-------|----------|----------|--------|
| BUG_001 | Country List Box not displayed on International selection | High | High | Open |
| BUG_002 | Hotel records shown when Check-In > Check-Out | High | High | Open |
| BUG_003 | Hotels for Calcutta shown when Delhi is selected | Critical | Critical | Open |

---

*End of Test Artifacts – Raj Travels Hotel Booking Module*
