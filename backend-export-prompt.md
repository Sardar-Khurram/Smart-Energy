# Smart Energy Backend: Export API Requirements

Hello! We are adding a new feature to the Smart Energy mobile app that allows users to export their energy consumption and billing data as CSV or PDF files. 

Based on the existing CodeIgniter 4 architecture in your backend, please implement the following REST API endpoint.

## Endpoint Details
**Route to add in `app/Config/Routes.php` inside the `api` group:**
```php
$routes->get('devices/(:segment)/export', 'DeviceController::exportData/$1');
```

### Query Parameters
The endpoint must accept the following query string parameters:
1. `type` (required): The type of report to generate. Valid values: `consumption`, `billing`, `alerts`.
2. `format` (required): The file format to return. Valid values: `csv`, `pdf`.
3. `start_date` (optional): Filter data from this date (e.g., `YYYY-MM-DD`).
4. `end_date` (optional): Filter data up to this date (e.g., `YYYY-MM-DD`).

---

## 1. CSV Implementation Guidelines (`format=csv`)

When `format=csv` and `type=consumption`, the response should return a raw file stream downloading directly to the user's phone.

**Headers to set in your Controller:**
```php
$this->response->setHeader('Content-Type', 'text/csv');
$this->response->setHeader('Content-Disposition', 'attachment; filename="smart_energy_report.csv"');
```

**Logic (Inside `DeviceController.php` or a new `ExportController`):**
1. Load your existing `SensorReadingModel` and `AiTipModel`.
2. For `type=consumption`: Query `sensor_readings` matching `device_id`.
   - CSV Headers: `['Timestamp', 'Voltage (V)', 'Current (A)', 'Power (W)', 'Temperature (°C)']`
   - Data Row: `[$row['recorded_at'], $row['voltage'], $row['current'], $row['power_watt'], $row['temperature']]`
3. For `type=alerts`: Query the `ai_tips` table matching `device_id`.
   - CSV Headers: `['Generated At', 'Category', 'Alert Message']`
   - Data Row: `[$row['generated_at'], $row['category'], $row['tip_text']]`
4. Apply `start_date` and `end_date` filters to `recorded_at` (or `generated_at`).
5. Open PHP output stream: `$fp = fopen('php://output', 'w');`, loop through rows with `fputcsv()`, then close.

---

## 2. PDF Implementation Guidelines (`format=pdf`)

When `format=pdf`, the response should return a binary PDF file stream containing an electricity invoice or alert summary.

**Headers to set in CodeIgniter:**
```php
$this->response->setHeader('Content-Type', 'application/pdf');
$this->response->setHeader('Content-Disposition', 'attachment; filename="smart_energy_invoice.pdf"');
```

**Logic:**
1. You will need a PDF generation library for CodeIgniter 4. Installing **Dompdf** via Composer is highly recommended (`composer require dompdf/dompdf`).
2. Load your `BillPredictionModel`, `DeviceModel`, and `AiTipModel`.
3. If `type=billing`: Generate an HTML template containing Device Info and Total kWh consumed / estimated cost (from `bill_predictions`).
4. If `type=alerts`: Generate an HTML template with an Alert Summary table populated by the `ai_tips` table.
5. Initialize Dompdf, load the HTML string, render it, and output the stream (`$dompdf->stream("smart_energy_report.pdf", ["Attachment" => true]);`).

---

## Error Handling
If the `device_id` does not exist in the `devices` table, or there is no data for the date range in `sensor_readings`, return a standard JSON error with a non-200 status code (e.g., 400 or 404) so the mobile app's `expo-file-system` module can catch it:
```php
return $this->response->setJSON([
    "status" => "error",
    "message" => "No data found for this device or date range.",
    "code" => 404
])->setStatusCode(404);
```
