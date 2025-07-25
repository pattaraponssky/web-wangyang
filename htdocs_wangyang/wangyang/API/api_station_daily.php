<?php
header('Content-Type: application/json');
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

date_default_timezone_set('Asia/Bangkok');

// --- Helper Functions ---

/**
 * Converts a DateTime object to a Buddhist Era formatted date string (YYYY-MM-DD HH:MM:SS BE).
 * The year will be converted from CE to BE.
 * @param DateTime $dateTime The DateTime object.
 * @return string Formatted date string in BE.
 */
function toBuddhistYearString(DateTime $dateTime): string {
    $yearBE = (int)$dateTime->format('Y') + 543;
    return $yearBE . $dateTime->format('-m-d H:i:s');
}

/**
 * Parses a date string with Buddhist Era year (YYYY-MM-DD HH:MM:SS BE) into a DateTime object (CE).
 * Assumes the input year is BE if it's 2500 or greater.
 * @param string $dateStringBE The date string in BE.
 * @param string $format The format of the input date string (e.g., 'Y-m-d H:i:s').
 * @return DateTime|false Returns DateTime object on success, false on failure.
 */
function parseBuddhistDateTime(string $dateStringBE, string $format = 'Y-m-d H:i:s') {
    $parts = explode(' ', $dateStringBE);
    $dateParts = explode('-', $parts[0]);

    if (count($dateParts) === 3 && (int)$dateParts[0] >= 2500) {
        $yearCE = (int)$dateParts[0] - 543;
        $dateStringCE = $yearCE . '-' . $dateParts[1] . '-' . $dateParts[2] . ' ' . ($parts[1] ?? '00:00:00');
    } else {
        $dateStringCE = $dateStringBE; // Assume already CE or unexpected format
    }
    return DateTime::createFromFormat($format, $dateStringCE);
}


/**
 * Fetches data from a given URL using cURL.
 * Includes robust error handling and JSON decoding.
 * @param string $url The URL to fetch.
 * @return array|null Decoded JSON data as an array, or null on error.
 */
function fetchData($url) {
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
    curl_setopt($ch, CURLOPT_FAILONERROR, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 30); // Increased Timeout
    curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 10); // Increased Connection Timeout
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false); // For development if API has self-signed SSL

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curlError = curl_error($ch);

    curl_close($ch);

    if ($response === false) {
        error_log("CURL Error: Failed to fetch data from $url. Error: " . $curlError);
        return null;
    }

    if ($httpCode >= 400) {
        error_log("CURL HTTP Error: Failed to fetch data from $url. HTTP Code: $httpCode. Response: " . substr($response, 0, 200));
        return null;
    }

    $decoded = json_decode($response, true);
    if (json_last_error() !== JSON_ERROR_NONE) {
        error_log("JSON Decode Error: Failed to decode JSON from $url. Error: " . json_last_error_msg() . " Raw response: " . substr($response, 0, 500));
        return null;
    }
    return $decoded;
}

// === Config API URL ===
$baseUrl = 'http://192.168.99.202:3000/api/history/grouped';

// === กำหนดช่วงเวลาสำหรับ API Request (7 โมงเช้า - 7 โมงเช้า) ===
$now = new DateTime();
$currentHour = (int)$now->format('H');

// Define the end time for the report: 7 AM of the current day or yesterday if before 7 AM
$toDateTimeCE = new DateTime();
if ($currentHour < 7) {
    // If it's 00:00 to 06:59, the "latest 7 AM" was yesterday
    $toDateTimeCE->modify('-1 day');
}
$toDateTimeCE->setTime(7, 0, 0); // Sets to 7 AM of the relevant day (either today or yesterday)

// Define the start time for the report: 7 days before $toDateTimeCE
$reportStartDateCE = clone $toDateTimeCE;
$reportStartDateCE->modify('-7 days'); // This is the 07:00 AM of the first *reporting day*

// For the API request, we need data starting from 00:00:00 of the day *before* reportStartDateCE's 07:00 AM,
// to capture rainfall/data from 00:00-06:59 that would belong to reportStartDateCE's reporting day.
// Or more simply, just go back 8 days from $toDateTimeCE and set to 07:00:00
$fromDateTimeCE_API = clone $toDateTimeCE;
$fromDateTimeCE_API->modify('-8 days'); // Go back 8 days from the 'to' time
$fromDateTimeCE_API->setTime(7,0,0); // Ensure it's 7 AM

// Convert to Buddhist Era string for the API
$fromStrBE = toBuddhistYearString($fromDateTimeCE_API);
$toStrBE = toBuddhistYearString($toDateTimeCE);

// === ดึงข้อมูลจาก API ===
$url = "$baseUrl?from=" . urlencode($fromStrBE) . "&to=" . urlencode($toStrBE);
$data = fetchData($url);

if (!$data || !is_array($data)) {
    http_response_code(500); // Internal Server Error
    echo json_encode(["error" => "Failed to load data from external API or invalid data format."]);
    exit();
}

// === เตรียมข้อมูลรายวันตามช่วงเวลา 07:00 - 06:59 ===
$dailySummary = [];

