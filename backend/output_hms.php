<?php
header('Content-Type: application/json');
date_default_timezone_set('Asia/Bangkok');

function read_csv($filename) {
    if (!file_exists($filename) || !is_readable($filename)) {
        return null;
    }
    
    $data = [];
    $header = [];
    
    if (($handle = fopen($filename, 'r')) !== false) {
        while (($row = fgetcsv($handle, 1000, ",")) !== false) {
            if (empty($header)) {
                $header = $row;
            } else {
                $entry = [];
                foreach ($row as $key => $value) {
                    $entry[$header[$key]] = is_numeric($value) ? floatval($value) : $value;
                }
                $data[] = $entry;
            }
        }
        fclose($handle);
    }
    
    return $data;
}

function convert_to_hourly($data) {
    $hourly_data = [];
    $previous_values = ['SB-14' => 0, 'SB-15' => 0, 'Y.14A' => 0];
    
    foreach ($data as $row) {
        $datetime = DateTime::createFromFormat('d/m/Y H:i', $row['DateTime']);
        if (!$datetime) continue;
        
        $formatted_datetime = $datetime->format('Y-m-d H:i');
        
        $sb14 = $row['SB-14'] ?? 0;
        $sb15 = $row['SB-15'] ?? 0;
        $y14a = $row['Y.14A'] ?? 0;
        
        if (date('H', strtotime($formatted_datetime)) == 0) {
            $previous_values['SB-14'] = $sb14;
            $previous_values['SB-15'] = $sb15;
            $previous_values['Y.14A'] = $y14a;
        } else {
            $sb14 = ($sb14 - $previous_values['SB-14']) / 24 + $previous_values['SB-14'];
            $sb15 = ($sb15 - $previous_values['SB-15']) / 24 + $previous_values['SB-15'];
            $y14a = ($y14a - $previous_values['Y.14A']) / 24 + $previous_values['Y.14A'];
            
            $previous_values['SB-14'] = $sb14;
            $previous_values['SB-15'] = $sb15;
            $previous_values['Y.14A'] = $y14a;
        }
        
        $kp07_flow = round(($sb14 + $sb15) / 2, 2);
        $y3a = round($sb15 * 1.2, 2);
        $y4a = round(($sb14 + $sb15) * 1.05, 2);

        $hourly_data[] = [
            'datetime' => $formatted_datetime,
            'Sink-1' => round($row['Sink-1'], 2),
            'SB-14' => round($sb14, 2),
            'SB-15' => round($sb15, 2),
            'KP.07_flow' => $kp07_flow,
            'Y.14A' => round($y14a, 2),
            'Y.3A' => $y3a,
            'Y.4A' => $y4a
        ];
    }
    
    return $hourly_data;
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $csv_file = 'data.csv';
    $data = read_csv($csv_file);
    
    if ($data === null) {
        http_response_code(500);
        echo json_encode(['error' => 'Cannot read CSV file']);
        exit;
    }
    
    $hourly_data = convert_to_hourly($data);
    echo json_encode(['hourly_data' => $hourly_data], JSON_PRETTY_PRINT);
} else {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
}
?>