foreach ($data as $stationCode => $records) {
    $stationDailyDataRaw = []; // Store all records parsed with CE date/time
    foreach ($records as $entry) {
        $entryDateTime = parseBuddhistDateTime($entry['datetime']);
        if (!$entryDateTime) {
            error_log("Skipping invalid datetime entry for station {$stationCode}: " . $entry['datetime']);
            continue;
        }
        $entry['parsed_datetime_ce'] = $entryDateTime; // Add parsed DateTime object for easier comparison
        $stationDailyDataRaw[] = $entry;
    }

    // Now, process for each reporting day (07:00 to 06:59)
    $allReportingDays = [];
    $currentDay = clone $reportStartDateCE; // Start from the first reporting day 07:00:00
    $endOfReportPeriod = clone $toDateTimeCE;

    while ($currentDay <= $endOfReportPeriod) {
        $reportingDateCE = $currentDay->format('Y-m-d');
        $allReportingDays[$reportingDateCE] = [
            'date_ce' => $reportingDateCE, // CE date for internal use
            'rainfall_sum' => 0,
            'water_flow' => null,
            'water_level' => null,
            // 'records_for_flow_level' => [], // Not explicitly needed, can search raw
            // 'records_for_rainfall' => [] // Not explicitly needed, can search raw
        ];
        $currentDay->modify('+1 day');
    }
    ksort($allReportingDays); // Ensure days are in chronological order

    foreach ($allReportingDays as $reportingDateCE => &$dayData) {
        $target07AM = new DateTime($reportingDateCE . ' 07:00:00');
        $endOfRainfallPeriod = clone $target07AM;
        $endOfRainfallPeriod->modify('-1 second'); // 06:59:59
        
        $startOfRainfallPeriod = clone $target07AM;
        $startOfRainfallPeriod->modify('-1 day'); // 07:00:00 of previous day

        $foundFlowLevelEntry = false;
        $closestFlowLevelEntry = null;
        $minDiffSecondsFlowLevel = PHP_INT_MAX;

        foreach ($stationDailyDataRaw as $entry) {
            $entryDateTime = $entry['parsed_datetime_ce'];

            // 1. Collect records for rainfall sum (from 7AM prev day to 6:59:59 AM current day)
            if ($entryDateTime >= $startOfRainfallPeriod && $entryDateTime <= $endOfRainfallPeriod) {
                if (isset($entry['rainfall'])) {
                    // --- แก้ไขส่วนนี้เพื่อรองรับ array [0] ---
                    $rainfallValue = 0;
                    if (is_array($entry['rainfall']) && !empty($entry['rainfall'])) {
                        $rainfallValue = (float)$entry['rainfall'][0];
                    } elseif (is_numeric($entry['rainfall'])) {
                        $rainfallValue = (float)$entry['rainfall'];
                    }
                    $dayData['rainfall_sum'] += $rainfallValue;
                    // --- จบการแก้ไข ---
                }
            }

            // 2. Find record for water_flow/water_level (exact 7AM or closest on current reporting day)
            if ($entryDateTime->format('Y-m-d') === $reportingDateCE) {
                // Exact 07:00:00 match
                if ($entryDateTime->format('H:i:s') === '07:00:00') {
                    $dayData['water_flow'] = $entry['water_flow'] ?? null;
                    $dayData['water_level'] = $entry['water_level'] ?? ($entry['upper_water'] ?? null);
                    $foundFlowLevelEntry = true;
                    // If exact 07:00 is found, we can potentially break early for flow/level but still need to sum rainfall
                    // So, we use a flag and handle it outside this loop's flow/level part
                }
                
                // Find closest for flow/level if exact not found yet
                $diffSeconds = abs($entryDateTime->getTimestamp() - $target07AM->getTimestamp());
                if ($diffSeconds < $minDiffSecondsFlowLevel) {
                    $minDiffSecondsFlowLevel = $diffSeconds;
                    $closestFlowLevelEntry = $entry;
                }
            }
        }

        // If exact 07:00:00 for flow/level was not found, use the closest
        if (!$foundFlowLevelEntry && $closestFlowLevelEntry) {
            $dayData['water_flow'] = $closestFlowLevelEntry['water_flow'] ?? null;
            $dayData['water_level'] = $closestFlowLevelEntry['water_level'] ?? ($closestFlowLevelEntry['upper_water'] ?? null);
        }

        // Format the date for final output
        $dateObjForOutput = new DateTime($dayData['date_ce']);
        $dayData['date'] = toBuddhistYearString($dateObjForOutput->setTime(7, 0, 0)); // Format as "YYYY-MM-DD 07:00:00" BE

        // Remove temporary helper fields
        unset($dayData['date_ce']);
    }
    
    // Filter out any days that might not have enough data (e.g., first day if no records)
    // and re-index to be an array for consistent JSON output
    $dailySummary[$stationCode] = array_values(array_filter($allReportingDays, function($day) {
        // Keep only entries that make sense, e.g., if rainfall sum is calculated or flow/level is found
        return ($day['rainfall_sum'] !== 0 || $day['water_flow'] !== null || $day['water_level'] !== null);
    }));
}

// === แสดงผล JSON ===
echo json_encode($dailySummary, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
?>